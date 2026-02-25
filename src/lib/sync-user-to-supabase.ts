import { createClient } from "@supabase/supabase-js";

export type SyncUserPayload = {
  id: string;
  email?: string | null;
  name?: string | null;
  profile_image_url?: string | null;
};

/**
 * Upserts a user into public.users (by Clerk id). Use with Clerk as third-party auth;
 * no auth.users row is created — RLS uses auth.jwt()->>'sub'.
 */
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase config. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }
  return { url, key };
}

export async function syncUserToSupabase(payload: SyncUserPayload): Promise<void> {
  const { id, email = null, name = null, profile_image_url = null } = payload;

  const { url, key } = getSupabaseConfig();

  const supabaseAdmin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { error } = await supabaseAdmin
      .from("users")
      .upsert(
        {
          id,
          name: name || null,
          email,
          profile_image_url,
        },
        { onConflict: "id" }
      );

    if (error) throw error;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("fetch failed") || message.includes("ECONNREFUSED") || message.includes("ENOTFOUND")) {
      throw new Error(
        "Cannot reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, and that the server can access the internet."
      );
    }
    throw err;
  }
}
