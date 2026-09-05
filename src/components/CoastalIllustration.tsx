export function CoastalIllustration() {
  return (
    <div className="coastal-visual" aria-label="Illustration of Northeast Florida families connecting to support">
      <svg viewBox="0 0 640 560" role="img">
        <defs>
          <linearGradient id="water" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#99ded6" />
            <stop offset="1" stopColor="#2aa49d" />
          </linearGradient>
          <linearGradient id="sun" x1="0" x2="1">
            <stop offset="0" stopColor="#ffd27a" />
            <stop offset="1" stopColor="#ff8b6a" />
          </linearGradient>
        </defs>
        <circle className="visual-sun" cx="478" cy="104" r="68" fill="url(#sun)" />
        <path className="visual-coast" d="M80 78c56 50 70 103 50 157-24 67 6 118 75 154 66 35 96 74 91 118H75z" />
        <path className="visual-water" d="M193 159c67 50 80 105 40 165-38 58-16 118 67 180h275V148c-99 39-226 37-382 11z" fill="url(#water)" />
        <path className="visual-wave" d="M231 245c53-28 104-24 154 10s99 35 147 3" />
        <path className="visual-wave" d="M245 294c45-21 89-17 132 12 44 29 90 30 137 2" />
        <g className="family family-one">
          <circle cx="212" cy="326" r="22" />
          <path d="M178 421c5-58 16-87 34-87s30 29 35 87" />
          <circle cx="276" cy="352" r="17" />
          <path d="M253 421c3-40 11-61 24-61 14 0 22 21 25 61" />
        </g>
        <g className="family family-two">
          <circle cx="397" cy="338" r="20" />
          <path d="M367 426c4-53 14-80 30-80 17 0 27 27 31 80" />
          <circle cx="452" cy="365" r="15" />
          <path d="M432 426c3-35 10-53 21-53 12 0 19 18 22 53" />
        </g>
        <path className="visual-path" d="M288 338c34-40 63-42 91-8" />
        <circle className="spark spark-one" cx="327" cy="302" r="8" />
        <circle className="spark spark-two" cx="350" cy="279" r="5" />
        <g className="visual-card card-a">
          <rect x="73" y="111" width="164" height="72" rx="20" />
          <circle cx="105" cy="147" r="14" />
          <path d="M132 137h75M132 155h50" />
        </g>
        <g className="visual-card card-b">
          <rect x="397" y="175" width="164" height="72" rx="20" />
          <circle cx="429" cy="211" r="14" />
          <path d="M456 201h75M456 219h50" />
        </g>
      </svg>
      <span className="visual-note note-one">Start here</span>
      <span className="visual-note note-two">Local answers</span>
    </div>
  );
}
