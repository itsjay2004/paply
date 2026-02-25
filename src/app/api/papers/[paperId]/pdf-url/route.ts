import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import { getPresignedPdfUrl, isS3KeyPdfUrl } from "@/lib/s3";
import { NextResponse } from "next/server";

/**
 * GET /api/papers/[paperId]/pdf-url
 * Redirects to a presigned S3 URL if the paper's pdf_url is our S3 key (private bucket),
 * or to the external URL otherwise. Requires auth and paper ownership.
 * If Accept: application/json or ?json=1, returns { url } instead of redirect (for in-app viewer).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ paperId: string }> }
) {
  try {
    const { getToken } = await auth();
    const accessToken = await getToken({ template: "supabase" });

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paperId } = await params;
    const supabase = getSupabase(accessToken);
    const { data: paper, error } = await supabase
      .from("papers")
      .select("pdf_url")
      .eq("id", paperId)
      .single();

    if (error || !paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const pdfUrl = paper.pdf_url as string | null;
    if (!pdfUrl) {
      return NextResponse.json({ error: "No PDF linked to this paper" }, { status: 404 });
    }

    const wantJson =
      req.headers.get("accept")?.includes("application/json") ||
      new URL(req.url).searchParams.get("json") === "1";

    if (isS3KeyPdfUrl(pdfUrl)) {
      const url = await getPresignedPdfUrl(pdfUrl);
      if (wantJson) return NextResponse.json({ url });
      return NextResponse.redirect(url, 302);
    }

    if (wantJson) return NextResponse.json({ url: pdfUrl });
    return NextResponse.redirect(pdfUrl, 302);
  } catch (err) {
    console.error("[PDF_URL_GET]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
