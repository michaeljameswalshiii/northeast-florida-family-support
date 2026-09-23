"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Printer, RefreshCw } from "lucide-react";
import { BarChart, formatWhen, Kpi } from "@/components/admin/AdminWidgets";

type Report = {
  days: number;
  generatedAt: string;
  views: number;
  uniqueVisitors: number;
  uniqueLocations: number;
  pagesPerVisitor?: number;
  series: Array<{ label: string; value: number; adminValue?: number }>;
  adminVisits?: number;
  uniqueAdmin?: number;
  excludedIps?: Array<{ ip: string; label?: string; source: string }>;
  topPages: Array<{ path: string; views: number }>;
  topCities: Array<{ label: string; count: number }>;
  sources: Array<{ host: string; count: number }>;
  devices: Array<{ device: string; count: number }>;
  browsers: Array<{ browser: string; count: number }>;
  daily: Array<{ date: string; label: string; views: number; uniqueVisitors: number }>;
};

export function ReportsDesk() {
  const [days, setDays] = useState<7 | 30>(7);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (windowDays: 7 | 30) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/reports?days=${windowDays}`, { credentials: "include", cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Could not load report");
      setReport(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(days); }, [days, load]);

  function downloadCsv() {
    if (!report) return;
    const lines = [
      ["Northeast Florida Support Navigator website report"],
      [`Last ${report.days} days`, formatWhen(report.generatedAt)],
      [],
      ["Metric", "Value"],
      ["Page views", String(report.views)],
      ["Unique IPs", String(report.uniqueVisitors)],
      ["Places", String(report.uniqueLocations)],
      ["Avg pages / visitor", String(report.pagesPerVisitor ?? "")],
      ["Staff visits left out", String(report.adminVisits ?? 0)],
      [],
      ["Date", "Views", "Unique IPs"],
      ...report.daily.map((row) => [row.date, String(row.views), String(row.uniqueVisitors)]),
      [],
      ["Top pages", "Views"],
      ...report.topPages.map((row) => [row.path, String(row.views)]),
      [],
      ["Cities", "Visits"],
      ...report.topCities.map((row) => [row.label, String(row.count)]),
    ];
    const csv = lines.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `navigator-report-${report.days}d.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-desk">
      <header className="admin-desk-head">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Reports</h1>
          <p>Weekly numbers you can print. Staff IPs are left out of the totals.</p>
        </div>
        <div className="admin-desk-actions">
          <div className="admin-seg">
            <button type="button" className={days === 7 ? "is-on" : ""} onClick={() => setDays(7)}>7 days</button>
            <button type="button" className={days === 30 ? "is-on" : ""} onClick={() => setDays(30)}>30 days</button>
          </div>
          <button type="button" className="button secondary" onClick={() => void load(days)}><RefreshCw size={16} /> Refresh</button>
          <button type="button" className="button secondary" onClick={() => window.print()}><Printer size={16} /> Print</button>
          <button type="button" className="button primary" onClick={downloadCsv} disabled={!report}><Download size={16} /> CSV</button>
        </div>
      </header>
      {error ? <p className="form-error">{error}</p> : null}
      {loading && !report ? <p>Loading report…</p> : null}
      {report ? (
        <>
          <div className="admin-kpi-grid">
            <Kpi label="Page views" value={report.views} hint={`Last ${report.days} days`} />
            <Kpi label="Unique IPs" value={report.uniqueVisitors} />
            <Kpi label="Places" value={report.uniqueLocations} />
            <Kpi label="Pages / visitor" value={report.pagesPerVisitor || "—"} />
          </div>
          <section className="admin-card">
            <h2>Traffic</h2>
            <BarChart series={report.series} />
          </section>
          <div className="admin-split">
            <section className="admin-card">
              <h2>Top pages</h2>
              <ul className="admin-rank">{report.topPages.map((row) => <li key={row.path}><span>{row.path}</span><strong>{row.views}</strong></li>)}</ul>
            </section>
            <section className="admin-card">
              <h2>Cities</h2>
              <ul className="admin-rank">{report.topCities.map((row) => <li key={row.label}><span>{row.label}</span><strong>{row.count}</strong></li>)}</ul>
            </section>
          </div>
          <section className="admin-card">
            <h2>Sources, devices, browsers</h2>
            <div className="admin-split">
              <ul className="admin-rank">{report.sources.map((row) => <li key={row.host}><span>{row.host}</span><strong>{row.count}</strong></li>)}</ul>
              <ul className="admin-rank">{report.devices.map((row) => <li key={row.device}><span>{row.device}</span><strong>{row.count}</strong></li>)}</ul>
              <ul className="admin-rank">{report.browsers.map((row) => <li key={row.browser}><span>{row.browser}</span><strong>{row.count}</strong></li>)}</ul>
            </div>
          </section>
          <section className="admin-card">
            <h2>Staff IPs left out of totals</h2>
            <p className="admin-lede">{report.adminVisits || 0} staff visits from {report.uniqueAdmin || 0} IPs.</p>
            <ul className="admin-rank">{(report.excludedIps || []).map((row) => <li key={row.ip}><span>{row.ip}</span><strong>{row.label || row.source}</strong></li>)}</ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
