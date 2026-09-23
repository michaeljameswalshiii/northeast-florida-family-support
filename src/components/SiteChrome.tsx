"use client";

import { usePathname } from "next/navigation";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/staff-login") || pathname.startsWith("/staff-feedback");
  if (isAdmin) return <>{children}</>;
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
      <FeedbackWidget />
    </>
  );
}
