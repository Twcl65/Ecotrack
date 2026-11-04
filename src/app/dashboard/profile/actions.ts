"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type SaveProfileResult =
  | { success: true; emailChangePending: boolean }
  | { success: false; error: string };

export async function saveAdminProfile(values: {
  fullName: string;
  email: string;
  avatarUrl: string | null;
}): Promise<SaveProfileResult> {
  const fullName = values.fullName.trim().replace(/\s+/g, " ");
  const email = values.email.trim().toLowerCase();

  if (!fullName) return { success: false, error: "Full name is required." };
  if (fullName.length > 120) {
    return { success: false, error: "Full name must be 120 characters or fewer." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Enter a valid email address." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) return { success: false, error: userError.message };
  if (!user) return { success: false, error: "You must be signed in to update your profile." };

  const { data: profile, error: profileLookupError } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .maybeSingle();
  if (profileLookupError) {
    return { success: false, error: profileLookupError.message };
  }
  if (profile?.role !== "administrator") {
    return { success: false, error: "Only administrators can update this profile." };
  }

  if (values.avatarUrl) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return { success: false, error: "Supabase is not configured." };

    let avatarUrl: URL;
    try {
      avatarUrl = new URL(values.avatarUrl);
    } catch {
      return { success: false, error: "Invalid profile picture URL." };
    }

    const expectedUrl = new URL(supabaseUrl);
    if (
      avatarUrl.origin !== expectedUrl.origin ||
      !avatarUrl.pathname.startsWith(
        `/storage/v1/object/public/user-avatars/${user.id}/`
      )
    ) {
      return { success: false, error: "Profile picture must use your avatar upload." };
    }
  }

  const emailChangePending = email !== (user.email ?? "");
  const { error: authUpdateError } = await supabase.auth.updateUser({
    ...(emailChangePending ? { email } : {}),
    data: { full_name: fullName },
  });
  if (authUpdateError) {
    return { success: false, error: authUpdateError.message };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      email,
      ...(values.avatarUrl ? { avatar_url: values.avatarUrl } : {}),
    })
    .eq("id", user.id);
  if (updateError) return { success: false, error: updateError.message };

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { success: true, emailChangePending };
}
