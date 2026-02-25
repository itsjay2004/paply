import { auth } from "@clerk/nextjs/server";
import { getPresignedPutUrl } from "@/lib/s3";
import { NextResponse } from "next/server";

const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * POST /api/upload-pdf/presigned-url
 * Returns a presigned PUT URL and the S3 key for client-side upload.
 * Client should PUT the PDF to putUrl, then call the import action with key.
 */
export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const size = typeof body.size === "number" ? body.size : 0;
    if (size > MAX_PDF_SIZE_BYTES) {
      return NextResponse.json(
        { error: "PDF must be 10 MB or smaller" },
        { status: 400 }
      );
    }

    const objectKeyId = crypto.randomUUID();
    const { putUrl, key } = await getPresignedPutUrl(userId, objectKeyId);

    return NextResponse.json({ putUrl, key });
  } catch (err) {
    console.error("[PRESIGNED_PUT]", err);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
