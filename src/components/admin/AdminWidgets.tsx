"use client";

export function formatWhen(iso?: string) {
  if (!iso) return "Not yet";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not yet";
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

export function countryFlag(code?: string) {
  const cc = String(code || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return "";
  return String.fromCodePoint(...[...cc].map((char) => 127397 + char.charCodeAt(0)));
}

export function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="admin-kpi">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}

export function BarChart({ series }: { series: Array<{ label: string; value: number; adminValue?: number }> }) {
  const max = Math.max(1, ...series.map((item) => item.value + (item.adminValue || 0)));
  if (!series.length) return <div className="admin-empty-chart">Numbers will appear here after a few people stop by.</div>;
  return (
    <div className="admin-bars">
      {series.map((item, index) => {
        const admin = item.adminValue || 0;
        const total = item.value + admin;
        return (
          <div key={`${item.label}-${index}`} className="admin-bar">
            <span className="admin-bar-n">{total || ""}</span>
            <div className="admin-bar-stack" style={{ height: `${Math.max(8, (total / max) * 100)}%` }}>
              {item.value ? <i style={{ height: `${(item.value / Math.max(total, 1)) * 100}%` }} /> : null}
              {admin ? <b style={{ height: `${(admin / Math.max(total, 1)) * 100}%` }} /> : null}
            </div>
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
