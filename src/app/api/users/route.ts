import { NextResponse } from "next/server";
import { syncUserToSupabase } from "@/lib/sync-user-to-supabase";

/**
 * Syncs Clerk user to public.users. Used by client (RichieWorkspace) and by Clerk webhook.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const clerkId = body.id ?? body.clerkId;
    const email = body.email ?? null;
    const name = body.name ?? "";
    const profile_image_url = body.profile_image_url ?? null;

    if (!clerkId) {
      return NextResponse.json({ error: "Missing Clerk user ID" }, { status: 400 });
    }

    await syncUserToSupabase({
      id: clerkId,
      email,
      name: name || null,
      profile_image_url: profile_image_url ?? null,
    });

    return NextResponse.json({ message: "User synced successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[USERS_POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to sync user", details: message },
      { status: 500 }
    );
  }
}
