import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || "https://northeast-florida-family-support.vercel.app"}/sitemap.xml` };
}
