import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    console.log("--- Starting Debug ---");
    const { userId, getToken } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized - No userId" }, { status: 401 });
    }
    console.log("Clerk userId:", userId);

    const accessToken = await getToken({ template: "supabase" });

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized - No Supabase JWT" }, { status: 401 });
    }
    console.log("Supabase JWT acquired.");

    const supabase = getSupabase(accessToken);
    console.log("Supabase client created.");

    // Using the correct Clerk userId (TEXT) to query the users table.
    const { data: user, error: supabaseError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    console.log("Supabase query executed on 'users' table.");

    if (supabaseError) {
      console.error("Supabase Error on 'users' query:", supabaseError);
      return NextResponse.json(
        { error: "Supabase query failed", details: supabaseError.message, supabaseError: supabaseError },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json({ message: "User not found in Supabase (but JWT is valid)", clerkUserId: userId }, { status: 404 });
    }

    return NextResponse.json({ message: "SUCCESS: JWT is valid and user was found in Supabase!", user, clerkUserId: userId }, { status: 200 });
  } catch (error) {
    console.error("[DEBUG_JWT_GET] CATCH BLOCK Full Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message, fullError: error }, { status: 500 });
  }
}
