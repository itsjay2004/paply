import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

/** GET /api/papers/[paperId]/highlights — list highlights for a paper */
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
      .from("highlights")
      .select("*")
      .eq("paper_id", paperId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[HIGHLIGHTS_GET]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[HIGHLIGHTS_GET]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/** POST /api/papers/[paperId]/highlights — create a highlight */
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
      highlighted_text: string;
      explanation?: string | null;
      position?: {
        areas: Array<{ pageIndex: number; left: number; top: number; width: number; height: number }>;
        color?: string;
      };
    };
    if (!body?.highlighted_text || typeof body.highlighted_text !== "string") {
      return NextResponse.json(
        { error: "highlighted_text is required" },
        { status: 400 }
      );
    }
    const supabase = getSupabase(accessToken);
    const { data, error } = await supabase
      .from("highlights")
      .insert({
        paper_id: paperId,
        highlighted_text: body.highlighted_text,
        explanation: body.explanation ?? null,
        position: body.position ?? null,
      })
      .select()
      .single();
    if (error) {
      console.error("[HIGHLIGHTS_POST]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("[HIGHLIGHTS_POST]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
