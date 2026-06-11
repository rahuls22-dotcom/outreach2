"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Loader2, Mail, RotateCw } from "lucide-react";
import { OtpInput } from "@/components/auth/otp-input";
import { DEMO_OTP, maskEmail, orgsForEmail, type Org } from "@/lib/auth-mock";
import { markAuthed } from "@/lib/auth";

// Passwordless sign-in. Email and code share one card — the code block is
// revealed inline once we "send" it. A known multi-org email shows the org
// chooser; everything else resolves to a single org and goes straight in.
//
// Auth is a demo gate (see lib/auth) — any valid email + the demo code lands
// the user in. On success we mark the browser authed and bounce to ?next
// (default /spot), which is what the app's AuthGate checks.

const RESEND_SECONDS = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "auth" | "org";

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("auth");
  const [codeSent, setCodeSent] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!codeSent || resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [codeSent, resendIn]);

  const emailValid = EMAIL_RE.test(email.trim());

  /** Mark authed + redirect to the page the gate sent us from (or /spot). */
  const finish = () => {
    markAuthed();
    const next =
      new URLSearchParams(window.location.search).get("next") || "/spot";
    router.replace(next);
  };

  const sendCode = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!emailValid || loading || codeSent) return;
    setLoading(true);
    setError("");
    setTimeout(() => {
      setOrgs(orgsForEmail(email));
      setOtp("");
      setResendIn(RESEND_SECONDS);
      setResent(false);
      setCodeSent(true);
      setLoading(false);
    }, 600);
  };

  const verify = (code?: string) => {
    const value = code ?? otp;
    if (value.length < 6 || loading) return;
    setLoading(true);
    setError("");
    setTimeout(() => {
      if (value !== DEMO_OTP) {
        setError("That code isn't right. Check it and try again.");
        setOtp("");
        setLoading(false);
        return;
      }
      if (orgs.length > 1) {
        setStep("org");
        setLoading(false);
      } else {
        finish();
      }
    }, 600);
  };

  const resend = () => {
    if (resendIn > 0) return;
    setResendIn(RESEND_SECONDS);
    setResent(true);
    setOtp("");
    setError("");
  };

  const changeEmail = () => {
    setCodeSent(false);
    setOtp("");
    setError("");
    setResent(false);
  };

  return (
    <div
      className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr] xl:grid-cols-2"
      style={{ background: "#0A0A09" }}
    >
      <BrandPanel />

      {/* Right — sign-in surface (dark). */}
      <div className="relative flex min-h-screen flex-col px-6 py-7 sm:px-10" style={{ background: "#0A0A09" }}>
        <header className="flex items-center gap-2.5 lg:hidden">
          <BrandLogo size="sm" />
        </header>

        <main className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[400px]">
            <AnimatePresence mode="wait">
              {step === "auth" ? (
                <StepShell key="auth">
                  <AuthStep
                    email={email}
                    setEmail={setEmail}
                    emailValid={emailValid}
                    codeSent={codeSent}
                    otp={otp}
                    setOtp={setOtp}
                    loading={loading}
                    error={error}
                    resendIn={resendIn}
                    resent={resent}
                    onSendCode={sendCode}
                    onVerify={verify}
                    onResend={resend}
                    onChangeEmail={changeEmail}
                  />
                </StepShell>
              ) : (
                <StepShell key="org">
                  <OrgStep email={email} orgs={orgs} onChoose={finish} />
                </StepShell>
              )}
            </AnimatePresence>

            <div
              className="mt-9 text-center text-[10.5px] uppercase tracking-[0.28em] font-medium"
              style={{ color: "#5A5954" }}
            >
              Revspot · Agentic OS
            </div>
          </div>
        </main>

        <footer
          className="flex items-center justify-end gap-3 text-[11px]"
          style={{ color: "#6A6964" }}
        >
          <a href="#" className="hover:text-white/80 transition-colors">Privacy</a>
          <span style={{ color: "#2A2A28" }}>·</span>
          <a href="#" className="hover:text-white/80 transition-colors">Support</a>
        </footer>
      </div>
    </div>
  );
}

// ── Brand panel (dark · diagonal gold blinds) ───────────────────
function BrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden p-12 xl:p-16 lg:flex" style={{ background: "#0A0A09" }}>
      <BlindsBackground />

      {/* Legibility veil — keep type crisp over the blinds. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,9,0.55) 0%, transparent 24%, transparent 52%, rgba(10,10,9,0.82) 100%)",
        }}
      />

      <div className="pointer-events-none relative z-10">
        <BrandLogo />
      </div>

      <div className="pointer-events-none relative z-10 max-w-[34rem]">
        <h2 className="text-[46px] font-semibold leading-[1.02] tracking-[-0.035em] xl:text-[58px]">
          <span className="block text-white">Most leads look interested.</span>
          <span className="block" style={{ color: "#C9A86A" }}>Very few are ready.</span>
        </h2>
        <p className="mt-7 max-w-[30rem] text-[15px] leading-relaxed xl:text-[16px]" style={{ color: "rgba(255,255,255,0.5)" }}>
          Verified data, behavioral signals, and profile intelligence, combined
          to surface the buyers who are actually ready to move.
        </p>
      </div>
    </aside>
  );
}

/** Diagonal "venetian blind" sheen in warm gold over near-black — a
 *  dependency-free CSS take on the brand panel's animated field. */
function BlindsBackground() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 z-0"
      style={{
        background: [
          // Soft gold spotlight, centre-left.
          "radial-gradient(58% 48% at 40% 44%, rgba(201,168,106,0.20) 0%, rgba(201,168,106,0.05) 46%, transparent 72%)",
          // The slats — diagonal gold sheen bands.
          "repeating-linear-gradient(218deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 30px, rgba(201,168,106,0.045) 36px, rgba(201,168,106,0.16) 44px, rgba(201,168,106,0.045) 52px, rgba(0,0,0,0) 58px, rgba(0,0,0,0) 78px)",
          // Edge vignette so the slats fade at the frame.
          "radial-gradient(120% 120% at 50% 50%, transparent 55%, rgba(10,10,9,0.7) 100%)",
          "#0A0A09",
        ].join(", "),
      }}
    />
  );
}

function BrandLogo({ size = "md" }: { size?: "sm" | "md" }) {
  const tile = size === "sm" ? "h-7 w-7 text-[12px]" : "h-9 w-9 text-[15px]";
  const text = size === "sm" ? "text-[14px]" : "text-[18px]";
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${tile} rounded-[9px] flex items-center justify-center font-semibold text-white`}
        style={{
          background: "linear-gradient(150deg, #1d1d1b 0%, #0e0e0d 100%)",
          border: "1px solid #2C2C28",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        R
      </div>
      <span className={`${text} font-semibold tracking-tight text-white`}>Revspot.ai</span>
    </div>
  );
}

// ── Combined email + code step ──────────────────────────────────
function AuthStep({
  email,
  setEmail,
  emailValid,
  codeSent,
  otp,
  setOtp,
  loading,
  error,
  resendIn,
  resent,
  onSendCode,
  onVerify,
  onResend,
  onChangeEmail,
}: {
  email: string;
  setEmail: (v: string) => void;
  emailValid: boolean;
  codeSent: boolean;
  otp: string;
  setOtp: (v: string) => void;
  loading: boolean;
  error: string;
  resendIn: number;
  resent: boolean;
  onSendCode: (e?: React.FormEvent) => void;
  onVerify: (code?: string) => void;
  onResend: () => void;
  onChangeEmail: () => void;
}) {
  return (
    <>
      <Heading
        title="Sign in to Revspot"
        subtitle={
          codeSent ? (
            <>
              Enter the 6-digit code we sent to{" "}
              <span className="font-medium text-white">{maskEmail(email)}</span>.
            </>
          ) : (
            "Enter your work email and we'll send a sign-in code."
          )
        }
      />
      <Card>
        <form
          onSubmit={codeSent ? (e) => { e.preventDefault(); onVerify(); } : onSendCode}
          className="space-y-3.5"
        >
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: "#E8E6DF" }}>
              Work email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoFocus={!codeSent}
              disabled={codeSent || loading}
              className="w-full h-11 px-3.5 text-[13.5px] rounded-input focus:outline-none transition-all disabled:opacity-60"
              style={{
                background: "#161614",
                border: "1px solid #2A2A26",
                color: "#F5F4EF",
              }}
            />
          </div>

          {/* Code block — revealed inline once sent. */}
          <AnimatePresence initial={false}>
            {codeSent && (
              <motion.div
                key="code"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="pt-1">
                  <label className="block text-[12px] font-medium mb-1.5" style={{ color: "#E8E6DF" }}>
                    Sign-in code
                  </label>
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    onComplete={(code) => onVerify(code)}
                    disabled={loading}
                    error={!!error}
                  />
                  {error ? (
                    <p className="text-[12px] mt-2.5" style={{ color: "#F87171" }}>{error}</p>
                  ) : resent ? (
                    <p className="inline-flex items-center gap-1.5 text-[12px] mt-2.5" style={{ color: "#34D399" }}>
                      <Check size={13} strokeWidth={2} />
                      New code sent.
                    </p>
                  ) : (
                    <p className="text-[12px] mt-2.5" style={{ color: "#8A8980" }}>
                      Demo code: <span className="font-mono" style={{ color: "#C9C8C1" }}>{DEMO_OTP}</span>
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Primary action — Continue (email) → Verify (code). */}
          <button
            type="submit"
            disabled={loading || (codeSent ? otp.length < 6 : !emailValid)}
            className="w-full h-11 inline-flex items-center justify-center gap-2 text-[13.5px] font-medium rounded-button transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#3A3A36", color: "#F5F4EF" }}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = "#46463F"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#3A3A36"; }}
          >
            {loading ? (
              <>
                <Loader2 size={15} strokeWidth={2} className="animate-spin" />
                {codeSent ? "Verifying…" : "Continuing…"}
              </>
            ) : (
              <>
                {codeSent ? "Verify" : "Continue"}
                <ArrowRight size={14} strokeWidth={2} />
              </>
            )}
          </button>
        </form>

        {codeSent ? (
          <div className="flex items-center justify-center gap-2 mt-4 text-[12px]" style={{ color: "#8A8980" }}>
            {resendIn > 0 ? (
              <span>
                Resend code in <span className="tabular-nums">0:{String(resendIn).padStart(2, "0")}</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={onResend}
                className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-white"
                style={{ color: "#C9C8C1" }}
              >
                <RotateCw size={12} strokeWidth={2} />
                Resend code
              </button>
            )}
            <span style={{ color: "#2A2A28" }}>·</span>
            <button
              type="button"
              onClick={onChangeEmail}
              className="font-medium transition-colors hover:text-white"
              style={{ color: "#C9C8C1" }}
            >
              Change email
            </button>
          </div>
        ) : (
          <DemoHint>
            Try <code className="font-mono" style={{ color: "#C9C8C1" }}>chirag@revspot.in</code> for the multi-org chooser, or
            any other email to go straight in.
          </DemoHint>
        )}
      </Card>
    </>
  );
}

// ── Org chooser ─────────────────────────────────────────────────
function OrgStep({ email, orgs, onChoose }: { email: string; orgs: Org[]; onChoose: (org: Org) => void }) {
  return (
    <>
      <Heading
        title="Choose an organization"
        subtitle={
          <>
            <span className="font-medium text-white">{email}</span> is part of multiple organizations.
          </>
        }
      />
      <Card>
        <div className="space-y-2 max-h-[420px] overflow-y-auto -mr-2 pr-2">
          {orgs.map((org) => (
            <button
              key={org.id}
              type="button"
              onClick={() => onChoose(org)}
              className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-card transition-colors text-left"
              style={{ background: "#161614", border: "1px solid #2A2A26" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3A3A35"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2A2A26"; }}
            >
              <span
                className="flex items-center justify-center w-7 h-7 rounded-[6px] text-white text-[12px] font-semibold shrink-0"
                style={{ backgroundColor: org.color }}
              >
                {org.name.charAt(0).toUpperCase()}
              </span>
              <span className="flex-1 min-w-0 truncate text-[13.5px] font-medium" style={{ color: "#F5F4EF" }}>
                {org.name}
              </span>
              <ArrowRight
                size={15}
                strokeWidth={2}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                style={{ color: "#8A8980" }}
              />
            </button>
          ))}
        </div>
      </Card>
    </>
  );
}

// ── Shared chrome ───────────────────────────────────────────────
function StepShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function Heading({ title, subtitle }: { title: string; subtitle: React.ReactNode }) {
  return (
    <div className="mb-7">
      <h1 className="text-[26px] font-semibold text-white leading-tight tracking-[-0.01em]">{title}</h1>
      <p className="text-[14px] mt-1.5 leading-relaxed" style={{ color: "#9A9992" }}>{subtitle}</p>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-card px-7 py-7"
      style={{ background: "#121211", border: "1px solid #232320" }}
    >
      {children}
    </div>
  );
}

function DemoHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 flex items-start gap-2 text-[11.5px] leading-relaxed" style={{ color: "#7A7970" }}>
      <Mail size={13} strokeWidth={1.5} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
