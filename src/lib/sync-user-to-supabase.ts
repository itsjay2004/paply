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
export async function syncUserToSupabase(payload: SyncUserPayload): Promise<void> {
  const { id, email = null, name = null, profile_image_url = null } = payload;

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );

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
}
