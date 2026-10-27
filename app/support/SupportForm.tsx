"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";

const inputStyles =
  "w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-base text-foreground shadow-sm backdrop-blur-sm transition-all duration-300 placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background/80 focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-60";

const SUPPORT_EMAIL = "support@revotracker.dvcklab.com";

type Status = "idle" | "sending" | "sent" | "error";

export function SupportForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const openedAt = useRef(Date.now());
  const elapsedRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  // No-JS submissions come back as /support?sent=1 or ?error=1.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("sent")) setStatus("sent");
    if (params.has("error")) {
      setError(`We could not send your message. Please email ${SUPPORT_EMAIL}.`);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (status === "sent") successRef.current?.focus();
  }, [status]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setStatus("sending");
    setError("");

    if (elapsedRef.current) {
      elapsedRef.current.value = String(Date.now() - openedAt.current);
    }

    try {
      const body = Object.fromEntries(new FormData(form).entries());
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Something went wrong. Please try again.");
      }

      form.reset();
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        className="flex h-full flex-col justify-center rounded-[22px] bg-background/50 p-8 focus:outline-none sm:p-10"
      >
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="mb-3 text-2xl font-semibold tracking-tight">Message sent</h3>
        <p className="mb-8 text-muted-foreground leading-relaxed">
          Thanks — it landed. You&apos;ll get a reply from a real person, usually within a
          day. If it&apos;s urgent, email{" "}
          <a className="text-primary hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/50 bg-background/50 px-8 py-3.5 text-sm font-medium transition-all hover:bg-background sm:w-auto"
        >
          Send another message
        </button>
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full flex-col rounded-[22px] bg-background/50 p-8 sm:p-10"
    >
      {/* Honeypot: invisible to people, filled by bots. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="_honey">Leave this field empty</label>
        <input type="text" id="_honey" name="_honey" tabIndex={-1} autoComplete="off" />
      </div>
      <input ref={elapsedRef} type="hidden" name="_elapsed" defaultValue="0" />

      <div className="mb-8">
        <h3 className="text-2xl font-semibold tracking-tight mb-2">Send a message</h3>
        <p className="text-sm text-muted-foreground">
          Goes straight to the person who builds this, no ticket queue in between.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 mb-6">
        <label className="group flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground/80 transition-colors group-focus-within:text-primary">
            Name
          </span>
          <input
            type="text"
            name="name"
            autoComplete="name"
            maxLength={100}
            placeholder="John Doe"
            required
            disabled={sending}
            className={inputStyles}
          />
        </label>

        <label className="group flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground/80 transition-colors group-focus-within:text-primary">
            Email
          </span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            maxLength={254}
            placeholder="john@example.com"
            required
            disabled={sending}
            className={inputStyles}
          />
        </label>
      </div>

      <label className="group mb-6 flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground/80 transition-colors group-focus-within:text-primary">
          Subject
        </span>
        <input
          type="text"
          name="subject"
          maxLength={200}
          placeholder="What can I help you with?"
          required
          disabled={sending}
          className={inputStyles}
        />
      </label>

      <label className="group mb-8 flex flex-col gap-2 flex-grow">
        <span className="text-sm font-medium text-foreground/80 transition-colors group-focus-within:text-primary">
          Message
        </span>
        <textarea
          name="message"
          maxLength={5000}
          placeholder="Describe your issue in detail..."
          required
          disabled={sending}
          className={`${inputStyles} min-h-[160px] resize-y flex-grow`}
        />
      </label>

      <p
        role="status"
        aria-live="polite"
        className={`mb-4 text-sm ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
      >
        {sending ? "Sending…" : status === "error" ? error : ""}
      </p>

      <div className="flex flex-col-reverse items-center justify-between gap-6 sm:flex-row mt-auto pt-6 border-t border-border/50">
        <Link
          href="/gyms"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to tracker
        </Link>

        <button
          type="submit"
          disabled={sending}
          className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-foreground px-8 py-3.5 text-sm font-medium text-background transition-all hover:scale-[1.02] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto hover:bg-primary"
        >
          <span className="relative z-10 flex items-center gap-2">
            {sending ? "Sending…" : "Send Message"}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </button>
      </div>
    </form>
  );
}
