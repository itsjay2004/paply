import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

/** PATCH /api/notes/[noteId] — update note content or position */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { getToken } = await auth();
    const accessToken = await getToken({ template: "supabase" });
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { noteId } = await params;
    const body = (await req.json()) as {
      note_content?: string;
      position?: { pageIndex: number; x: number; y: number };
    };
    const updates: Record<string, unknown> = {};
    if (body.note_content !== undefined) updates.note_content = body.note_content;
    if (body.position !== undefined) updates.position = body.position;
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    const supabase = getSupabase(accessToken);
    const { data, error } = await supabase
      .from("notes")
      .update(updates)
      .eq("id", noteId)
      .select()
      .single();
    if (error) {
      console.error("[NOTES_PATCH]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("[NOTES_PATCH]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/** DELETE /api/notes/[noteId] */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { getToken } = await auth();
    const accessToken = await getToken({ template: "supabase" });
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { noteId } = await params;
    const supabase = getSupabase(accessToken);
    const { error } = await supabase.from("notes").delete().eq("id", noteId);
    if (error) {
      console.error("[NOTES_DELETE]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[NOTES_DELETE]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
