"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ClipboardPlus,
  ImagePlus,
  LoaderCircle,
  Phone,
  Printer,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import {
  ACCESSIBILITY_FEATURES,
  ANCHORS,
  CLINIC_PHOTO_KINDS,
  COVERAGE_GAP_OPTIONS,
  DOMAINS,
  LOCATION_TYPES,
  PAYMENT_GROUPS,
  SERVICE_LINES,
  type AccessibilityFeatureId,
  type AnchorId,
  type ClinicPhotoKind,
  type LocationTypeId,
  type PaymentTypeId,
} from "@/data/idd-care-scale";
import { CLINIC_COUNTIES, formatClinicAddress, type ClinicCallLog, type ClinicPhoto, type ClinicRating, type DomainScores, type PaymentMatrix, type PaymentNotes } from "@/lib/clinic-rating-types";

type LoadState = { clinics: ClinicRating[]; persistLabel: string; error: string; loading: boolean };

const FORM_STEPS = [
  { id: "call-details", label: "Call" },
  { id: "clinic-details", label: "Clinic" },
  { id: "facility-access", label: "Photos" },
  { id: "domain-scores", label: "Scores" },
  { id: "payment-access", label: "Payment" },
];

const emptyCall = {
  date: new Date().toISOString().slice(0, 10),
  raterName: "",
  clinicContact: "",
  clinicPhone: "",
  clinicEmail: "",
  notes: "",
};

function blankClinic(): ClinicRating {
  return {
    id: crypto.randomUUID(),
    clinicName: "",
    street: "",
    suite: "",
    city: "",
    state: "FL",
    zip: "",
    county: "",
    address: "",
    email: "",
    locationTypes: [],
    accessibilityFeatures: [],
    accessibilityNotes: "",
    photos: [],
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

function photoUrl(clinicId: string, photoId: string) {
  return `/api/clinic-ratings/${encodeURIComponent(clinicId)}/photos/${encodeURIComponent(photoId)}`;
}

async function compressPhoto(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Choose a photo file (JPEG, PNG, or WebP).");
  const bitmap = await createImageBitmap(file);
  const max = 1400;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not prepare the photo.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((next) => (next ? resolve(next) : reject(new Error("Could not compress that photo."))), "image/jpeg", 0.72);
  });
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return { data: btoa(binary), contentType: "image/jpeg" };
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
  const [callSaved, setCallSaved] = useState(false);
  const [savedClinicSnapshot, setSavedClinicSnapshot] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [photoKind, setPhotoKind] = useState<ClinicPhotoKind>("facility");
  const [photoBusy, setPhotoBusy] = useState(false);

  const callHasDetails = Boolean(call.raterName || call.clinicContact || call.clinicPhone || call.clinicEmail || call.notes);
  const hasUnsavedChanges = Boolean(editing && (JSON.stringify(editing) !== savedClinicSnapshot || (!callSaved && callHasDetails)));

  useEffect(() => {
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [hasUnsavedChanges]);

  function updateCall(values: Partial<typeof emptyCall>) {
    setCall((current) => ({ ...current, ...values }));
    setCallSaved(false);
  }

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
    return state.clinics.filter((clinic) => [clinic.clinicName, formatClinicAddress(clinic), clinic.email, clinic.city, clinic.zip, clinic.county, clinic.callLog.at(-1)?.clinicContact, clinic.callLog.at(-1)?.clinicEmail].join(" ").toLowerCase().includes(needle));
  }, [query, state.clinics]);

  function startNew() {
    const clinic = blankClinic();
    setEditing(clinic);
    setSavedClinicSnapshot(JSON.stringify(clinic));
    setCall({ ...emptyCall, date: new Date().toISOString().slice(0, 10) });
    setCallSaved(false);
    setStatus("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openClinic(clinic: ClinicRating) {
    const next = {
      ...clinic,
      accessibilityFeatures: clinic.accessibilityFeatures || [],
      accessibilityNotes: clinic.accessibilityNotes || "",
      photos: clinic.photos || [],
    };
    setEditing(next);
    setSavedClinicSnapshot(JSON.stringify(next));
    setCall({ ...emptyCall, date: new Date().toISOString().slice(0, 10) });
    setCallSaved(false);
    setStatus("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveClinic() {
    if (!editing) return;
    if (!editing.clinicName.trim()) {
      setStatus("Enter the clinic name before saving.");
      document.querySelector<HTMLInputElement>("#clinic-name")?.focus();
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      const response = await fetch("/api/clinic-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editing, call: callSaved || !callHasDetails ? undefined : call }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save this clinic.");
      setEditing(data.clinic);
      setSavedClinicSnapshot(JSON.stringify(data.clinic));
      setCall({ ...emptyCall, date: new Date().toISOString().slice(0, 10) });
      setCallSaved(true);
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

  async function addPhotos(files: FileList | null) {
    if (!editing || !files?.length) return;
    setPhotoBusy(true);
    setStatus("");
    try {
      const next = [...editing.photos];
      for (const file of Array.from(files)) {
        const compressed = await compressPhoto(file);
        const response = await fetch(`/api/clinic-ratings/${editing.id}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: photoKind,
            caption: file.name.replace(/\.[^.]+$/, "").slice(0, 120),
            contentType: compressed.contentType,
            data: compressed.data,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Unable to add that photo.");
        next.push(data.photo as ClinicPhoto);
      }
      setEditing({ ...editing, photos: next });
      setStatus(next.length === editing.photos.length + files.length ? "Photos added. Save the clinic to keep captions and features." : "Photos added.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to add that photo.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function removePhoto(photoId: string) {
    if (!editing) return;
    setPhotoBusy(true);
    try {
      const response = await fetch(`/api/clinic-ratings/${editing.id}/photos/${photoId}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to remove that photo.");
      setEditing({ ...editing, photos: editing.photos.filter((photo) => photo.id !== photoId) });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to remove that photo.");
    } finally {
      setPhotoBusy(false);
    }
  }

  if (editing) {
    const summary = summarize(editing.scores);
    return (
      <div className="rating-desk">
        <div className="rating-toolbar">
          <button type="button" className="text-link" onClick={() => {
            if (!hasUnsavedChanges || window.confirm("Discard unsaved changes and return to all clinics?")) setEditing(null);
          }}><ArrowLeft size={16} /> All clinics</button>
          <nav className="rating-steps" aria-label="Form sections">
            {FORM_STEPS.map((step, index) => (
              <a href={`#${step.id}`} key={step.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {step.label}
              </a>
            ))}
          </nav>
          <div className="rating-toolbar-actions">
            <button type="button" className="button secondary" onClick={() => window.print()}><Printer size={16} /> Print</button>
            <button type="button" className="button primary" onClick={() => void saveClinic()} disabled={saving || photoBusy}>
              {saving ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />} Save this call
            </button>
          </div>
        </div>

        {status ? <p className={status.startsWith("Saved") ? "rating-status is-ok" : "form-error"} role="status">{status}</p> : null}

        {!editing.callLog.length ? (
          <section className="rating-card clinic-start-card">
            <div className="clinic-start-copy">
              <p className="eyebrow">New clinic</p>
              <h2>Capture the clinic first, then score the call.</h2>
              <p>Name, address, photos, and access features stay with this record. Domain scores can wait until the conversation gives you enough evidence.</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/clinic-exterior.jpg" alt="" width={640} height={360} />
          </section>
        ) : null}

        <section className="rating-card" id="call-details">
          <p className="eyebrow">This phone call</p>
          <h2>Who did you reach, and what did you hear?</h2>
          <p className="privacy-warning"><strong>No patient information.</strong> Record clinic operations only—never a patient name, diagnosis, date of birth, appointment, or medical detail.</p>
          <div className="rating-grid two">
            <label className="field">Call date<input type="date" value={call.date} onChange={(event) => updateCall({ date: event.target.value })} /></label>
            <label className="field">Rater / Arc staff<input value={call.raterName} onChange={(event) => updateCall({ raterName: event.target.value })} placeholder="Staff member name" autoComplete="name" /></label>
          </div>
          <div className="rating-grid three">
            <label className="field">Clinic contact<input value={call.clinicContact} onChange={(event) => updateCall({ clinicContact: event.target.value })} placeholder="Person you spoke with" autoComplete="organization-title" /></label>
            <label className="field">Clinic phone<input type="tel" value={call.clinicPhone} onChange={(event) => updateCall({ clinicPhone: event.target.value })} placeholder="904-..." autoComplete="tel" /></label>
            <label className="field">Contact email<input type="email" value={call.clinicEmail} onChange={(event) => updateCall({ clinicEmail: event.target.value })} placeholder="name@clinic.org" autoComplete="email" /></label>
          </div>
          <label className="field">Call notes<textarea value={call.notes} onChange={(event) => updateCall({ notes: event.target.value })} rows={3} maxLength={2000} placeholder="Waitlists, referral rules, clinic policies, and next follow-up. Do not include patient details." /><span className="field-hint">{call.notes.length}/2,000 characters</span></label>
        </section>

        <section className="rating-card" id="clinic-details">
          <p className="eyebrow">Clinic information</p>
          <h2>Save the clinic you can reopen later.</h2>
          <label className="field">Clinic name <span className="required-label">Required</span><input id="clinic-name" value={editing.clinicName} onChange={(event) => setEditing({ ...editing, clinicName: event.target.value })} required autoComplete="organization" /></label>
          <div className="address-grid">
            <label className="field address-street">Street address<input value={editing.street || ""} onChange={(event) => setEditing({ ...editing, street: event.target.value })} placeholder="2101 Arc Drive" autoComplete="address-line1" /></label>
            <label className="field address-suite">Suite / unit<input value={editing.suite || ""} onChange={(event) => setEditing({ ...editing, suite: event.target.value })} placeholder="Optional" autoComplete="address-line2" /></label>
            <label className="field address-city">City<input value={editing.city || ""} onChange={(event) => setEditing({ ...editing, city: event.target.value })} placeholder="St. Augustine" autoComplete="address-level2" /></label>
            <label className="field">State<input value={editing.state || "FL"} onChange={(event) => setEditing({ ...editing, state: event.target.value.toUpperCase().slice(0, 2) })} placeholder="FL" autoComplete="address-level1" maxLength={2} /></label>
            <label className="field">ZIP<input value={editing.zip || ""} onChange={(event) => setEditing({ ...editing, zip: event.target.value })} placeholder="32084" inputMode="numeric" autoComplete="postal-code" /></label>
            <label className="field address-county">County served
              <select value={editing.county || ""} onChange={(event) => setEditing({ ...editing, county: event.target.value })}>
                <option value="">Select county</option>
                {CLINIC_COUNTIES.map((county) => <option key={county} value={county}>{county}</option>)}
              </select>
            </label>
            <label className="field address-email">Clinic email<input type="email" value={editing.email || ""} onChange={(event) => setEditing({ ...editing, email: event.target.value })} placeholder="office@clinic.org" autoComplete="email" /></label>
          </div>
          <p className="rating-lede">For mobile or virtual clinics, use the home base or administrative address. Contact email on this call can be different from the clinic office email.</p>
          <fieldset className="choice-fieldset">
            <legend>Location type <span>Check all that apply</span></legend>
            <div className="choice-pills">
              {LOCATION_TYPES.map((item) => {
                const checked = editing.locationTypes.includes(item.id);
                return (
                  <label key={item.id} className={`choice-pill${checked ? " is-on" : ""}`}>
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
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </section>

        <section className="rating-card" id="facility-access">
          <p className="eyebrow">Facility and access</p>
          <h2>Pictures of the facility and accessibility features</h2>
          <p className="rating-lede">Capture what a family would see walking in: parking, entrance, waiting area, exam rooms, and access supports. Do not photograph patients or charts.</p>
          <fieldset className="choice-fieldset">
            <legend>Accessibility features on site <span>Check all the clinic confirmed</span></legend>
            <div className="choice-list">
              {ACCESSIBILITY_FEATURES.map((item) => {
                const checked = editing.accessibilityFeatures.includes(item.id);
                return (
                  <label key={item.id} className={`choice-row${checked ? " is-on" : ""}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setEditing({
                        ...editing,
                        accessibilityFeatures: checked
                          ? editing.accessibilityFeatures.filter((value) => value !== item.id)
                          : [...editing.accessibilityFeatures, item.id as AccessibilityFeatureId],
                      })}
                    />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <label className="field">Access notes<textarea value={editing.accessibilityNotes} onChange={(event) => setEditing({ ...editing, accessibilityNotes: event.target.value })} rows={3} maxLength={1200} placeholder="Hours for the quiet room, lift type, interpreter lead time, or other details." /><span className="field-hint">{editing.accessibilityNotes.length}/1,200 characters</span></label>

          <div className="photo-toolbar">
            <fieldset className="choice-fieldset">
              <legend>Add photos as</legend>
              <div className="choice-pills">
                {CLINIC_PHOTO_KINDS.map((item) => (
                  <label key={item.id} className={`choice-pill${photoKind === item.id ? " is-on" : ""}`}>
                    <input type="radio" name="photo-kind" checked={photoKind === item.id} onChange={() => setPhotoKind(item.id)} />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="button secondary photo-upload">
              {photoBusy ? <LoaderCircle className="spin" size={16} /> : <ImagePlus size={16} />}
              {photoBusy ? "Adding photos…" : "Add pictures"}
              <input type="file" accept="image/*" multiple hidden disabled={photoBusy} onChange={(event) => {
                void addPhotos(event.target.files);
                event.target.value = "";
              }} />
            </label>
          </div>
          {editing.photos.length ? (
            <ul className="photo-grid">
              {editing.photos.map((photo) => (
                <li key={photo.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl(editing.id, photo.id)} alt={photo.caption || `${photo.kind} photo`} />
                  <span className="photo-kind">{photo.kind === "accessibility" ? "Accessibility" : "Facility"}</span>
                  <label className="field">Caption
                    <input
                      value={photo.caption}
                      onChange={(event) => setEditing({
                        ...editing,
                        photos: editing.photos.map((item) => item.id === photo.id ? { ...item, caption: event.target.value } : item),
                      })}
                      placeholder="Entrance ramp, quiet room, parking…"
                    />
                  </label>
                  <button type="button" className="text-link" onClick={() => void removePhoto(photo.id)} disabled={photoBusy}>Remove</button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rating-lede">No pictures yet. Phone photos of the building, parking, and access features are enough.</p>
          )}
        </section>

        <section className="rating-card rating-summary-card" id="domain-scores">
          <div>
            <p className="eyebrow">Scoring snapshot</p>
            <h2>{summary.points} / {summary.max}</h2>
            <p>{summary.rated} of {DOMAINS.length} domains assessed. Leave a domain as “Not assessed” when the call did not establish enough evidence. Do not use “Not Present” to mean unknown.</p>
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
          <p className="eyebrow">Rating scale</p>
          <h2>Nine domains of integrated IDD care</h2>
          <p className="rating-lede">Choose one evidence-based rating per domain. “Not assessed” is different from “Not Present”; leave the domain unanswered when the clinic could not confirm its practice.</p>
          <div className="domain-list">
            {DOMAINS.map((domain) => {
              const selected = editing.scores[domain.id];
              return (
                <article className="domain-card" key={domain.id}>
                  <header>
                    <div>
                      <p className="eyebrow">Domain {domain.number}</p>
                      <h3>{domain.title}</h3>
                    </div>
                    <div className="domain-score-actions"><span className={`domain-selected${selected ? " is-set" : ""}`}>
                      {selected ? ANCHORS.find((anchor) => anchor.id === selected)?.label : "Not assessed"}
                    </span>{selected ? <button type="button" onClick={() => {
                      const scores = { ...editing.scores };
                      delete scores[domain.id];
                      setEditing({ ...editing, scores });
                    }}>Clear</button> : null}</div>
                  </header>
                  <div className="anchor-cards" role="radiogroup" aria-label={domain.title}>
                    {ANCHORS.map((anchor) => (
                      <label key={anchor.id} className={`anchor-card${selected === anchor.id ? " is-on" : ""}`}>
                        <input
                          type="radio"
                          name={domain.id}
                          checked={selected === anchor.id}
                          onChange={() => setEditing({ ...editing, scores: { ...editing.scores, [domain.id]: anchor.id } })}
                        />
                        <strong>{anchor.label}</strong>
                        <span>{domain.anchors[anchor.id]}</span>
                      </label>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rating-card" id="payment-access">
          <p className="eyebrow">Domain 9 supplement</p>
          <h2>Payment methods accepted</h2>
          <p className="rating-lede">Mark a service only when the clinic confirmed it accepts that payment type for patients with IDD. A blank box means “not confirmed”—use Notes to record a confirmed refusal, service not offered, plan limitation, or follow-up needed.</p>
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
                              <label className={`pay-check${checked ? " is-on" : ""}`}>
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
                                <span>{line.label}</span>
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
          <fieldset className="choice-fieldset">
            <legend>When coverage is not accepted, lapses, or does not cover a needed service, the clinic typically <span>Check all that apply</span></legend>
            <div className="choice-list">
              {COVERAGE_GAP_OPTIONS.map((item) => {
                const checked = editing.coverageGaps.includes(item.id);
                return (
                  <label key={item.id} className={`choice-row${checked ? " is-on" : ""}`}>
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
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
            {editing.coverageGaps.includes("other") ? (
              <label className="field">Other / details<input value={editing.coverageGapOther} onChange={(event) => setEditing({ ...editing, coverageGapOther: event.target.value })} placeholder="Describe the other response" /></label>
            ) : null}
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
                  <span>{[entry.raterName, entry.clinicContact, entry.clinicPhone, entry.clinicEmail].filter(Boolean).join(" · ") || "No contact details"}</span>
                  {entry.notes ? <p>{entry.notes}</p> : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <div className="rating-sticky">
          <div>
            <strong>{summary.rated} of {DOMAINS.length} domains assessed{hasUnsavedChanges ? " · Unsaved changes" : ""}</strong>
            <span>{summary.points} / {summary.max} points</span>
          </div>
          <div className="rating-toolbar-actions">
            <button type="button" className="button secondary" onClick={() => void removeClinic(editing.id)}><Trash2 size={16} /> Delete</button>
            <button type="button" className="button primary" onClick={() => void saveClinic()} disabled={saving || photoBusy}>
              {saving ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />} Save this call
            </button>
          </div>
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
        <button type="button" className="button primary" onClick={startNew}><ClipboardPlus size={18} /> Add a clinic</button>
      </div>

      {state.loading ? <p className="rating-status">Loading saved clinics…</p> : null}
      {state.error ? <p className="form-error">{state.error}</p> : null}

      {!state.loading && !filtered.length ? (
        <div className="empty-state clinic-empty">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/clinic-exterior.jpg" alt="" width={960} height={540} />
          <Phone size={28} />
          <h3>Add the first clinic</h3>
          <p>Start the record with clinic details and facility photos, then score integrated care while you are still on the call.</p>
          <button type="button" onClick={startNew}>Add a clinic</button>
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
                <p className="resource-description">{formatClinicAddress(clinic) || "No address recorded yet."}</p>
                <dl>
                  <div><dt>Rated</dt><dd>{summary.rated} of {DOMAINS.length} domains</dd></div>
                  <div><dt>Last call</dt><dd>{lastCall ? `${formatDate(lastCall.date)}${lastCall.clinicContact ? ` · ${lastCall.clinicContact}` : ""}` : "No call logged"}</dd></div>
                  <div><dt>Email</dt><dd>{clinic.email || lastCall?.clinicEmail || "Not recorded"}</dd></div>
                  <div><dt>Setting</dt><dd>{clinic.locationTypes.length ? clinic.locationTypes.join(", ") : "Not specified"}</dd></div>
                  <div><dt>Access</dt><dd>{clinic.accessibilityFeatures?.length ? `${clinic.accessibilityFeatures.length} feature${clinic.accessibilityFeatures.length === 1 ? "" : "s"}` : "Not recorded"}</dd></div>
                  <div><dt>Photos</dt><dd>{clinic.photos?.length ? `${clinic.photos.length} picture${clinic.photos.length === 1 ? "" : "s"}` : "None yet"}</dd></div>
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
