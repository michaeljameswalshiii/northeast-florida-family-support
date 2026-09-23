import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MapPinned, Sparkles } from "lucide-react";
import { ResourceExplorer } from "@/components/ResourceExplorer";

export const metadata: Metadata = {
  title: "Find Northeast Florida Disability Resources",
  description: "Filter trusted Northeast Florida autism and developmental-disability resources by county, age, and service.",
};

export default function ResourcesPage() {
  return (
    <main id="main-content">
      <section className="directory-hero">
        <div className="directory-orb one" /><div className="directory-orb two" />
        <div className="shell">
          <Link href="/" className="back-link"><ArrowLeft size={16} /> Back to navigator</Link>
          <p className="eyebrow"><MapPinned size={15} /> Northeast Florida directory</p>
          <h1>Find support that fits <em>your next step.</em></h1>
          <p>Filter trusted starting points by service, county, and age. Every listing links directly to the organization responsible for current details.</p>
          <Link href="/#ask" className="directory-ai"><Sparkles size={17} /> Not sure what to choose? Ask the Support Guide</Link>
        </div>
      </section>
      <section className="section directory-section"><div className="shell"><ResourceExplorer /></div></section>
    </main>
  );
}
