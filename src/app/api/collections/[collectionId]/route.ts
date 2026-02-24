import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { collectionId: string } }
) {
  try {
    const { getToken } = auth();
    const accessToken = await getToken({ template: "supabase" });

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase(accessToken);

    const { data: collection, error } = await supabase
      .from("collections")
      .select("*")
      .eq("id", params.collectionId)
      .single();

    if (error) {
      console.error("Error fetching collection:", error.message);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error("[COLLECTION_ID_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { collectionId: string } }
) {
  try {
    const { getToken } = auth();
    const { name } = await req.json();
    const accessToken = await getToken({ template: "supabase" });


    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const supabase = getSupabase(accessToken);

    const { data: collection, error } = await supabase
      .from("collections")
      .update({ name })
      .eq("id", params.collectionId)
      .select();

    if (error) {
      console.error("Error updating collection:", error.message);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error("[COLLECTION_ID_PATCH]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { collectionId: string } }
) {
  try {
    const { getToken } = auth();
    const accessToken = await getToken({ template: "supabase" });

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase(accessToken);

    const { error } = await supabase
      .from("collections")
      .delete()
      .eq("id", params.collectionId);

    if (error) {
      console.error("Error deleting collection:", error.message);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    return NextResponse.json({ message: "Collection deleted" }, { status: 200 });
  } catch (error) {
    console.error("[COLLECTION_ID_DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
