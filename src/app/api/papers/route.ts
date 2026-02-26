import { auth } from "@clerk/nextjs/server";
import { getErrorMessageWithHint } from "@/lib/api-error-message";
import { getSupabase } from "@/lib/supabase";
import { syncUserToSupabase } from "@/lib/sync-user-to-supabase";
import { formatAuthorNames } from "@/lib/format-author-name";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { getToken } = await auth();
    const accessToken = await getToken({ template: "supabase" });

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized", details: "Supabase JWT not available. In Clerk Dashboard, add a Supabase JWT template and use it here." },
        { status: 401 }
      );
    }

    const supabase = getSupabase(accessToken);

    const { data: papers, error } = await supabase.from("papers").select("*");

    if (error) {
      console.error("Error fetching papers:", error.message, error);
      return NextResponse.json(
        { error: "Internal Server Error", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(papers);
  } catch (error) {
    const message = getErrorMessageWithHint(error, "Supabase");
    console.error("[PAPERS_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    );
  }
}

/** Map client/DOI payload to DB row (snake_case, only known columns). */
function mapBodyToPaperRow(body: Record<string, unknown>, userId: string) {
  const year = body.year != null ? Number(body.year) : NaN;
  const publicationDate =
    (body.publication_date != null && body.publication_date !== "")
      ? String(body.publication_date)
      : !isNaN(year) && year > 0
        ? `${year}-01-01`
        : null;

  const summary = body.summary;
  const summaryText =
    Array.isArray(summary)
      ? (summary as string[]).join("\n")
      : typeof summary === "string"
        ? summary
        : null;

  const collectionId = body.collection_id;
  return {
    user_id: userId,
    collection_id: (collectionId != null && collectionId !== "") ? String(collectionId) : null,
    title: typeof body.title === "string" ? body.title : "",
    authors: Array.isArray(body.authors)
      ? formatAuthorNames(body.authors as string[])
      : (body.authors ?? null),
    publication_date: publicationDate ?? null,
    doi: typeof body.doi === "string" ? body.doi : null,
    abstract: typeof body.abstract === "string" ? body.abstract : null,
    summary: summaryText,
    pdf_url: typeof body.pdfUrl === "string" ? body.pdfUrl : (body.pdf_url as string) ?? null,
    work_type: typeof body.work_type === "string" ? body.work_type : (body.typeOfWork as string) ?? null,
    language: typeof body.language === "string" ? body.language : null,
    source: typeof body.source === "string" ? body.source : null,
    paper_url: typeof body.paperUrl === "string" ? body.paperUrl : null,
    landing_page_url: typeof body.landingPageUrl === "string" ? body.landingPageUrl : null,
    cited_by_count: typeof body.citedByCount === "number" && Number.isInteger(body.citedByCount) ? body.citedByCount : null,
  };
}

export async function POST(req: Request) {
  try {
    const { getToken, userId } = await auth();
    const body = await req.json();
    const accessToken = await getToken({ template: "supabase" });

    if (!accessToken || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const title = typeof body?.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    await syncUserToSupabase({ id: userId });
    const supabase = getSupabase(accessToken);

    const row = mapBodyToPaperRow(body, userId);

    const { data: paper, error } = await supabase
      .from("papers")
      .insert([row])
      .select();

    if (error) {
      console.error("Error creating paper:", error.message);
      return NextResponse.json(
        { error: "Failed to create paper", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(paper);
  } catch (error) {
    console.error("[PAPERS_POST]", error);
    const details =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: unknown }).message ?? "Unknown error")
          : String(error);
    return NextResponse.json(
      { error: "Internal Server Error", details },
      { status: 500 }
    );
  }
}
