import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import { getPresignedPdfUrl, isS3KeyPdfUrl } from "@/lib/s3";
import { NextResponse } from "next/server";

/**
 * GET /api/papers/[paperId]/pdf-url
 * Redirects to a presigned S3 URL if the paper's pdf_url is our S3 key (private bucket),
 * or to the external URL otherwise. Requires auth and paper ownership.
 */
export async function GET(
  _req: Request,
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
      .select("pdf_url")
      .eq("id", params.paperId)
      .single();

    if (error || !paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const pdfUrl = paper.pdf_url as string | null;
    if (!pdfUrl) {
      return NextResponse.json({ error: "No PDF linked to this paper" }, { status: 404 });
    }

    if (isS3KeyPdfUrl(pdfUrl)) {
      const url = await getPresignedPdfUrl(pdfUrl);
      return NextResponse.redirect(url, 302);
    }

    return NextResponse.redirect(pdfUrl, 302);
  } catch (err) {
    console.error("[PDF_URL_GET]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
