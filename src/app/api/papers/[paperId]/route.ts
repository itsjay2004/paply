import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { paperId: string } }
) {
  try {
    const { getToken } = auth();
    const accessToken = await getToken({ template: "supabase" });

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase(accessToken);

    const { data: paper, error } = await supabase
      .from("papers")
      .select("*, highlights (*), notes (*)")
      .eq("id", params.paperId)
      .single();

    if (error) {
      console.error("Error fetching paper:", error.message);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    return NextResponse.json(paper);
  } catch (error) {
    console.error("[PAPER_ID_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { paperId: string } }
) {
  try {
    const { getToken } = auth();
    const values = await req.json();
    const accessToken = await getToken({ template: "supabase" });

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase(accessToken);

    const { data: paper, error } = await supabase
      .from("papers")
      .update(values)
      .eq("id", params.paperId)
      .select();

    if (error) {
      console.error("Error updating paper:", error.message);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    return NextResponse.json(paper);
  } catch (error) {
    console.error("[PAPER_ID_PATCH]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { paperId: string } }
) {
  try {
    const { getToken } = auth();
    const accessToken = await getToken({ template: "supabase" });

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase(accessToken);

    const { error } = await supabase
      .from("papers")
      .delete()
      .eq("id", params.paperId);

    if (error) {
      console.error("Error deleting paper:", error.message);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    return NextResponse.json({ message: "Paper deleted" }, { status: 200 });
  } catch (error) {
    console.error("[PAPER_ID_DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
