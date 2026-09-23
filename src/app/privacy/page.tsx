import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy", description: "Privacy information for the Northeast Florida Support Navigator." };

export default function PrivacyPage() {
  return <main id="main-content"><article className="shell policy-page">
    <p className="eyebrow">Privacy</p><h1>Use the navigator without sharing private health information.</h1>
    <p>Last updated September 20, 2026.</p>
    <h2>Information you choose to submit</h2>
    <p>The automated Support Guide receives the question, county, and age you enter. Do not submit names, dates of birth, diagnoses, medical record numbers, insurance identifiers, or other information that could identify a patient. Resource-correction reports may include an optional email address.</p>
    <h2>Staff clinic-rating workspace</h2>
    <p>The clinic-rating workspace is restricted to authorized staff. It stores clinic contact information, staff names, ratings, and outreach notes. It is not a patient record and must not be used to store patient information.</p>
    <h2>How information is used</h2>
    <p>Questions are used to generate a response and manage service usage. Correction reports are used to review directory listings. Hosting and infrastructure providers may process technical request information such as IP address, device information, and timestamps for security and service delivery.</p>
    <h2>Retention and choices</h2>
    <p>Chat messages are not displayed as a permanent account history on this site. Correction reports and staff records are retained as needed to maintain the directory and clinic-rating program. Avoid submitting anything you do not want processed by the service.</p>
    <h2>Not a patient portal</h2>
    <p>This site is not designed to receive protected health information, provide medical care, or communicate with a healthcare provider. For medical questions, contact the appropriate clinician or organization directly.</p>
  </article></main>;
}
