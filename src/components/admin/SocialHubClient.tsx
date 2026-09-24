"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

type Platform = "instagram" | "facebook" | "x" | "linkedin";
type MediaAttachment = { kind: "image" | "video"; name: string; assetUrn: string };
type Post = { id: string; createdAt: string; createdBy: string; body: string; mediaUrl?: string; media?: MediaAttachment; platforms: Platform[]; status: string; results: Record<string, { status: string; note?: string }> };
const labels: Record<Platform, string> = { instagram: "Instagram", facebook: "Facebook Page", x: "X", linkedin: "LinkedIn" };

export function SocialHubClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [configured, setConfigured] = useState<Record<Platform, boolean>>({ instagram: false, facebook: false, x: false, linkedin: false });
  const [connected, setConnected] = useState<Record<Platform, boolean>>({ instagram: false, facebook: false, x: false, linkedin: false });
  const [selected, setSelected] = useState<Platform[]>(["linkedin"]);
  const [body, setBody] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [setupPlatform, setSetupPlatform] = useState<Platform | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [setupMessage, setSetupMessage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/social", { credentials: "include" });
    if (!response.ok) return;
    const data = await response.json();
    setPosts(data.posts || []);
    setConfigured(data.platforms || {});
    const nextConnected = data.connected || {};
    setConnected(nextConnected);
    setSelected((current) => {
      const live = (Object.keys(labels) as Platform[]).filter((p) => nextConnected[p]);
      if (!live.length) return current.filter((p) => p === "linkedin");
      if (current.some((p) => nextConnected[p])) return current;
      return live;
    });
  }
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!mediaFile) { setMediaPreview(""); return; }
    const next = URL.createObjectURL(mediaFile);
    setMediaPreview(next);
    return () => URL.revokeObjectURL(next);
  }, [mediaFile]);

  async function saveSetup(event: React.FormEvent) {
    event.preventDefault();
    if (!setupPlatform) return;
    setSetupMessage("");
    const response = await fetch("/api/admin/social/settings", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ platform: setupPlatform, clientId, clientSecret }) });
    const data = await response.json();
    if (!response.ok) { setSetupMessage(data.error || "Could not save setup"); return; }
    setSetupMessage(`${labels[setupPlatform]} developer setup saved securely.`); setClientId(""); setClientSecret(""); setSetupPlatform(null); await load();
  }

  function toggle(platform: Platform) {
    setSelected((current) => current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform]);
  }

  function chooseMedia(file?: File) {
    setMessage("");
    if (!file) { setMediaFile(null); return; }
    const isImage = ["image/jpeg", "image/png", "image/gif"].includes(file.type);
    const isVideo = file.type === "video/mp4";
    if (!isImage && !isVideo) {
      setMessage("Choose a JPG, PNG, GIF, or MP4 file.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    if (isImage && file.size > 20 * 1024 * 1024) {
      setMessage("Images must be 20 MB or smaller.");
      return;
    }
    if (isVideo && (file.size < 75 * 1024 || file.size > 500 * 1024 * 1024)) {
      setMessage("MP4 videos must be between 75 KB and 500 MB.");
      return;
    }
    setMediaFile(file);
    setMediaUrl("");
  }

  async function uploadLinkedInMedia(file: File): Promise<MediaAttachment> {
    const kind = file.type.startsWith("image/") ? "image" : "video";
    setUploadProgress(1);
    const pathname = `social-staging/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, "-")}`;
    const staged = await upload(pathname, file, {
      access: "private",
      handleUploadUrl: "/api/admin/social/media/blob",
      clientPayload: JSON.stringify({ kind }),
      contentType: file.type,
      multipart: file.size > 4 * 1024 * 1024,
      onUploadProgress: ({ percentage }) => setUploadProgress(Math.max(1, Math.round(percentage * 0.8))),
    });
    setUploadProgress(85);
    const transfer = await fetch("/api/admin/social/media/linkedin", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "transfer", blobUrl: staged.url, name: file.name }),
    });
    const result = await transfer.json();
    if (!transfer.ok) throw new Error(result.error || "Could not send media to LinkedIn.");
    setUploadProgress(100);
    return result.media as MediaAttachment;
  }

  async function savePost(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setMessage("");
    setUploadProgress(0);
    try {
      if (mediaFile && (!selected.includes("linkedin") || !connected.linkedin)) {
        throw new Error("Connect and select LinkedIn to publish an uploaded photo or video.");
      }
      const media = mediaFile ? await uploadLinkedInMedia(mediaFile) : undefined;
      const response = await fetch("/api/admin/social", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body, mediaUrl, media, platforms: selected }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not publish post");
      const results = data.post?.results || {};
      const notes = Object.entries(results).map(([platform, result]) => `${labels[platform as Platform] || platform}: ${(result as { note?: string; status?: string })?.note || (result as { status?: string })?.status}`);
      setMessage(notes.join(" ") || (data.post?.status === "published" ? "Published." : "Saved."));
      if (data.post?.status === "published" || data.post?.status === "partial") {
        setBody(""); setMediaUrl(""); setMediaFile(null);
        if (fileInput.current) fileInput.current.value = "";
      }
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not publish post");
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  }

  return (
    <div className="social-hub">
      <header className="admin-desk-head">
        <div>
          <p className="eyebrow">Social media</p>
          <h1>Share one update</h1>
          <p>Write once, send to the networks you have connected, and keep the publishing trail.</p>
        </div>
      </header>
      <section className="social-grid">
        <form onSubmit={savePost} className="admin-card">
          <h2>New post</h2>
          <label className="field">Post text
            <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={7} placeholder="Share an update with families…" required />
          </label>
          <p className="field-label">Photo or video <span>(optional)</span></p>
          <input ref={fileInput} onChange={(event) => chooseMedia(event.target.files?.[0])} type="file" accept="image/jpeg,image/png,image/gif,video/mp4" className="sr-only" />
          {!mediaFile ? (
            <button type="button" className="social-drop" onClick={() => fileInput.current?.click()}>
              <strong>Choose a photo or MP4 video</strong>
              <span>JPG, PNG, GIF up to 20 MB · MP4 up to 500 MB</span>
            </button>
          ) : (
            <div className="social-preview">
              {mediaFile.type.startsWith("image/") ? <img src={mediaPreview} alt="Selected upload preview" /> : <video src={mediaPreview} controls preload="metadata" />}
              <div>
                <span>{mediaFile.name} · {(mediaFile.size / 1024 / 1024).toFixed(1)} MB</span>
                <button type="button" onClick={() => { setMediaFile(null); if (fileInput.current) fileInput.current.value = ""; }}>Remove</button>
              </div>
            </div>
          )}
          {!mediaFile ? (
            <label className="field">Or use a public media link
              <input value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} type="url" placeholder="https://" />
            </label>
          ) : null}
          <fieldset className="social-platforms">
            <legend>Publish to</legend>
            {(Object.keys(labels) as Platform[]).map((platform) => (
              <label key={platform}>
                <span>
                  <input type="checkbox" checked={selected.includes(platform)} onChange={() => toggle(platform)} />
                  {labels[platform]}
                </span>
                <em className={configured[platform] ? "is-ready" : ""}>{configured[platform] ? "Configured" : "Needs setup"}</em>
              </label>
            ))}
          </fieldset>
          {saving && mediaFile && uploadProgress > 0 ? (
            <div className="social-progress">
              <span>Uploading media to LinkedIn</span>
              <b>{uploadProgress}%</b>
              <i><b style={{ width: `${uploadProgress}%` }} /></i>
            </div>
          ) : null}
          {message ? <p className="admin-banner">{message}</p> : null}
          <button className="button primary" disabled={saving || !selected.length} type="submit">
            {saving ? (mediaFile && uploadProgress < 100 ? "Uploading…" : "Publishing…") : "Publish"}
          </button>
        </form>
        <aside className="admin-card">
          <h2>Account connections</h2>
          <p className="admin-lede">Set up each developer app once, then connect the account by signing in on the platform. Passwords never enter this site.</p>
          {(Object.keys(labels) as Platform[]).map((platform) => (
            <div className="social-account" key={platform}>
              <div>
                <strong>{labels[platform]}</strong>
                <span className={connected[platform] ? "is-on" : configured[platform] ? "is-ready" : ""}>
                  {connected[platform] ? "Connected" : configured[platform] ? "Ready to connect" : "Setup needed"}
                </span>
              </div>
              <p>{connected[platform] ? "Authorization saved securely." : configured[platform] ? "The account owner can authorize access." : "Enter developer app credentials."}</p>
              <div className="social-account-actions">
                {configured[platform] ? <button type="button" className="button primary" onClick={() => { window.location.href = `/api/admin/social/connect?platform=${platform}`; }}>{connected[platform] ? "Reconnect" : "Connect"}</button> : null}
                <button type="button" className="button secondary" onClick={() => { setSetupPlatform(platform); setSetupMessage(""); }}>{configured[platform] ? "Update" : "Set up"}</button>
              </div>
            </div>
          ))}
        </aside>
      </section>
      {setupPlatform ? (
        <div className="admin-modal" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSetupPlatform(null)}>
          <form className="admin-card" onSubmit={saveSetup}>
            <h2>Set up {labels[setupPlatform]}</h2>
            <p className="admin-lede">Enter the developer App ID / Client ID and Secret. These are encrypted before storage.</p>
            {(setupPlatform === "linkedin" || setupPlatform === "facebook" || setupPlatform === "instagram") ? (
              <p className="admin-lede">Redirect URI to whitelist:<br /><code>{`https://northeast-florida-family-support.vercel.app/api/admin/social/${setupPlatform}/callback`}</code></p>
            ) : null}
            <label className="field">App ID / Client ID<input value={clientId} onChange={(event) => setClientId(event.target.value)} required /></label>
            <label className="field">App Secret / Client Secret<input value={clientSecret} onChange={(event) => setClientSecret(event.target.value)} type="password" autoComplete="new-password" required /></label>
            {setupMessage ? <p className="form-error">{setupMessage}</p> : null}
            <div className="admin-desk-actions">
              <button className="button primary" type="submit">Save encrypted setup</button>
              <button className="button secondary" type="button" onClick={() => setSetupPlatform(null)}>Cancel</button>
            </div>
          </form>
        </div>
      ) : null}
      <section className="admin-card">
        <h2>Post history</h2>
        <p className="admin-lede">{posts.length} saved</p>
        {posts.length === 0 ? <p>No posts yet.</p> : posts.map((post) => (
          <article className="social-post" key={post.id}>
            <header>
              <div>{post.platforms.map((platform) => <span key={platform}>{labels[platform]}</span>)}</div>
              <time>{new Date(post.createdAt).toLocaleString()}</time>
            </header>
            <p>{post.body}</p>
            {post.media ? <em>{post.media.kind === "image" ? "Photo" : "Video"}: {post.media.name}</em> : null}
            <strong>{post.status}</strong>
            {post.results && Object.keys(post.results).length ? (
              <ul>{Object.entries(post.results).map(([platform, result]) => <li key={platform}>{labels[platform as Platform] || platform}: {result.note || result.status}</li>)}</ul>
            ) : null}
          </article>
        ))}
      </section>
    </div>
  );
}
