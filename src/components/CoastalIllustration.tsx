import Link from "next/link";

export function CoastalIllustration() {
  return (
    <div className="coastal-visual" aria-label="Illustrated First Coast shoreline with links to start the Support Guide or browse local resources">
      <div className="coastal-stage" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="coastal-art"
          src="/images/hero-first-coast.jpg"
          alt=""
          width={1600}
          height={1200}
        />
        <div className="coastal-sun-glow" />
        <div className="coastal-beacon" />
        <svg className="coastal-birds" viewBox="0 0 640 420" aria-hidden="true">
          <g className="bird bird-a">
            <path d="M12 18c8-6 14-6 22 0-8 4-14 4-22 0z" />
          </g>
          <g className="bird bird-b">
            <path d="M8 12c6-5 11-5 17 0-6 3-11 3-17 0z" />
          </g>
          <g className="bird bird-c">
            <path d="M10 14c7-5 12-5 19 0-7 3-12 3-19 0z" />
          </g>
        </svg>
        <svg className="coastal-waves" viewBox="0 0 640 180" preserveAspectRatio="none" aria-hidden="true">
          <path className="wave wave-1" d="M-40 90c80-28 120 28 200 8 80-20 120 24 200 4 80-20 120 26 220 2v86H-40z" />
          <path className="wave wave-2" d="M-80 118c90-22 140 18 220 2 90-18 140 20 230 4 90-16 140 18 250 0v56H-80z" />
        </svg>
      </div>
      <div className="coastal-actions">
        <Link className="visual-note note-one" href="#ask">Start here</Link>
        <Link className="visual-note note-two" href="/resources">Local answers</Link>
      </div>
    </div>
  );
}
