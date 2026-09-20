"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ClipboardPlus,
  LoaderCircle,
  Phone,
  Printer,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import {
  ANCHORS,
  COVERAGE_GAP_OPTIONS,
  DOMAINS,
  LOCATION_TYPES,
  PAYMENT_GROUPS,
  SERVICE_LINES,
  type AnchorId,
  type DomainId,
  type LocationTypeId,
  type PaymentTypeId,
} from "@/data/idd-care-scale";
import type { ClinicCallLog, ClinicRating, DomainScores, PaymentMatrix, PaymentNotes } from "@/lib/clinic-rating-types";

type LoadState = { clinics: ClinicRating[]; persistLabel: string; error: string; loading: boolean };

const emptyCall = {
  date: new Date().toISOString().slice(0, 10),
  raterName: "",
  clinicContact: "",
  clinicPhone: "",
  notes: "",
};

function blankClinic(): ClinicRating {
  return {
    id: crypto.randomUUID(),
    clinicName: "",
    address: "",
    locationTypes: [],
    scores: {},
    payment: {},
    paymentNotes: {},
    coverageGaps: [],
    coverageGapOther: "",
    callLog: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function summarize(scores: DomainScores) {
  const rated = DOMAINS.filter((domain) => scores[domain.id]);
  const points = rated.reduce((total, domain) => total + (ANCHORS.find((anchor) => anchor.id === scores[domain.id])?.points || 0), 0);
  return {
    rated: rated.length,
    points,
    max: DOMAINS.length * ANCHORS[ANCHORS.length - 1].points,
    counts: Object.fromEntries(ANCHORS.map((anchor) => [anchor.id, rated.filter((domain) => scores[domain.id] === anchor.id).length])) as Record<AnchorId, number>,
  };
}

function formatDate(value?: string) {
  if (!value) return "Not yet rated";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ClinicRatingDesk() {
  const [state, setState] = useState<LoadState>({ clinics: [], persistLabel: "", error: "", loading: true });
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ClinicRating | null>(null);
  const [call, setCall] = useState(emptyCall);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [openDomain, setOpenDomain] = useState<DomainId | "">("");

  async function loadClinics() {
    try {
      const response = await fetch("/api/clinic-ratings");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load clinic ratings.");
      setState({ clinics: data.clinics || [], persistLabel: data.persistLabel || "", error: "", loading: false });
    } catch (error) {
      setState({ clinics: [], persistLabel: "", error: error instanceof Error ? error.message : "Unable to load clinic ratings.", loading: false });
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/clinic-ratings");
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) throw new Error(data.error || "Unable to load clinic ratings.");
        setState({ clinics: data.clinics || [], persistLabel: data.persistLabel || "", error: "", loading: false });
      } catch (error) {
        if (cancelled) return;
        setState({ clinics: [], persistLabel: "", error: error instanceof Error ? error.message : "Unable to load clinic ratings.", loading: false });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return state.clinics;
    return state.clinics.filter((clinic) => [clinic.clinicName, clinic.address, clinic.callLog.at(-1)?.clinicContact].join(" ").toLowerCase().includes(needle));
  }, [query, state.clinics]);

  function startNew() {
    setEditing(blankClinic());
    setCall({ ...emptyCall, date: new Date().toISOString().slice(0, 10) });
    setStatus("");
    setOpenDomain("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openClinic(clinic: ClinicRating) {
    setEditing(clinic);
    const last = clinic.callLog.at(-1);
    setCall({
      date: new Date().toISOString().slice(0, 10),
      raterName: last?.raterName || "",
      clinicContact: last?.clinicContact || "",
      clinicPhone: last?.clinicPhone || "",
      notes: "",
    });
    setStatus("");
    setOpenDomain("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveClinic() {
    if (!editing) return;
    setSaving(true);
    setStatus("");
    try {
      const response = await fetch("/api/clinic-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editing, call }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save this clinic.");
      setEditing(data.clinic);
      setCall((current) => ({ ...current, notes: "" }));
      setStatus("Saved. The next call can open this clinic and update the same rating.");
      await loadClinics();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save this clinic.");
    } finally {
      setSaving(false);
    }
  }

  async function removeClinic(id: string) {
    if (!window.confirm("Delete this clinic rating and its call history?")) return;
    const response = await fetch(`/api/clinic-ratings/${id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(data.error || "Unable to delete this clinic.");
      return;
    }
    setEditing(null);
    await loadClinics();
  }

  if (editing) {
    const summary = summarize(editing.scores);
    return (
      <div className="rating-desk">
        <div className="rating-toolbar">
          <button type="button" className="text-link" onClick={() => setEditing(null)}><ArrowLeft size={16} /> All clinics</button>
          <div className="rating-toolbar-actions">
            <button type="button" className="button secondary" onClick={() => window.print()}><Printer size={16} /> Print</button>
            <button type="button" className="button primary" onClick={() => void saveClinic()} disabled={saving}>
              {saving ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />} Save this call
            </button>
          </div>
        </div>

        {status ? <p className={status.startsWith("Saved") ? "rating-status is-ok" : "form-error"}>{status}</p> : null}

        <section className="rating-card">
          <p className="eyebrow">This phone call</p>
          <h2>Log the outreach, then score what you heard.</h2>
          <div className="rating-grid four">
            <label>Call date<input type="date" value={call.date} onChange={(event) => setCall({ ...call, date: event.target.value })} /></label>
            <label>Rater / Arc staff<input value={call.raterName} onChange={(event) => setCall({ ...call, raterName: event.target.value })} placeholder="Health director name" /></label>
            <label>Clinic contact<input value={call.clinicContact} onChange={(event) => setCall({ ...call, clinicContact: event.target.value })} placeholder="Person you spoke with" /></label>
            <label>Clinic phone<input value={call.clinicPhone} onChange={(event) => setCall({ ...call, clinicPhone: event.target.value })} placeholder="904-..." /></label>
          </div>
          <label className="full-label">Call notes<textarea value={call.notes} onChange={(event) => setCall({ ...call, notes: event.target.value })} rows={3} placeholder="What you learned, next follow-up, waitlists, referral rules..." /></label>
        </section>

        <section className="rating-card">
          <p className="eyebrow">Clinic information</p>
          <div className="rating-grid two">
            <label>Clinic name<input value={editing.clinicName} onChange={(event) => setEditing({ ...editing, clinicName: event.target.value })} required /></label>
            <label>Address / home base<input value={editing.address} onChange={(event) => setEditing({ ...editing, address: event.target.value })} placeholder="For mobile or virtual clinics, list the administrative address" /></label>
          </div>
          <fieldset className="chip-fieldset">
            <legend>Location type — check all that apply</legend>
            <div className="chip-row">
              {LOCATION_TYPES.map((item) => {
                const checked = editing.locationTypes.includes(item.id);
                return (
                  <label key={item.id} className={checked ? "is-on" : ""}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setEditing({
                        ...editing,
                        locationTypes: checked
                          ? editing.locationTypes.filter((value) => value !== item.id)
                          : [...editing.locationTypes, item.id as LocationTypeId],
                      })}
                    />
                    {item.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </section>

        <section className="rating-card rating-summary-card">
          <div>
            <p className="eyebrow">Scoring snapshot</p>
            <h2>{summary.points} / {summary.max} points</h2>
            <p>{summary.rated} of {DOMAINS.length} domains rated. Select the anchor that matches typical observed practice, not aspirational policy.</p>
          </div>
          <dl>
            {ANCHORS.map((anchor) => (
              <div key={anchor.id}>
                <dt>{anchor.label}</dt>
                <dd>{summary.counts[anchor.id]}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rating-card">
          <p className="eyebrow">Scale anchors</p>
          <div className="anchor-guide">
            {ANCHORS.map((anchor) => (
              <article key={anchor.id}>
                <strong>{anchor.label}</strong>
                <p>{anchor.meaning}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rating-card">
          <p className="eyebrow">Rating scale</p>
          <h2>Nine domains of integrated IDD care</h2>
          <div className="domain-list">
            {DOMAINS.map((domain) => {
              const selected = editing.scores[domain.id];
              const open = openDomain === domain.id;
              return (
                <article className="domain-card" key={domain.id}>
                  <header>
                    <div>
                      <p className="eyebrow">Domain {domain.number}</p>
                      <h3>{domain.title}</h3>
                    </div>
                    <button type="button" onClick={() => setOpenDomain(open ? "" : domain.id)}>{open ? "Hide descriptions" : "Show descriptions"}</button>
                  </header>
                  <div className="anchor-choices">
                    {ANCHORS.map((anchor) => (
                      <label key={anchor.id} className={selected === anchor.id ? "is-on" : ""}>
                        <input
                          type="radio"
                          name={domain.id}
                          checked={selected === anchor.id}
                          onChange={() => setEditing({ ...editing, scores: { ...editing.scores, [domain.id]: anchor.id } })}
                        />
                        <span>{anchor.label}</span>
                      </label>
                    ))}
                  </div>
                  {open ? (
                    <div className="anchor-copy">
                      {ANCHORS.map((anchor) => (
                        <p key={anchor.id}><strong>{anchor.label}.</strong> {domain.anchors[anchor.id]}</p>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        <section className="rating-card">
          <p className="eyebrow">Domain 9 supplement</p>
          <h2>Payment methods accepted</h2>
          <p className="rating-lede">For each payment type, check every service line where the clinic accepts it for patients with IDD. Leave blank if it is not accepted or the service is not offered.</p>
          <div className="payment-table-wrap">
            <table className="payment-table">
              <thead>
                <tr>
                  <th>Payment type</th>
                  {SERVICE_LINES.map((line) => <th key={line.id}>{line.label}</th>)}
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {PAYMENT_GROUPS.map((group) => (
                  <Fragment key={group.id}>
                    <tr className="payment-group"><th colSpan={5}>{group.title}</th></tr>
                    {group.items.map((item) => (
                      <tr key={item.id}>
                        <th scope="row">{item.label}</th>
                        {SERVICE_LINES.map((line) => {
                          const checked = Boolean(editing.payment[item.id as PaymentTypeId]?.[line.id]);
                          return (
                            <td key={line.id}>
                              <label>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    const row = { ...(editing.payment[item.id as PaymentTypeId] || {}) };
                                    if (checked) delete row[line.id];
                                    else row[line.id] = true;
                                    const payment: PaymentMatrix = { ...editing.payment, [item.id]: row };
                                    setEditing({ ...editing, payment });
                                  }}
                                  aria-label={`${item.label} for ${line.label}`}
                                />
                              </label>
                            </td>
                          );
                        })}
                        <td>
                          <input
                            value={editing.paymentNotes[item.id as PaymentTypeId] || ""}
                            onChange={(event) => {
                              const paymentNotes: PaymentNotes = { ...editing.paymentNotes, [item.id]: event.target.value };
                              setEditing({ ...editing, paymentNotes });
                            }}
                            placeholder="Plans, limits, conditions"
                          />
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <fieldset className="chip-fieldset">
            <legend>When coverage is not accepted, lapses, or does not cover a needed service, the clinic typically</legend>
            <div className="chip-stack">
              {COVERAGE_GAP_OPTIONS.map((item) => {
                const checked = editing.coverageGaps.includes(item.id);
                return (
                  <label key={item.id} className={checked ? "is-on" : ""}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setEditing({
                        ...editing,
                        coverageGaps: checked
                          ? editing.coverageGaps.filter((value) => value !== item.id)
                          : [...editing.coverageGaps, item.id],
                      })}
                    />
                    {item.label}
                  </label>
                );
              })}
            </div>
            <label className="full-label">Other / details<input value={editing.coverageGapOther} onChange={(event) => setEditing({ ...editing, coverageGapOther: event.target.value })} /></label>
          </fieldset>
        </section>

        {editing.callLog.length ? (
          <section className="rating-card">
            <p className="eyebrow">Call history</p>
            <h2>Previous outreach to this clinic</h2>
            <ol className="call-log">
              {[...editing.callLog].reverse().map((entry: ClinicCallLog) => (
                <li key={entry.id}>
                  <strong>{formatDate(entry.date)}</strong>
                  <span>{[entry.raterName, entry.clinicContact, entry.clinicPhone].filter(Boolean).join(" · ") || "No contact details"}</span>
                  {entry.notes ? <p>{entry.notes}</p> : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <div className="rating-toolbar sticky-end">
          <button type="button" className="button secondary" onClick={() => void removeClinic(editing.id)}><Trash2 size={16} /> Delete clinic</button>
          <button type="button" className="button primary" onClick={() => void saveClinic()} disabled={saving}>
            {saving ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />} Save this call
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rating-desk">
      <div className="results-head">
        <div>
          <p className="eyebrow">Living clinic directory</p>
          <h2>{state.clinics.length} clinic {state.clinics.length === 1 ? "rating" : "ratings"}</h2>
        </div>
        <p>{state.persistLabel || "Open a clinic to update its score after the next outreach call."}</p>
      </div>

      <div className="rating-toolbar">
        <label className="search-field rating-search">
          <span>Search clinics</span>
          <div><Search size={17} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Clinic name, address, or contact" /></div>
        </label>
        <button type="button" className="button primary" onClick={startNew}><ClipboardPlus size={18} /> Log a clinic call</button>
      </div>

      {state.loading ? <p className="rating-status">Loading saved clinics…</p> : null}
      {state.error ? <p className="form-error">{state.error}</p> : null}

      {!state.loading && !filtered.length ? (
        <div className="empty-state">
          <Phone size={28} />
          <h3>No clinic ratings yet</h3>
          <p>Start the first record while you are on the phone with a potential specialty clinic.</p>
          <button type="button" onClick={startNew}>Log a clinic call</button>
        </div>
      ) : (
        <div className="resource-cards rating-cards">
          {filtered.map((clinic) => {
            const summary = summarize(clinic.scores);
            const lastCall = clinic.callLog.at(-1);
            return (
              <article className="resource-card" key={clinic.id}>
                <div className="resource-card-top">
                  <span className="resource-index">{summary.points}</span>
                  <div>
                    <p>Updated {formatDate(clinic.updatedAt)}</p>
                    <h3>{clinic.clinicName}</h3>
                  </div>
                </div>
                <p className="resource-description">{clinic.address || "No address recorded yet."}</p>
                <dl>
                  <div><dt>Rated</dt><dd>{summary.rated} of {DOMAINS.length} domains</dd></div>
                  <div><dt>Last call</dt><dd>{lastCall ? `${formatDate(lastCall.date)}${lastCall.clinicContact ? ` · ${lastCall.clinicContact}` : ""}` : "No call logged"}</dd></div>
                  <div><dt>Setting</dt><dd>{clinic.locationTypes.length ? clinic.locationTypes.join(", ") : "Not specified"}</dd></div>
                </dl>
                <div className="resource-actions">
                  <button type="button" className="text-link" onClick={() => openClinic(clinic)}>Update after this call</button>
                  <span>{summary.points}/{summary.max}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
