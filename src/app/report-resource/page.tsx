import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Flag } from "lucide-react";
import { ResourceFeedbackForm } from "@/components/ResourceFeedbackForm";

export const metadata: Metadata = { title: "Report resource information", description: "Report outdated or incorrect information in the Northeast Florida resource directory.", robots: { index: false, follow: false } };

export default async function ReportResourcePage({ searchParams }: { searchParams: Promise<{ resource?: string }> }) {
  const { resource = "" } = await searchParams;
  return <main id="main-content"><section className="simple-page"><div className="shell simple-page-inner">
    <Link href="/resources" className="back-link dark"><ArrowLeft size={16} /> Back to resources</Link>
    <p className="eyebrow"><Flag size={15} /> Help keep the directory useful</p>
    <h1>Report outdated information</h1>
    <p className="simple-lede">Listings are reviewed periodically, but programs, phone numbers, eligibility, and availability can change. Send us the correction so it can be checked.</p>
    <ResourceFeedbackForm initialResource={resource.slice(0, 180)} />
  </div></section></main>;
}
