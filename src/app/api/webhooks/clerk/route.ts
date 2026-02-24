import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";
import { syncUserToSupabase } from "@/lib/sync-user-to-supabase";

/**
 * Clerk webhook: creates/updates public.users on user.created and user.updated
 * so a row exists for RLS (auth.jwt()->>'sub'). Configure in Clerk Dashboard:
 * - Endpoint URL: https://your-domain/api/webhooks/clerk
 * - Subscribe to: user.created, user.updated
 * - Set CLERK_WEBHOOK_SIGNING_SECRET in env
 */
export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);

    if (evt.type === "user.created" || evt.type === "user.updated") {
      const data = evt.data;
      const primaryEmail = data.email_addresses?.find((e: { id: string }) => e.id === data.primary_email_address_id);
      const email = primaryEmail?.email_address ?? null;
      const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || data.username ?? "";

      await syncUserToSupabase({
        id: data.id,
        email,
        name: name || null,
        profile_image_url: data.image_url ?? null,
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[WEBHOOK_CLERK] Error:", err);
    return NextResponse.json({ error: "Webhook verification or processing failed" }, { status: 400 });
  }
}
