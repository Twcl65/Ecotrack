import { supabase } from "./supabase";

export type AppRole = "resident" | "driver" | "admin" | "unknown";

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  username: string;
  role: AppRole;
  phone: string;
  avatarUrl: string | null;
};

export type ProfileUpdates = {
  fullName: string;
  email: string;
  username: string;
  phone: string;
};

function mapSystemRole(role: string | null | undefined): AppRole {
  switch (role) {
    case "admin":
    case "administrator":
      return "admin";
    case "driver":
      return "driver";
    case "resident":
    case "viewer":
      return "resident";
    default:
      return "unknown";
  }
}

export async function resolveLoginEmail(identifier: string): Promise<string> {
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) return trimmed.toLowerCase();

  const { data } = await supabase
    .from("system_users")
    .select("email")
    .eq("username", trimmed)
    .maybeSingle();

  if (data?.email) return data.email.toLowerCase();
  return `${trimmed}@ecotrack.local`;
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: systemUser } = await supabase
    .from("system_users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (systemUser) {
    const fullName = [systemUser.first_name, systemUser.middle_name, systemUser.last_name]
      .filter(Boolean)
      .join(" ");
    return {
      id: systemUser.id,
      email: systemUser.email,
      fullName,
      username: systemUser.username,
      role: mapSystemRole(systemUser.role),
      phone: systemUser.phone,
      avatarUrl: systemUser.avatar_url,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return {
    id: userId,
    email: user.email ?? "",
    fullName: profile?.full_name ?? user.email?.split("@")[0] ?? "User",
    username: profile?.username ?? user.email?.split("@")[0] ?? "",
    role: mapSystemRole(profile?.role),
    phone: profile?.phone || user.user_metadata?.phone || "",
    avatarUrl: profile?.avatar_url ?? null,
  };
}

export async function updateUserProfile(
  updates: ProfileUpdates,
  avatarUri?: string
): Promise<{ error?: string; emailConfirmationRequired?: boolean }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) return { error: userError.message };
  if (!user) return { error: "You must be signed in to update your profile." };

  const fullName = updates.fullName.trim().replace(/\s+/g, " ");
  const nameParts = fullName.split(" ");
  if (nameParts.length < 2) {
    return { error: "Enter your first and last name." };
  }

  const email = updates.email.trim().toLowerCase();
  const username = updates.username.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (!username) return { error: "Username is required." };

  const { data: existingUser, error: lookupError } = await supabase
    .from("system_users")
    .select("id")
    .eq("email", email)
    .neq("id", user.id)
    .maybeSingle();
  if (lookupError) return { error: lookupError.message };
  if (existingUser) return { error: "That email address is already in use." };

  const { data: existingUsername, error: usernameLookupError } = await supabase
    .from("system_users")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle();
  if (usernameLookupError) return { error: usernameLookupError.message };
  if (existingUsername) return { error: "That username is already in use." };

  const emailChanged = email !== (user.email ?? "").toLowerCase();
  const { data: authData, error: authError } = await supabase.auth.updateUser({
    ...(emailChanged ? { email } : {}),
    data: { username, full_name: fullName },
  });
  if (authError) return { error: authError.message };

  const emailConfirmationRequired =
    emailChanged && authData.user.email?.toLowerCase() !== email;
  const lastName = nameParts.pop()!;
  const firstName = nameParts.shift()!;
  const middleName = nameParts.length > 0 ? nameParts.join(" ") : null;

  let avatarUrl: string | undefined;
  if (avatarUri) {
    try {
      const response = await fetch(avatarUri);
      if (!response.ok) {
        return { error: "Could not read the selected profile picture." };
      }
      const imageData = await response.arrayBuffer();
      const contentType = response.headers.get("content-type") ?? "image/jpeg";
      const extension = contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
      const path = `${user.id}/profile-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("user-avatars")
        .upload(path, imageData, { contentType, upsert: false });
      if (uploadError) {
        return {
          error: `Profile picture upload failed: ${uploadError.message}. Confirm that the latest user-avatars.sql policies have been run in Supabase.`,
        };
      }
      avatarUrl = supabase.storage.from("user-avatars").getPublicUrl(path).data.publicUrl;
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Could not upload the profile picture.",
      };
    }
  }

  const profileUpdate = {
    first_name: firstName,
    middle_name: middleName,
    last_name: lastName,
    ...(emailConfirmationRequired ? {} : { email }),
    username,
    phone: updates.phone.trim(),
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    updated_at: new Date().toISOString(),
  };
  const { error: systemUserError } = await supabase
    .from("system_users")
    .update(profileUpdate)
    .eq("id", user.id);
  if (systemUserError) {
    return {
      error: `Your sign-in account was updated, but your profile could not be saved: ${systemUserError.message}`,
    };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      username,
      full_name: fullName,
      phone: updates.phone.trim(),
      ...(emailConfirmationRequired ? {} : { email }),
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq("id", user.id);
  if (profileError) {
    return {
      error: `Your profile details were saved, but account metadata could not be synced: ${profileError.message}`,
    };
  }

  return { emailConfirmationRequired };
}

export async function signIn(email: string, password: string) {
  const resolvedEmail = await resolveLoginEmail(email);
  return supabase.auth.signInWithPassword({
    email: resolvedEmail,
    password,
  });
}

export async function signUp(params: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}) {
  return supabase.auth.signUp({
    email: params.email.trim().toLowerCase(),
    password: params.password,
    options: {
      data: {
        full_name: params.fullName.trim(),
        username: params.email.split("@")[0],
        role: "viewer",
        phone: params.phone.trim(),
      },
    },
  });
}

export async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  return { error };
}
