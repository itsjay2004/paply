import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import {
  deletePdfFromS3,
  getPdfSizeFromS3,
  isS3KeyPdfUrl,
  parseS3KeyFromPdfUrl,
} from "@/lib/s3";
import { formatAuthorNames } from "@/lib/format-author-name";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { paperId: string } }
) {
  try {
    const { getToken } = await auth();
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
  if (body.authors !== undefined)
    out.authors = Array.isArray(body.authors) ? formatAuthorNames(body.authors as string[]) : null;
  if (publicationDate !== undefined) out.publication_date = publicationDate;
  if (body.doi !== undefined) out.doi = typeof body.doi === "string" ? body.doi : null;
  if (body.abstract !== undefined) out.abstract = typeof body.abstract === "string" ? body.abstract : null;
  if (summaryText !== undefined) out.summary = summaryText;
  if (body.pdfUrl !== undefined) out.pdf_url = typeof body.pdfUrl === "string" ? body.pdfUrl : null;
  if (body.pdf_size_bytes !== undefined) out.pdf_size_bytes = typeof body.pdf_size_bytes === "number" ? body.pdf_size_bytes : null;
  if (body.work_type !== undefined) out.work_type = body.work_type;
  else if (body.typeOfWork !== undefined) out.work_type = body.typeOfWork;
  if (body.language !== undefined) out.language = body.language;
  if (body.source !== undefined) out.source = typeof body.source === "string" ? body.source : null;
  if (body.paperUrl !== undefined) out.paper_url = typeof body.paperUrl === "string" ? body.paperUrl : null;
  if (body.landingPageUrl !== undefined) out.landing_page_url = typeof body.landingPageUrl === "string" ? body.landingPageUrl : null;
  if (body.citedByCount !== undefined) out.cited_by_count = typeof body.citedByCount === "number" && Number.isInteger(body.citedByCount) ? body.citedByCount : null;
  if (body.collection_id !== undefined)
    out.collection_id = body.collection_id != null && body.collection_id !== "" ? body.collection_id : null;

  return out;
}

export async function PATCH(
  req: Request,
  { params }: { params: { paperId: string } }
) {
  try {
    const { getToken } = await auth();
    const body = await req.json();
    const values = mapBodyToPaperUpdate(body as Record<string, unknown>);
    const accessToken = await getToken({ template: "supabase" });

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase(accessToken);

    const newPdfUrl = values.pdf_url as string | undefined;
    if (newPdfUrl !== undefined && isS3KeyPdfUrl(newPdfUrl)) {
      const { data: current } = await supabase
        .from("papers")
        .select("pdf_url, pdf_size_bytes")
        .eq("id", params.paperId)
        .single();

      const oldSize =
        current?.pdf_size_bytes != null
          ? Number(current.pdf_size_bytes)
          : current?.pdf_url && isS3KeyPdfUrl(current.pdf_url)
            ? (await getPdfSizeFromS3(current.pdf_url as string)) ?? 0
            : 0;
      const newSize = (await getPdfSizeFromS3(newPdfUrl)) ?? 0;
      (values as Record<string, unknown>).pdf_size_bytes = newSize > 0 ? newSize : null;
      const delta = newSize - oldSize;
      if (delta !== 0) {
        await supabase.rpc("increment_user_storage", { delta });
      }
    } else if (newPdfUrl === null || newPdfUrl === "") {
      const { data: current } = await supabase
        .from("papers")
        .select("pdf_url, pdf_size_bytes")
        .eq("id", params.paperId)
        .single();
      if (current?.pdf_url && isS3KeyPdfUrl(current.pdf_url)) {
        const oldSize =
          current.pdf_size_bytes != null
            ? Number(current.pdf_size_bytes)
            : (await getPdfSizeFromS3(current.pdf_url as string)) ?? 0;
        if (oldSize > 0) {
          await supabase.rpc("increment_user_storage", { delta: -oldSize });
        }
        (values as Record<string, unknown>).pdf_size_bytes = null;
      }
    }

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
    const { getToken } = await auth();
    const accessToken = await getToken({ template: "supabase" });

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase(accessToken);

    const { data: paper, error: fetchError } = await supabase
      .from("papers")
      .select("pdf_url, pdf_size_bytes")
      .eq("id", params.paperId)
      .single();

    if (!fetchError && paper?.pdf_url && isS3KeyPdfUrl(paper.pdf_url)) {
      const s3Key = parseS3KeyFromPdfUrl(paper.pdf_url);
      if (s3Key) {
        // Only subtract storage for papers that have pdf_size_bytes (new uploads). Legacy rows are not counted.
        if (paper.pdf_size_bytes != null && Number(paper.pdf_size_bytes) > 0) {
          await supabase.rpc("increment_user_storage", {
            delta: -Number(paper.pdf_size_bytes),
          });
        }
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
