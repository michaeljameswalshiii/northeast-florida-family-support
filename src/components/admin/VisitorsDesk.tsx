"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { BarChart, formatWhen, Kpi } from "@/components/admin/AdminWidgets";

type Visit = {
  id: string;
  createdAt: string;
  path: string;
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  countryName?: string;
  referrerHost?: string;
  source?: string;
  device?: string;
  browser?: string;
  admin?: boolean;
};

type Payload = {
  days: number;
  items: Visit[];
  uniqueVisitors: number;
  uniqueLocations: number;
  topCities: Array<{ label: string; count: number }>;
  series?: Array<{ label: string; value: number; adminValue?: number }>;
  adminVisits?: number;
  uniqueAdmin?: number;
  note?: string;
};

function locationOf(visit: Visit) {
  const parts = [visit.city, visit.region].filter(Boolean);
  const country = visit.countryName || visit.country;
  if (parts.length && country) return `${parts.join(", ")}, ${country}`;
  return parts.join(", ") || country || "Unknown";
}

export function VisitorsDesk() {
  const [days, setDays] = useState<7 | 30>(7);
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async (windowDays: 7 | 30) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/visitors?days=${windowDays}`, { credentials: "include", cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Could not load visitors");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load visitors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(days); }, [days, load]);

  const filtered = useMemo(() => {
    const items = data?.items || [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((visit) => [visit.ip, locationOf(visit), visit.path, visit.source, visit.referrerHost, visit.browser, visit.device].join(" ").toLowerCase().includes(q));
  }, [data, query]);

  async function markAdmin(ip: string) {
    const res = await fetch("/api/admin/admin-ips", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip, label: "Staff / admin" }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || "Could not mark that IP as admin");
      return;
    }
    await load(days);
  }

  function downloadCsv() {
    const rows = [["When", "IP", "Admin", "Location", "Page", "Source", "Device", "Browser"], ...filtered.map((visit) => [visit.createdAt, visit.ip, visit.admin ? "yes" : "", locationOf(visit), visit.path, visit.source || "", visit.device || "", visit.browser || ""])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `navigator-visitors-${days}d.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-desk">
      <header className="admin-desk-head">
        <div>
          <p className="eyebrow">People</p>
          <h1>Visitors</h1>
          <p>IP addresses and cities. Staff IPs can be marked so they stay out of report totals.</p>
        </div>
        <div className="admin-desk-actions">
          <div className="admin-seg">
            <button type="button" className={days === 7 ? "is-on" : ""} onClick={() => setDays(7)}>7 days</button>
            <button type="button" className={days === 30 ? "is-on" : ""} onClick={() => setDays(30)}>30 days</button>
          </div>
          <button type="button" className="button secondary" onClick={() => void load(days)}><RefreshCw size={16} /> Refresh</button>
          <button type="button" className="button primary" onClick={downloadCsv} disabled={!data}><Download size={16} /> CSV</button>
        </div>
      </header>
      {error ? <p className="form-error">{error}</p> : null}
      {data ? (
        <>
          <div className="admin-kpi-grid">
            <Kpi label="Unique IPs" value={data.uniqueVisitors} hint={`Last ${data.days} days`} />
            <Kpi label="Places" value={data.uniqueLocations} />
            <Kpi label="Staff visits" value={data.adminVisits || 0} />
            <Kpi label="Staff IPs" value={data.uniqueAdmin || 0} />
          </div>
          <section className="admin-card"><h2>Daily visits</h2><BarChart series={data.series || []} /></section>
          <label className="field">Search visitors<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="IP, city, page…" /></label>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>IP</th>
                  <th>Location</th>
                  <th>Page</th>
                  <th>Source</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((visit) => (
                  <tr key={visit.id} className={visit.admin ? "is-admin" : ""}>
                    <td>{formatWhen(visit.createdAt)}</td>
                    <td>{visit.ip}</td>
                    <td>{locationOf(visit)}</td>
                    <td>{visit.path}</td>
                    <td>{visit.source || visit.referrerHost || "Direct"}</td>
                    <td>{visit.admin ? "Staff" : <button type="button" className="text-link" onClick={() => void markAdmin(visit.ip)}>Mark staff</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.note ? <p className="admin-lede">{data.note}</p> : null}
        </>
      ) : loading ? <p>Loading visitors…</p> : null}
    </div>
  );
}
