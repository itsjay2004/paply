import { auth } from "@clerk/nextjs/server";
import { getErrorMessageWithHint } from "@/lib/api-error-message";
import { getSupabase } from "@/lib/supabase";
import { syncUserToSupabase } from "@/lib/sync-user-to-supabase";
import { NextResponse } from "next/server";

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

    const { data: notes, error } = await supabase
      .from("notebook_notes")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching notebook notes:", error.message);
      return NextResponse.json(
        { error: "Internal Server Error", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(notes ?? []);
  } catch (error) {
    const message = getErrorMessageWithHint(error, "Supabase");
    console.error("[NOTEBOOK_NOTES_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { getToken, userId } = await auth();
    const accessToken = await getToken({ template: "supabase" });

    if (!accessToken || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { title?: string; content?: Record<string, unknown> } = {};
    try {
      body = await req.json();
    } catch {
      // empty body is ok; defaults below
    }

    const title =
      body.title != null && typeof body.title === "string"
        ? body.title.trim() || null
        : null;
    const content =
      body.content != null && typeof body.content === "object" && body.content !== null
        ? body.content
        : {};

    await syncUserToSupabase({ id: userId });

    const supabase = getSupabase(accessToken);

    const { data: note, error } = await supabase
      .from("notebook_notes")
      .insert([{ user_id: userId, title, content }])
      .select()
      .single();

    if (error) {
      console.error("Error creating notebook note:", error.message);
      return NextResponse.json(
        { error: "Failed to create note", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("[NOTEBOOK_NOTES_POST]", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
