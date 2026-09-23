import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft, Inbox, Mail, Monitor, ShieldCheck } from "lucide-react";
import { listResourceFeedback } from "@/lib/resource-feedback";
import { staffCookieName, verifyStaffSession } from "@/lib/staff-auth";
import { StaffLogoutButton } from "@/components/StaffLogoutButton";

export const metadata: Metadata = { title: "Feedback inbox", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function StaffFeedbackPage() {
  const session = (await cookies()).get(staffCookieName())?.value;
  if (!(await verifyStaffSession(session))) redirect("/staff-login?next=/staff-feedback");
  const feedback = await listResourceFeedback();
  return <main id="main-content"><section className="directory-hero"><div className="shell directory-hero-inner">
    <Link href="/" className="back-link"><ArrowLeft size={16} /> Public site</Link><p className="eyebrow"><ShieldCheck size={15} /> Staff workspace</p><h1>Feedback <em>inbox.</em></h1>
    <p>Review website feedback and resource corrections submitted by visitors.</p><div className="staff-hero-actions"><StaffLogoutButton /></div>
  </div></section><section className="section directory-section"><div className="shell feedback-inbox">
    <div className="results-head"><div><p className="eyebrow"><Inbox size={15} /> Submissions</p><h2>{feedback.length} received</h2></div></div>
    {feedback.length ? feedback.map((item) => <article className="feedback-record" key={item.id}>
      <header><div><span className="feedback-kind">{item.type === "site" ? "Site feedback" : "Resource update"}</span><h3>{item.issue}</h3></div><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</time></header>
      <p>{item.details}</p><dl><div><dt><Monitor size={14} /> Page/resource</dt><dd>{item.page || item.resource}</dd></div><div><dt><Mail size={14} /> Contact</dt><dd>{item.contact || "Not provided"}</dd></div></dl>
      {item.images?.length ? <div className="feedback-images">{item.images.map((image, index) => image ? <a href={image.data} target="_blank" rel="noreferrer" key={`${item.id}-${index}`}><Image unoptimized width={900} height={560} src={image.data} alt={`Feedback screenshot ${index + 1}`} /></a> : null)}</div> : null}
    </article>) : <div className="empty-state"><Inbox size={30} /><h3>No feedback yet</h3><p>New submissions will appear here.</p></div>}
  </div></section></main>;
}
