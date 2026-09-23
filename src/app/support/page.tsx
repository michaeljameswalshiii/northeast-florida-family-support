import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LifeBuoy } from "lucide-react";
import { TechSupportForm } from "@/components/TechSupportForm";

export const metadata: Metadata = {
  title: "Beta tech support",
  description: "Send a tech support note, with optional screenshots, while the Northeast Florida Support Navigator is in beta.",
};

export default function SupportPage() {
  return (
    <main id="main-content">
      <section className="simple-page">
        <div className="shell simple-page-inner">
          <Link href="/" className="back-link dark"><ArrowLeft size={16} /> Back to navigator</Link>
          <p className="eyebrow"><LifeBuoy size={15} /> Beta</p>
          <h1>Tech support notes</h1>
          <p className="simple-lede">
            This navigator is in beta. Send a note if something does not work, a clinic form gets stuck, or a page looks wrong.
            You can attach screenshots. Every note is saved in the admin inbox and emailed to the project team.
          </p>
          <TechSupportForm />
        </div>
      </section>
    </main>
  );
}
