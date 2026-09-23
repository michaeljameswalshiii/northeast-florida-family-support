import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { formatClinicAddress } from "@/lib/clinic-rating-types";
import { listClinicRatings } from "@/lib/clinic-ratings";
import { readStaffSession, staffCookieName } from "@/lib/staff-auth";

export default async function AdminClinicsPage() {
  const session = await readStaffSession((await cookies()).get(staffCookieName())?.value);
  if (!session) redirect("/admin");
  const clinics = await listClinicRatings();
  return (
    <main id="main-content" className="admin-page">
      <p className="eyebrow">Specialty care</p>
      <h1>Clinic ratings</h1>
      <p className="admin-lede">{clinics.length} clinic {clinics.length === 1 ? "record" : "records"}. Open the public form to add or update a clinic.</p>
      <p><Link className="button primary" href="/clinic-ratings">Open clinic rating form</Link></p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Clinic</th>
              <th>Location</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {clinics.length ? clinics.map((clinic) => (
              <tr key={clinic.id}>
                <td>{clinic.clinicName || "Untitled clinic"}</td>
                <td>{formatClinicAddress(clinic) || "No address"}</td>
                <td>{new Date(clinic.updatedAt).toLocaleDateString("en-US")}</td>
              </tr>
            )) : (
              <tr><td colSpan={3}>No clinics saved yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
