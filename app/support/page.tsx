import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Mail, MessageSquare, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Support | Revo Member Tracker",
  description: "Contact Dvcklab for help with Revo Member Tracker.",
};

const inputStyles =
  "w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-base text-foreground shadow-sm backdrop-blur-sm transition-all duration-300 placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background/80 focus:outline-none focus:ring-4 focus:ring-primary/10";

export default function SupportPage() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background text-foreground selection:bg-primary/20">
      {/* Immersive Background */}
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      <div className="pointer-events-none absolute left-[20%] top-[-10%] -z-10 h-[40rem] w-[40rem] rounded-full bg-primary/5 opacity-50 blur-[100px]" />
      <div className="pointer-events-none absolute right-[10%] top-[40%] -z-10 h-[30rem] w-[30rem] rounded-full bg-accent/5 opacity-50 blur-[80px]" />

      <div className="mx-auto w-full max-w-7xl px-6 pb-24 pt-16 sm:px-8 lg:px-12 lg:pt-24">
        {/* Header Section */}
        <div className="mb-16 md:mb-24 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary mb-8 backdrop-blur-sm">
            <ShieldAlert className="h-4 w-4" />
            Support
          </div>
          <p className="mt-6 max-w-2xl text-[clamp(1rem,2vw,1.25rem)] leading-relaxed text-muted-foreground">
            If something looks off, feels broken, or you just need a reply from
            the person behind the project, this is the straight path.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid gap-8 lg:grid-cols[1fr_1.2fr] lg:gap-12 xl:grid-cols-[1fr_1.5fr]">
          {/* Info Side */}
          <div className="flex flex-col gap-6">
            <div className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card/40 p-8 pt-10 shadow-lg backdrop-blur-md transition-all duration-500 hover:bg-card/60 hover:shadow-xl hover:shadow-primary/5">
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Mail className="h-6 w-6" />
              </div>
              <h2 className="mb-3 text-2xl font-semibold tracking-tight">
                Direct Email
              </h2>
              <p className="mb-6 text-muted-foreground leading-relaxed">
                Skip the form entirely. Send an email directly to my inbox for
                the fastest response possible.
              </p>
              <a
                href="mailto:dvcklab@outlook.com"
                className="inline-flex items-center gap-2 text-primary font-medium transition-all hover:gap-3 hover:text-primary/80"
              >
                dvcklab@outlook.com
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            <div className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card/40 p-8 pt-10 shadow-lg backdrop-blur-md transition-all duration-500 hover:bg-card/60 hover:shadow-xl hover:shadow-primary/5">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/50 text-foreground">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h2 className="mb-3 text-2xl font-semibold tracking-tight">
                What to include
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                To help me fix issues faster, please mention the{" "}
                <span className="text-foreground font-medium">
                  page you were on
                </span>
                , what you{" "}
                <span className="text-foreground font-medium">expected</span> to
                happen, and what{" "}
                <span className="text-foreground font-medium">
                  actually occurred
                </span>
                .
              </p>
            </div>
          </div>

          {/* Form Side */}
          <div className="relative rounded-3xl border border-border/50 bg-card/40 p-1 shadow-xl backdrop-blur-xl">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/0 dark:from-white/5 dark:to-transparent" />

            <form
              action="https://formsubmit.co/dvcklab@outlook.com"
              method="POST"
              className="flex h-full flex-col rounded-[22px] bg-background/50 p-8 sm:p-10"
            >
              <input
                type="hidden"
                name="_subject"
                value="Revo Member Tracker Support Request"
              />
              <input
                type="hidden"
                name="_next"
                value="https://revotracker.dvcklab.com"
              />
              <input type="hidden" name="_captcha" value="false" />

              <div className="mb-8">
                <h3 className="text-2xl font-semibold tracking-tight mb-2">
                  Send a message
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your message goes directly to Dvcklab via FormSubmit.
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
                    placeholder="John Doe"
                    required
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
                    placeholder="john@example.com"
                    required
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
                  placeholder="What can I help you with?"
                  required
                  className={inputStyles}
                />
              </label>

              <label className="group mb-8 flex flex-col gap-2 flex-grow">
                <span className="text-sm font-medium text-foreground/80 transition-colors group-focus-within:text-primary">
                  Message
                </span>
                <textarea
                  name="message"
                  placeholder="Describe your issue in detail..."
                  required
                  className={`${inputStyles} min-h-[160px] resize-y flex-grow`}
                />
              </label>

              <div className="flex flex-col-reverse items-center justify-between gap-6 sm:flex-row mt-auto pt-6 border-t border-border/50">
                <Link
                  href="/gyms"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back to tracker
                </Link>

                <button
                  type="submit"
                  className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-foreground px-8 py-3.5 text-sm font-medium text-background transition-all hover:scale-[1.02] hover:shadow-lg sm:w-auto hover:bg-primary"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Send Message
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
