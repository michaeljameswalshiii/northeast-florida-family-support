import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://northeast-florida-family-support.vercel.app";
  return [
    { url: base, priority: 1 },
    { url: `${base}/resources`, priority: .9 },
    { url: `${base}/clinic-ratings`, priority: .7 },
    { url: `${base}/privacy`, priority: .3 },
    { url: `${base}/accessibility`, priority: .3 },
    { url: `${base}/terms`, priority: .3 },
  ];
}
