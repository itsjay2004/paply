import { auth } from "@clerk/nextjs/server";
import { getPresignedPutUrl } from "@/lib/s3";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

const MAX_PDF_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

/**
 * POST /api/upload-pdf/presigned-url
 * Returns a presigned PUT URL and the S3 key for client-side upload.
 * Enforces per-user storage limit (default 500 MB).
 */
export async function POST(req: Request) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const size = typeof body.size === "number" ? body.size : 0;
    if (size > MAX_PDF_SIZE_BYTES) {
      return NextResponse.json(
        { error: "PDF must be 100 MB or smaller" },
        { status: 400 }
      );
    }

    const accessToken = await getToken({ template: "supabase" });
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const supabase = getSupabase(accessToken);
    const { data: userRow } = await supabase
      .from("users")
      .select("storage_used_bytes, storage_limit_bytes")
      .single();

    const used = Number(userRow?.storage_used_bytes ?? 0);
    const limit = Number(userRow?.storage_limit_bytes ?? 500 * 1024 * 1024);
    if (used + size > limit) {
      return NextResponse.json(
        { error: "Storage limit reached. Free up space or upgrade your plan." },
        { status: 403 }
      );
    }

    const paperId = typeof body.paperId === "string" && /^[a-f0-9-]{36}$/i.test(body.paperId.trim())
      ? body.paperId.trim()
      : null;
    const objectKeyId = paperId ?? crypto.randomUUID();
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
