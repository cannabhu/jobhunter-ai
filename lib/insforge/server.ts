import { cache } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { createServerClient } from "@insforge/sdk/ssr";

/** Server-only InsForge client bound to the current request's auth cookies. */
export async function createInsforgeServer() {
  return createServerClient({ cookies: await cookies() });
}

/**
 * Returns the signed-in user or null. Server context only.
 * Wrapped in React `cache()` so every component in one request shares a single InsForge call.
 */
export const getUser = cache(async () => {
  // The SDK compares token expiry to Date.now(); opt into request-time rendering first.
  await connection();
  try {
    const insforge = await createInsforgeServer();
    const { data, error } = await insforge.auth.getCurrentUser();
    if (error) console.error("[lib/insforge/getUser]", error.message);
    return data?.user ?? null;
  } catch (error) {
    console.error("[lib/insforge/getUser]", error);
    return null;
  }
});
