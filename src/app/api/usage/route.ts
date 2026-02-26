import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

/**
 * GET /api/usage
 * Returns usage stats for the current user: paper count and (when implemented) storage.
 */
export async function GET() {
  try {
    const { getToken } = await auth();
    const accessToken = await getToken({ template: "supabase" });

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized", details: "Supabase JWT not available." },
        { status: 401 }
      );
    }

    const supabase = getSupabase(accessToken);

    const [{ count: paperCount, error: countError }, { data: userRow }] = await Promise.all([
      supabase.from("papers").select("*", { count: "exact", head: true }),
      supabase.from("users").select("storage_used_bytes, storage_limit_bytes").single(),
    ]);

    if (countError) {
      console.error("Error fetching paper count:", countError.message);
      return NextResponse.json(
        { error: "Internal Server Error", details: countError.message },
        { status: 500 }
      );
    }

    const storageUsed =
      userRow?.storage_used_bytes != null ? Number(userRow.storage_used_bytes) : null;
    const storageLimit =
      userRow?.storage_limit_bytes != null ? Number(userRow.storage_limit_bytes) : null;

    return NextResponse.json({
      paperCount: paperCount ?? 0,
      storageUsedBytes: storageUsed,
      storageLimitBytes: storageLimit,
    });
  } catch (error) {
    console.error("[USAGE_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
