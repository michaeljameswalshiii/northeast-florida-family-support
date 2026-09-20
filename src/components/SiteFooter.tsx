import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <BrandMark compact />
          <div>
            <strong>Northeast Florida Support Navigator</strong>
            <p>A clear starting point for disability services across the First Coast.</p>
          </div>
        </div>
        <div>
          <p className="footer-label">Explore</p>
          <Link href="/#ask">Ask My AI Administrator</Link>
          <Link href="/resources">Resource directory</Link>
          <Link href="/clinic-ratings">Clinic ratings</Link>
          <Link href="/#answers">Common questions</Link>
        </div>
        <div>
          <p className="footer-label">Need a person?</p>
          <a href="tel:211">Dial 211</a>
          <a href="tel:9046330760">CARD: 904-633-0760</a>
          <a href="tel:3862384607">APD: 386-238-4607</a>
        </div>
      </div>
      <div className="shell footer-fineprint">
        <p>
          This independent guide does not endorse providers and is not affiliated with a government agency.
          Confirm eligibility, availability, licensing, cost, and insurance directly with each organization.
        </p>
        <p>Information reviewed September 2026.</p>
      </div>
    </footer>
  );
}
