import { cache } from "react";
import { createInsforgeServer, getUser } from "@/lib/insforge/server";
import type { ProfileRow } from "@/types";

/**
 * Returns the signed-in user's profiles row, creating it on first use. Server context only.
 *
 * InsForge does not allow triggers on auth.users, so rows are created lazily here instead.
 * Call this from any page or route that needs the profile — never assume the row already exists.
 * Wrapped in React `cache()` so one request makes at most one lookup.
 */
export const getProfile = cache(async (): Promise<ProfileRow | null> => {
  const user = await getUser();
  if (!user) return null;

  try {
    const insforge = await createInsforgeServer();
    const table = () => insforge.database.from("profiles");

    const existing = await table().select("*").eq("id", user.id).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return existing.data as ProfileRow;

    const name = (user as { profile?: { name?: unknown } }).profile?.name;
    const created = await table()
      .insert([
        {
          id: user.id,
          email: user.email ?? null,
          full_name: typeof name === "string" ? name : null,
        },
      ])
      .select("*");

    if (created.error) {
      // A concurrent request may have created the row first — read it back before giving up.
      const retry = await table().select("*").eq("id", user.id).maybeSingle();
      if (retry.data) return retry.data as ProfileRow;
      throw created.error;
    }
    return (created.data?.[0] as ProfileRow | undefined) ?? null;
  } catch (error) {
    console.error("[lib/insforge/getProfile]", error);
    return null;
  }
});
