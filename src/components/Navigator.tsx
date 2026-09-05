"use client";

import { FormEvent, useRef, useState } from "react";
import { Bot, ChevronRight, Copy, LoaderCircle, MapPin, Send, Sparkles, UserRound } from "lucide-react";
import { COUNTIES } from "@/data/resources";

type Message = { role: "user" | "assistant"; content: string; model?: string };

const QUICK_QUESTIONS = [
  "How do I get autism services for my child?",
  "What is ABA therapy?",
  "What replaces a CDDO in Florida?",
  "Who qualifies for the iBudget waiver?",
];

export function Navigator() {
  const [question, setQuestion] = useState("");
  const [county, setCounty] = useState("");
  const [age, setAge] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  async function ask(event?: FormEvent, suggested?: string) {
    event?.preventDefault();
    const text = (suggested || question).trim();
    if (!text || busy) return;
    const outgoing: Message = { role: "user", content: text };
    const history = [...messages, outgoing].slice(-8);
    setMessages(history);
    setQuestion("");
    setError("");
    setBusy(true);

    requestAnimationFrame(() => threadRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }));
    try {
      const response = await fetch("/api/navigator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, county, age, history: messages.slice(-6) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "My AI Administrator could not answer right now.");
      setMessages((current) => [...current, { role: "assistant", content: data.answer, model: data.model }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Please try again in a moment.");
    } finally {
      setBusy(false);
      requestAnimationFrame(() => threadRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }));
    }
  }

  async function copyAnswer(index: number, content: string) {
    await navigator.clipboard.writeText(content);
    setCopied(index);
    window.setTimeout(() => setCopied(null), 1500);
  }

  return (
    <section className="ai-shell" id="ask" aria-labelledby="ask-title">
      <div className="ai-head">
        <div className="ai-orb"><Sparkles size={24} /></div>
        <div>
          <p className="eyebrow">Your first clear next step</p>
          <h2 id="ask-title">Ask My AI Administrator</h2>
          <p>Get a Northeast Florida answer, then connect directly with the right human organization.</p>
        </div>
        <span className="ai-status"><span /> Available now</span>
      </div>

      {messages.length === 0 ? (
        <div className="quick-grid" aria-label="Suggested questions">
          {QUICK_QUESTIONS.map((item) => (
            <button type="button" key={item} onClick={() => void ask(undefined, item)}>
              <span>{item}</span><ChevronRight size={18} />
            </button>
          ))}
        </div>
      ) : (
        <div className="chat-thread" aria-live="polite" ref={threadRef}>
          {messages.map((message, index) => (
            <article className={`chat-message is-${message.role}`} key={`${message.role}-${index}`}>
              <span className="chat-avatar">{message.role === "assistant" ? <Bot size={18} /> : <UserRound size={18} />}</span>
              <div>
                <strong>{message.role === "assistant" ? "My AI Administrator" : "You"}</strong>
                <p>{message.content}</p>
                {message.role === "assistant" ? (
                  <div className="message-meta">
                    <span>{message.model ? `Answered with ${message.model}` : "Local guidance"}</span>
                    <button type="button" onClick={() => void copyAnswer(index, message.content)}>
                      <Copy size={14} /> {copied === index ? "Copied" : "Copy"}
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
          {busy ? (
            <article className="chat-message is-assistant is-loading">
              <span className="chat-avatar"><Bot size={18} /></span>
              <div><strong>My AI Administrator</strong><p><LoaderCircle className="spin" size={18} /> Finding the clearest local path…</p></div>
            </article>
          ) : null}
        </div>
      )}

      <form className="ask-form" onSubmit={(event) => void ask(event)}>
        <label htmlFor="question">What help are you looking for?</label>
        <textarea
          id="question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about evaluations, therapy, school services, waivers, benefits, or adult supports…"
          rows={3}
          maxLength={1200}
        />
        <div className="ask-options">
          <label>
            <MapPin size={16} /> County
            <select value={county} onChange={(event) => setCounty(event.target.value)}>
              <option value="">Any Northeast Florida county</option>
              {COUNTIES.filter((item) => item !== "All Northeast Florida").map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            Age
            <input type="number" min="0" max="120" inputMode="numeric" value={age} onChange={(event) => setAge(event.target.value)} placeholder="Optional" />
          </label>
          <button className="send-button" type="submit" disabled={!question.trim() || busy}>
            {busy ? <LoaderCircle className="spin" size={18} /> : <Send size={18} />}
            Ask My AI
          </button>
        </div>
        <p className="privacy-note">Please don’t include names, birth dates, medical record numbers, or other private information.</p>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
      </form>
    </section>
  );
}
