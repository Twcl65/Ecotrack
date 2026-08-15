"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import {
  avatarUrlForUser,
  buildFullName,
  formToRow,
  mapSystemUserRow,
} from "@/lib/users/format";
import { createClient } from "@/lib/supabase/server";
import type { SystemUser, UserFormValues, UserRole, UserStatus } from "@/types/user";

type ActionResult =
  | { success: true; user?: SystemUser }
  | { success: false; error: string };

function mapRoleToProfile(role: UserRole): string {
  switch (role) {
    case "admin":
      return "administrator";
    case "driver":
      return "driver";
    case "resident":
      return "viewer";
  }
}

function validateForm(
  values: UserFormValues,
  mode: "add" | "edit"
): string | null {
  if (!values.firstName.trim()) return "First name is required.";
  if (!values.lastName.trim()) return "Last name is required.";
  if (!values.email.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    return "Enter a valid email address.";
  if (!values.phone.trim()) return "Contact number is required.";
  if (!values.username.trim()) return "Username is required.";
  if (!values.role) return "User role is required.";

  if (mode === "add") {
    if (!values.password) return "Password is required.";
    if (values.password.length < 6)
      return "Password must be at least 6 characters.";
    if (values.password !== values.confirmPassword)
      return "Passwords do not match.";
  } else if (values.password || values.confirmPassword) {
    if (values.password.length < 6)
      return "Password must be at least 6 characters.";
    if (values.password !== values.confirmPassword)
      return "Passwords do not match.";
  }

  return null;
}

async function nextUserCode(supabase: Awaited<ReturnType<typeof createClient>>) {
  const year = new Date().getFullYear();
  const prefix = `USR-${year}-`;
  const { count } = await supabase
    .from("system_users")
    .select("*", { count: "exact", head: true });

  const seq = String((count ?? 0) + 1).padStart(4, "0");
  return `${prefix}${seq}`;
}

async function syncAuthUser(
  authUserId: string,
  values: UserFormValues,
  fullName: string,
  password?: string
): Promise<string | null> {
  if (!hasAdminClient()) {
    return "SUPABASE_SERVICE_ROLE_KEY is not configured. Passwords cannot be synced to Supabase Auth.";
  }

  const admin = createAdminClient();
  const payload: {
    email: string;
    password?: string;
    user_metadata: Record<string, string>;
  } = {
    email: values.email.trim().toLowerCase(),
    user_metadata: {
      username: values.username.trim(),
      full_name: fullName,
      role: mapRoleToProfile(values.role),
    },
  };

  if (password) payload.password = password;

  const { error } = await admin.auth.admin.updateUserById(authUserId, payload);
  if (error) return error.message;

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      username: values.username.trim(),
      full_name: fullName,
      role: mapRoleToProfile(values.role),
    })
    .eq("id", authUserId);

  if (profileError) return profileError.message;
  return null;
}

async function setAuthBan(authUserId: string, inactive: boolean): Promise<string | null> {
  if (!hasAdminClient()) return null;

  const admin = createAdminClient();
  const { data: authUser } = await admin.auth.admin.getUserById(authUserId);
  if (!authUser.user) return null;

  const { error } = await admin.auth.admin.updateUserById(authUserId, {
    ban_duration: inactive ? "876000h" : "none",
  });

  return error?.message ?? null;
}

async function getAuthUserId(id: string): Promise<string | null> {
  if (!hasAdminClient()) return null;

  const admin = createAdminClient();
  const { data } = await admin.auth.admin.getUserById(id);
  return data.user?.id ?? null;
}

export async function createSystemUser(
  values: UserFormValues
): Promise<ActionResult> {
  const err = validateForm(values, "add");
  if (err) return { success: false, error: err };

  if (!hasAdminClient()) {
    return {
      success: false,
      error:
        "Add SUPABASE_SERVICE_ROLE_KEY to .env.local so new users can sign in with their password.",
    };
  }

  const supabase = await createClient();
  const admin = createAdminClient();
  const userCode = await nextUserCode(supabase);
  const fullName = buildFullName(
    values.firstName,
    values.middleName || null,
    values.lastName
  );
  const authEmail = values.email.trim().toLowerCase();

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: authEmail,
    password: values.password,
    email_confirm: true,
    user_metadata: {
      username: values.username.trim(),
      full_name: fullName,
      role: mapRoleToProfile(values.role),
    },
  });

  if (authError || !authData.user) {
    return {
      success: false,
      error: authError?.message ?? "Failed to create login account.",
    };
  }

  const authUserId = authData.user.id;

  const { data, error } = await supabase
    .from("system_users")
    .insert({
      id: authUserId,
      ...formToRow(values),
      user_code: userCode,
      avatar_url: avatarUrlForUser(fullName, values.email),
    })
    .select()
    .single();

  if (error) {
    await admin.auth.admin.deleteUser(authUserId);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/users");
  return { success: true, user: mapSystemUserRow(data) };
}

export async function updateSystemUser(
  id: string,
  values: UserFormValues
): Promise<ActionResult> {
  const err = validateForm(values, "edit");
  if (err) return { success: false, error: err };

  const supabase = await createClient();
  const fullName = buildFullName(
    values.firstName,
    values.middleName || null,
    values.lastName
  );

  const authUserId = await getAuthUserId(id);
  if (authUserId) {
    const authErr = await syncAuthUser(
      authUserId,
      values,
      fullName,
      values.password || undefined
    );
    if (authErr) return { success: false, error: authErr };
  }

  const { data, error } = await supabase
    .from("system_users")
    .update({
      ...formToRow(values),
      avatar_url: avatarUrlForUser(fullName, values.email),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  if (values.status === "inactive") {
    const banErr = await setAuthBan(id, true);
    if (banErr) return { success: false, error: banErr };
  } else {
    const banErr = await setAuthBan(id, false);
    if (banErr) return { success: false, error: banErr };
  }

  revalidatePath("/dashboard/users");
  return { success: true, user: mapSystemUserRow(data) };
}

export async function updateSystemUserStatus(
  id: string,
  status: UserStatus
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("system_users")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  const banErr = await setAuthBan(id, status === "inactive");
  if (banErr) return { success: false, error: banErr };

  revalidatePath("/dashboard/users");
  return { success: true, user: mapSystemUserRow(data) };
}

export async function deactivateSystemUser(id: string): Promise<ActionResult> {
  return updateSystemUserStatus(id, "inactive");
}

export async function deleteSystemUser(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  if (hasAdminClient()) {
    const admin = createAdminClient();
    const { error: authError } = await admin.auth.admin.deleteUser(id);
    if (authError) return { success: false, error: authError.message };
  }

  const { error } = await supabase.from("system_users").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/users");
  return { success: true };
}
