export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand-mark${compact ? " is-compact" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 56 56" role="img">
        <path d="M9 31C18 18 29 14 47 15C43 31 31 42 15 45" />
        <path d="M11 39C24 36 34 29 43 19" />
        <path d="M20 20C22 27 27 32 35 35" />
        <circle cx="13" cy="15" r="4" />
      </svg>
    </span>
  );
}
