import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft, Inbox, Mail, Monitor, ShieldCheck } from "lucide-react";
import { listResourceFeedback } from "@/lib/resource-feedback";
import { staffCookieName, verifyStaffSession } from "@/lib/staff-auth";
import { StaffLogoutButton } from "@/components/StaffLogoutButton";

export const metadata: Metadata = { title: "Admin tech support notes", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function kindLabel(type: string) {
  if (type === "tech-support" || type === "site") return "Tech support";
  return "Resource update";
}

export default async function StaffFeedbackPage() {
  const session = (await cookies()).get(staffCookieName())?.value;
  if (!(await verifyStaffSession(session))) redirect("/staff-login?next=/staff-feedback");
  const feedback = await listResourceFeedback();
  return (
    <main id="main-content">
      <section className="directory-hero">
        <div className="shell directory-hero-inner">
          <Link href="/" className="back-link"><ArrowLeft size={16} /> Public site</Link>
          <p className="eyebrow"><ShieldCheck size={15} /> Admin</p>
          <h1>Tech support <em>notes.</em></h1>
          <p>Beta feedback, screenshots, and resource corrections submitted by visitors. Each new note is also emailed to the project inbox.</p>
          <div className="staff-hero-actions"><StaffLogoutButton /></div>
        </div>
      </section>
      <section className="section directory-section">
        <div className="shell feedback-inbox">
          <div className="results-head">
            <div>
              <p className="eyebrow"><Inbox size={15} /> Saved notes</p>
              <h2>{feedback.length} received</h2>
            </div>
          </div>
          {feedback.length ? feedback.map((item) => (
            <article className="feedback-record" key={item.id}>
              <header>
                <div>
                  <span className="feedback-kind">{kindLabel(item.type)}</span>
                  <h3>{item.issue}</h3>
                </div>
                <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</time>
              </header>
              <p>{item.details}</p>
              <dl>
                <div><dt><Monitor size={14} /> Page</dt><dd>{item.page || item.resource}</dd></div>
                <div><dt><Mail size={14} /> Contact</dt><dd>{item.contact || "Not provided"}</dd></div>
              </dl>
              {item.images?.length ? (
                <div className="feedback-images">
                  {item.images.map((image, index) => image?.data ? (
                    <a href={image.data} target="_blank" rel="noreferrer" key={`${item.id}-${image.id || index}`}>
                      <Image unoptimized width={900} height={560} src={image.data} alt={image.name || `Screenshot ${index + 1}`} />
                    </a>
                  ) : null)}
                </div>
              ) : null}
            </article>
          )) : (
            <div className="empty-state">
              <Inbox size={30} />
              <h3>No tech support notes yet</h3>
              <p>New visitor notes will appear here and be emailed to the project inbox.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
