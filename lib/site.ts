/** Canonical site identity, shared by the root metadata, robots, sitemap and manifest. */
export const SITE_NAME = "JobPilot";

export const SITE_TITLE = "JobPilot — AI job hunting assistant";

export const SITE_DESCRIPTION =
  "JobPilot finds the jobs, researches the companies, and gives you everything you need to stand out.";

/** Absolute origin that relative metadata URLs (icons, share images) resolve against. Set it per deployment. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

/**
 * Meta tags and the web manifest can't read CSS variables, so this mirrors `--color-accent` and
 * `--color-background` from globals.css. Keep the two in sync.
 */
export const BRAND_COLORS = {
  accent: "#7c5cfc",
  background: "#f6f7fb",
} as const;
