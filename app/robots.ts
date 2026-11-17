import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Signed-in screens and API routes have nothing to index.
      disallow: ["/api/", "/dashboard", "/find-jobs", "/profile", "/sign-out"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
