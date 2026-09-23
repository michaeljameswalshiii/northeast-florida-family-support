import { redirect } from "next/navigation";

export const metadata = { robots: { index: false, follow: false } };

export default function StaffFeedbackRedirect() {
  redirect("/admin/tech-support");
}
