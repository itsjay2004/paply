import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import { deletePdfFromS3, parseS3KeyFromPdfUrl } from "@/lib/s3";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { paperId: string } }
) {
  try {
    const { getToken } = auth();
    const accessToken = await getToken({ template: "supabase" });

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase(accessToken);

    const { data: paper, error } = await supabase
      .from("papers")
      .select("*, highlights (*), notes (*)")
      .eq("id", params.paperId)
      .single();

    if (error) {
      console.error("Error fetching paper:", error.message);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    return NextResponse.json(paper);
  } catch (error) {
    console.error("[PAPER_ID_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/** Map client payload (camelCase) to DB columns (snake_case) for PATCH. */
function mapBodyToPaperUpdate(body: Record<string, unknown>) {
  const year = body.year != null ? Number(body.year) : NaN;
  const publicationDate =
    body.publication_date != null && body.publication_date !== ""
      ? body.publication_date
      : !isNaN(year) && year > 0
        ? `${year}-01-01`
        : null;

  const summary = body.summary;
  const summaryText =
    Array.isArray(summary)
      ? (summary as string[]).join("\n")
      : typeof summary === "string"
        ? summary
        : undefined;

  const out: Record<string, unknown> = {};
  if (body.title !== undefined) out.title = typeof body.title === "string" ? body.title : "";
  if (body.authors !== undefined) out.authors = Array.isArray(body.authors) ? body.authors : null;
  if (publicationDate !== undefined) out.publication_date = publicationDate;
  if (body.doi !== undefined) out.doi = typeof body.doi === "string" ? body.doi : null;
  if (body.abstract !== undefined) out.abstract = typeof body.abstract === "string" ? body.abstract : null;
  if (summaryText !== undefined) out.summary = summaryText;
  if (body.pdfUrl !== undefined) out.pdf_url = typeof body.pdfUrl === "string" ? body.pdfUrl : null;
  if (body.work_type !== undefined) out.work_type = body.work_type;
  else if (body.typeOfWork !== undefined) out.work_type = body.typeOfWork;
  if (body.language !== undefined) out.language = body.language;
  if (body.publisher !== undefined) out.publisher = body.publisher;
  if (body.publication_city !== undefined) out.publication_city = body.publication_city;
  else if (body.city !== undefined) out.publication_city = body.city;
  if (body.publication_country !== undefined) out.publication_country = body.publication_country;
  else if (body.country !== undefined) out.publication_country = body.country;
  if (body.collection_id !== undefined)
    out.collection_id = body.collection_id != null && body.collection_id !== "" ? body.collection_id : null;

  return out;
}

export async function PATCH(
  req: Request,
  { params }: { params: { paperId: string } }
) {
  try {
    const { getToken } = auth();
    const body = await req.json();
    const values = mapBodyToPaperUpdate(body as Record<string, unknown>);
    const accessToken = await getToken({ template: "supabase" });

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase(accessToken);

    const { data: paper, error } = await supabase
      .from("papers")
      .update(values)
      .eq("id", params.paperId)
      .select();

    if (error) {
      console.error("Error updating paper:", error.message);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    return NextResponse.json(paper);
  } catch (error) {
    console.error("[PAPER_ID_PATCH]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { paperId: string } }
) {
  try {
    const { getToken } = auth();
    const accessToken = await getToken({ template: "supabase" });

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase(accessToken);

    const { data: paper, error: fetchError } = await supabase
      .from("papers")
      .select("pdf_url")
      .eq("id", params.paperId)
      .single();

    if (!fetchError && paper?.pdf_url) {
      const s3Key = parseS3KeyFromPdfUrl(paper.pdf_url);
      if (s3Key) {
        await deletePdfFromS3(s3Key);
      }
    }

    const { error } = await supabase
      .from("papers")
      .delete()
      .eq("id", params.paperId);

    if (error) {
      console.error("Error deleting paper:", error.message);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    return NextResponse.json({ message: "Paper deleted" }, { status: 200 });
  } catch (error) {
    console.error("[PAPER_ID_DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
