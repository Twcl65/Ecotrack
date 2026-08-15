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
    phone: "",
    avatarUrl: null,
  };
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
