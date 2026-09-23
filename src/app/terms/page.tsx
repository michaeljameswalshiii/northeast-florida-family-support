import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms", description: "Terms of use for the Northeast Florida Support Navigator." };

export default function TermsPage() {
  return <main id="main-content"><article className="shell policy-page">
    <p className="eyebrow">Terms of use</p><h1>A starting point—not professional advice or a guarantee.</h1>
    <p>Last updated September 20, 2026.</p>
    <h2>Informational use</h2>
    <p>The navigator provides general educational information and links to independent organizations. It does not provide medical, legal, educational, benefits, or insurance advice; diagnose a condition; determine eligibility; authorize services; or guarantee availability, quality, coverage, or outcomes.</p>
    <h2>Automated guidance</h2>
    <p>The Support Guide may produce incomplete, outdated, or incorrect information. Verify important details directly with the responsible agency, school, insurer, clinician, or provider before making a decision.</p>
    <h2>Emergencies</h2>
    <p>Do not use this site for emergencies. Call 911 for immediate danger or a medical emergency. Dial 211 for community and crisis-resource navigation.</p>
    <h2>Independent organizations</h2>
    <p>A listing is not an endorsement. External sites have their own content, accessibility, privacy, and terms. Service information can change without notice.</p>
    <h2>Acceptable use</h2>
    <p>Do not submit confidential patient information, attempt unauthorized access, interfere with the service, or use automated features to generate harmful or deceptive content.</p>
  </article></main>;
}
