"use server";

import { revalidatePath } from "next/cache";
import {
  formValuesToTimestamp,
  mapAnnouncementRow,
} from "@/lib/announcement/format";
import { ANNOUNCEMENT_TYPE_CONFIG } from "@/types/announcement";
import { createClient } from "@/lib/supabase/server";
import type {
  Announcement,
  AnnouncementFormValues,
} from "@/types/announcement";

type ActionResult =
  | { success: true; announcement?: Announcement }
  | { success: false; error: string };

function validateForm(values: AnnouncementFormValues): string | null {
  if (!values.title.trim()) return "Title is required.";
  if (!values.message.trim()) return "Message is required.";
  if (values.message.length > 1000)
    return "Message must be 1000 characters or less.";
  if (!values.publishDate) return "Publish date is required.";
  if (!values.publishTime) return "Publish time is required.";
  if (!values.type) return "Type is required.";
  if (!values.audience) return "Audience is required.";
  return null;
}

function toRow(values: AnnouncementFormValues) {
  const publishedAt =
    values.publishStatus === "publish_now"
      ? new Date().toISOString()
      : formValuesToTimestamp(values.publishDate, values.publishTime);

  const expiresAt =
    values.expiryDate && values.expiryTime
      ? formValuesToTimestamp(values.expiryDate, values.expiryTime)
      : values.expiryDate
        ? formValuesToTimestamp(values.expiryDate, "23:59")
        : null;

  return {
    title: values.title.trim(),
    subtitle: ANNOUNCEMENT_TYPE_CONFIG[values.type].subtitle,
    content: values.message.trim(),
    announcement_type: values.type,
    audience: values.audience,
    publish_status: values.publishStatus,
    published_at: publishedAt,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  };
}

export async function createAnnouncement(
  values: AnnouncementFormValues
): Promise<ActionResult> {
  const err = validateForm(values);
  if (err) return { success: false, error: err };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .insert(toRow(values))
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/announcement");
  revalidatePath("/dashboard");
  return { success: true, announcement: mapAnnouncementRow(data) };
}

export async function updateAnnouncement(
  id: string,
  values: AnnouncementFormValues
): Promise<ActionResult> {
  const err = validateForm(values);
  if (err) return { success: false, error: err };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .update(toRow(values))
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/announcement");
  revalidatePath("/dashboard");
  return { success: true, announcement: mapAnnouncementRow(data) };
}

export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/announcement");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function incrementAnnouncementViews(
  id: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("announcements")
    .select("views")
    .eq("id", id)
    .single();

  const views = (current?.views ?? 0) + 1;
  const { data, error } = await supabase
    .from("announcements")
    .update({ views, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/announcement");
  return { success: true, announcement: mapAnnouncementRow(data) };
}
