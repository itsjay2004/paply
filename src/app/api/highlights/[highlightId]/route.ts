import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

/** DELETE /api/highlights/[highlightId] */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ highlightId: string }> }
) {
  try {
    const { getToken } = await auth();
    const accessToken = await getToken({ template: "supabase" });
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { highlightId } = await params;
    const supabase = getSupabase(accessToken);
    const { error } = await supabase
      .from("highlights")
      .delete()
      .eq("id", highlightId);
    if (error) {
      console.error("[HIGHLIGHTS_DELETE]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[HIGHLIGHTS_DELETE]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
