import type { Metadata } from "next";
import { IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import { SiteChrome } from "@/components/SiteChrome";
import "./globals.css";

const display = Source_Serif_4({ subsets: ["latin"], variable: "--font-display" });
const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://northeast-florida-family-support.vercel.app"),
  title: {
    default: "Northeast Florida Autism & Disability Support Navigator",
    template: "%s | Northeast Florida Support Navigator",
  },
  description: "A clearer path to autism and developmental-disability services, waivers, education, therapy, and family support across Northeast Florida.",
  openGraph: {
    title: "Northeast Florida Support Navigator",
    description: "Find a clearer next step for autism and developmental-disability support across the First Coast.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`} data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
