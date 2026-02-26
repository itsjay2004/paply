import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const { getToken } = await auth();
    const accessToken = await getToken({ template: "supabase" });

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase(accessToken);

    const { data: note, error } = await supabase
      .from("notebook_notes")
      .select("*")
      .eq("id", noteId)
      .single();

    if (error) {
      console.error("Error fetching notebook note:", error.message);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("[NOTEBOOK_NOTE_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const { getToken } = await auth();
    const accessToken = await getToken({ template: "supabase" });

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { title?: string; content?: Record<string, unknown> } = {};
    try {
      body = await req.json();
    } catch {
      // empty body
    }

    const updates: { title?: string | null; content?: Record<string, unknown> } = {};
    if (body.title !== undefined) {
      updates.title =
        typeof body.title === "string" && body.title.trim()
          ? body.title.trim()
          : null;
    }
    if (body.content !== undefined && typeof body.content === "object" && body.content !== null) {
      updates.content = body.content;
    }

    if (Object.keys(updates).length === 0) {
      const supabase = getSupabase(accessToken);
      const { data: note, error } = await supabase
        .from("notebook_notes")
        .select("*")
        .eq("id", noteId)
        .single();
      if (error || !note) {
        return NextResponse.json({ error: "Note not found" }, { status: 404 });
      }
      return NextResponse.json(note);
    }

    const supabase = getSupabase(accessToken);

    const { data: note, error } = await supabase
      .from("notebook_notes")
      .update(updates)
      .eq("id", noteId)
      .select()
      .single();

    if (error) {
      console.error("Error updating notebook note:", error.message);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("[NOTEBOOK_NOTE_PATCH]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const { getToken } = await auth();
    const accessToken = await getToken({ template: "supabase" });

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase(accessToken);

    const { error } = await supabase
      .from("notebook_notes")
      .delete()
      .eq("id", noteId);

    if (error) {
      console.error("Error deleting notebook note:", error.message);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    return NextResponse.json({ message: "Note deleted" }, { status: 200 });
  } catch (error) {
    console.error("[NOTEBOOK_NOTE_DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
