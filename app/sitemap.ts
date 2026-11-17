import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Only the public pages. Everything else sits behind sign-in.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/login`, changeFrequency: "yearly", priority: 0.5 },
  ];
}
