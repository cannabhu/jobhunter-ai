"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeServer, getUser } from "@/lib/insforge/server";
import { getProfile } from "@/lib/insforge/profile";
import { calculateCompletion } from "@/lib/profileCompletion";
import { inputToRowUpdate } from "@/lib/profileMapping";
import { parseProfileFormData } from "@/lib/profileSchema";
import type { SaveProfileResult } from "@/types";

export async function saveProfile(formData: FormData): Promise<SaveProfileResult> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Your session has expired. Please sign in again." };

    // Also guarantees the row exists, and gives us the previous is_complete to detect a first completion.
    const profile = await getProfile();
    if (!profile) return { success: false, error: "We couldn't load your profile. Please try again." };

    const parsed = parseProfileFormData(formData);
    if (!parsed.success) {
      return { success: false, error: "Some fields need fixing before we can save.", fieldErrors: parsed.fieldErrors };
    }

    const completion = calculateCompletion(parsed.data);
    const insforge = await createInsforgeServer();
    const { data, error } = await insforge.database
      .from("profiles")
      .update(inputToRowUpdate(parsed.data, completion))
      .eq("id", user.id)
      .select("id");

    if (error) throw error;
    // RLS silently filters rows it does not allow, so "no error" alone does not prove the write landed.
    if (!data || data.length === 0) throw new Error("Profile update matched no rows");

    revalidatePath("/profile");
    return { success: true, justCompleted: completion.isComplete && !profile.is_complete };
  } catch (error) {
    console.error("[actions/profile]", error);
    return { success: false, error: "We couldn't save your profile. Please try again." };
  }
}
