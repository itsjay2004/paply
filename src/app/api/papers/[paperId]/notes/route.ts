import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

/** GET /api/papers/[paperId]/notes — list notes for a paper */
export async function GET(
  _req: Request,
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
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("paper_id", paperId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[NOTES_GET]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[NOTES_GET]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/** POST /api/papers/[paperId]/notes — create a note */
export async function POST(
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
    const body = (await req.json()) as {
      note_content: string;
      position: { pageIndex: number; x: number; y: number };
    };
    if (!body?.note_content || typeof body.note_content !== "string") {
      return NextResponse.json(
        { error: "note_content is required" },
        { status: 400 }
      );
    }
    const supabase = getSupabase(accessToken);
    const { data, error } = await supabase
      .from("notes")
      .insert({
        paper_id: paperId,
        note_content: body.note_content,
        position: body.position ?? { pageIndex: 0, x: 20, y: 20 },
      })
      .select()
      .single();
    if (error) {
      console.error("[NOTES_POST]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("[NOTES_POST]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
