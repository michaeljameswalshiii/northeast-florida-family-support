import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-row">
        <Link href="/" className="brand" aria-label="Northeast Florida Support Navigator home">
          <BrandMark />
          <span>
            <strong>Northeast Florida</strong>
            <small>Support Navigator</small>
          </span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link href="/#ask">Support Guide</Link>
          <Link href="/resources">Resources</Link>
          <Link href="/clinic-ratings">Clinics</Link>
          <Link href="/support">Help</Link>
        </nav>
        <Link className="header-help" href="tel:211">Call 211</Link>
      </div>
    </header>
  );
}
