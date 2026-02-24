
import { clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { id: clerkId, email, name, profile_image_url } = await req.json();

    if (!clerkId || !email) {
      return NextResponse.json({ error: "Missing Clerk ID or email" }, { status: 400 });
    }

    // Initialize Supabase admin client. This client has elevated privileges
    // and should only be used in secure server-side environments.
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use the service role key for admin actions
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 1. Check if the user already exists in Supabase Auth
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ email });
    if (listError) throw listError;

    let supabaseUser = users.find(u => u.email === email);
    
    // 2. If not, create a new user in Supabase Auth
    if (!supabaseUser) {
        const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            email_confirm: true, // Automatically confirm the email
        });

        if (createError) throw createError;
        supabaseUser = newUserData.user;
    }

    if (!supabaseUser) {
        throw new Error("Failed to create or find Supabase auth user.");
    }
    const supabaseUuid = supabaseUser.id;

    // 3. Update Clerk user metadata with the Supabase UUID
    await clerkClient.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        supabase_uuid: supabaseUuid,
      },
    });

    // 4. Upsert the user profile into the public.users table
    // Use the Clerk ID as the primary key here, as your schema is set up.
    const { error: upsertError } = await supabaseAdmin
      .from("users")
      .upsert({
        id: clerkId, // Clerk user ID
        name: name,
        email: email,
        profile_image_url: profile_image_url,
      }, { onConflict: 'id' });

    if (upsertError) throw upsertError;

    return NextResponse.json({ message: "User synced successfully", supabase_uuid: supabaseUuid });
  } catch (error: any) {
    console.error("[USERS_POST] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
