import { auth } from "@clerk/nextjs/server";
import { getErrorMessageWithHint } from "@/lib/api-error-message";
import { getSupabase } from "@/lib/supabase";
import { syncUserToSupabase } from "@/lib/sync-user-to-supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { getToken } = await auth();
    const accessToken = await getToken({ template: "supabase" });

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized", details: "Supabase JWT not available. In Clerk Dashboard, add a Supabase JWT template and use it here." },
        { status: 401 }
      );
    }

    const supabase = getSupabase(accessToken);

    const { data: collections, error } = await supabase.from("collections").select("*");

    if (error) {
      console.error("Error fetching collections:", error.message, error);
      return NextResponse.json(
        { error: "Internal Server Error", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(collections);
  } catch (error) {
    const message = getErrorMessageWithHint(error, "Supabase");
    console.error("[COLLECTIONS_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { getToken, userId } = await auth();
    const { name } = await req.json();
    const accessToken = await getToken({ template: "supabase" });

    if (!accessToken || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Ensure user row exists so collection insert satisfies user_id FK
    await syncUserToSupabase({ id: userId });

    const supabase = getSupabase(accessToken);

    const { data: collection, error } = await supabase
      .from("collections")
      .insert([{ name: name.trim(), user_id: userId }])
      .select();

    if (error) {
      console.error("Error creating collection:", error.message);
      return NextResponse.json(
        { error: "Failed to create collection", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error("[COLLECTIONS_POST]", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
