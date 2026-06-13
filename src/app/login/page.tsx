"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Check,
  Loader2,
  Mail,
  RotateCw,
  Search,
  Sparkles,
  Rocket,
  LineChart,
} from "lucide-react";
import { OtpInput } from "@/components/auth/otp-input";
import { SpotLoader } from "@/components/spot/spot-loader";
import GradientBlinds from "./gradient-blinds";
import { maskEmail, orgsForEmail, type Org } from "@/lib/auth-mock";

// Passwordless sign-in on a premium dark surface — a living gold aurora behind
// diagonal "blinds", the Revspot wordmark, and a tease of what Spot actually
// does (research → creative → launch → optimize). The card reveals the code
// inline once "sent". A known multi-org email shows the org chooser; everything
// else goes straight in.
//
// Auth is a demo gate: any valid email + the sign-in code lands you in. The
// code is verified server-side (POST /api/login), which sets a signed httpOnly
// session cookie; middleware.ts is the real boundary. On success we bounce to
// ?next (default /spot).

const RESEND_SECONDS = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GOLD = "#C9A86A";

// Stable module-level reference — passing an inline array would change the
// prop identity every render, tearing down + rebuilding the WebGL effect on
// each keystroke. Toned-down antique-gold stops so the overlaid copy reads.
const LOGIN_BLINDS_COLORS = ["#17110A", "#5C4A29", "#A2854C"];

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

  const finish = () => {
    // Always land on Spot after a fresh login — Spot is the canonical
    // post-login surface and the place new sessions should start. The
    // older behaviour honoured a ?next= param so the user resumed where
    // their session had timed out, but that meant a user whose session
    // expired on /settings/* bounced back into Settings (which now hides
    // Billing for v1 anyway) instead of seeing Spot first. Drop the
    // resume-where-you-were dance until we re-evaluate it.
    router.replace("/spot");
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

  const verify = async (code?: string) => {
    const value = code ?? otp;
    if (value.length < 6 || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      if (!res.ok) {
        setError("That code isn't right. Check it and try again.");
        setOtp("");
        setLoading(false);
        return;
      }
      // Code accepted → session cookie is now set. The org chooser is pure UX.
      if (orgs.length > 1) {
        setStep("org");
        setLoading(false);
      } else {
        finish();
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setOtp("");
      setLoading(false);
    }
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
      className="min-h-screen lg:grid lg:grid-cols-[1.12fr_1fr]"
      style={{ background: "#09090B" }}
    >
      <BrandPanel />

      {/* Right — sign-in surface (dark). */}
      <div
        className="relative flex min-h-screen flex-col px-6 py-7 sm:px-10"
        style={{ background: "#0A0A0C" }}
      >
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
              className="mt-9 text-center text-[10px] uppercase tracking-[0.3em] font-medium"
              style={{ color: "#56554F" }}
            >
              Revspot · Agentic OS
            </div>
          </div>
        </main>

        <footer
          className="flex items-center justify-center gap-3 text-[11px]"
          style={{ color: "#66655F" }}
        >
          <a href="#" className="hover:text-white/80 transition-colors">Privacy</a>
          <span style={{ color: "#2A2A28" }}>·</span>
          <a href="#" className="hover:text-white/80 transition-colors">Support</a>
        </footer>
      </div>
    </div>
  );
}

/* ── Brand panel · the hook ──────────────────────────────────────── */

const CAPABILITIES: { icon: typeof Search; text: string }[] = [
  { icon: Search, text: "Researches every lead — fit, intent, and readiness" },
  { icon: Sparkles, text: "Drafts the creatives, forms, and campaign architecture" },
  { icon: Rocket, text: "Launches on Meta, then optimizes around the clock" },
  { icon: LineChart, text: "Surfaces the buyers who are actually ready to move" },
];

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};
const riseIn: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

function BrandPanel() {
  return (
    <aside
      className="relative hidden flex-col justify-between overflow-hidden p-12 xl:p-16 lg:flex"
      style={{ background: "#09090B" }}
    >
      {/* reactbits GradientBlinds — a WebGL gold "corduroy of light" with a
          cursor-following spotlight. Screen-blended over near-black. */}
      <div aria-hidden className="absolute inset-0 z-0">
        <GradientBlinds
          gradientColors={LOGIN_BLINDS_COLORS}
          angle={226}
          noise={0.22}
          blindCount={14}
          blindMinWidth={0}
          mouseDampening={0.15}
          spotlightRadius={1}
          spotlightSoftness={1.15}
          spotlightOpacity={0.4}
          distortAmount={0}
          mixBlendMode="screen"
        />
      </div>

      {/* Legibility veil — keep type crisp over the field. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(9,9,11,0.6) 0%, transparent 26%, transparent 46%, rgba(9,9,11,0.86) 100%)",
        }}
      />

      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <BrandLogo />
      </motion.div>

      <motion.div
        className="relative z-10 max-w-[34rem]"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* Spot lockup — the breathing orb introduces Spot as the character
            running it all, paired with its role. */}
        <motion.div variants={riseIn} className="flex items-center gap-3 mb-6">
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(201,168,106,0.4) 0%, transparent 68%)",
                filter: "blur(9px)",
                transform: "scale(1.7)",
              }}
            />
            <SpotLoader mode="breathe" size={42} className="!gap-0 relative" />
          </div>
          <div>
            <div className="text-[15px] font-semibold text-white leading-tight">Spot</div>
            <div className="text-[10px] uppercase tracking-[0.18em] font-semibold mt-0.5" style={{ color: "#E0C89A" }}>
              Your AI Head of Growth
            </div>
          </div>
        </motion.div>

        <motion.h2
          variants={riseIn}
          className="text-[44px] font-semibold leading-[1.0] tracking-[-0.035em] xl:text-[56px]"
        >
          <span className="block text-white">Most leads look interested.</span>
          <span className="block" style={{ color: GOLD }}>Very few are ready.</span>
        </motion.h2>

        <motion.p
          variants={riseIn}
          className="mt-6 max-w-[30rem] text-[15px] leading-relaxed xl:text-[15.5px]"
          style={{ color: "rgba(255,255,255,0.52)" }}
        >
          Spot runs your entire growth function — and surfaces the buyers worth
          your team's time.
        </motion.p>

        <motion.ul variants={riseIn} className="mt-8 space-y-3">
          {CAPABILITIES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <span
                className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-[9px]"
                style={{ background: "rgba(201,168,106,0.12)", border: "1px solid rgba(201,168,106,0.22)" }}
              >
                <Icon size={13} strokeWidth={1.9} style={{ color: "#E0C89A" }} />
              </span>
              <span className="text-[13.5px]" style={{ color: "rgba(255,255,255,0.72)" }}>
                {text}
              </span>
            </li>
          ))}
        </motion.ul>
      </motion.div>
    </aside>
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
          boxShadow: "inset 0 1px 0 rgba(201,168,106,0.12)",
        }}
      >
        R
      </div>
      <span className={`${text} font-semibold tracking-tight text-white`}>Revspot.ai</span>
    </div>
  );
}

/* ── Combined email + code step ──────────────────────────────────── */
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
            "Enter your work email and Spot will send you a sign-in code."
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
              style={{ background: "#161618", border: "1px solid #2A2A2E", color: "#F5F4EF" }}
            />
          </div>

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
                  ) : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Primary action — warm gold gradient so the CTA carries the brand. */}
          <button
            type="submit"
            disabled={loading || (codeSent ? otp.length < 6 : !emailValid)}
            className="w-full h-11 inline-flex items-center justify-center gap-2 text-[13.5px] font-semibold rounded-button transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(180deg, #E7CF9E 0%, #C9A86A 100%)",
              color: "#1A160C",
              boxShadow: "0 6px 18px -8px rgba(201,168,106,0.6)",
            }}
          >
            {loading ? (
              <>
                <Loader2 size={15} strokeWidth={2.4} className="animate-spin" />
                {codeSent ? "Verifying…" : "Continuing…"}
              </>
            ) : (
              <>
                {codeSent ? "Verify" : "Continue"}
                <ArrowRight size={14} strokeWidth={2.4} />
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

/* ── Org chooser ─────────────────────────────────────────────────── */
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
              style={{ background: "#161618", border: "1px solid #2A2A2E" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3A3A35"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2A2A2E"; }}
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

/* ── Shared chrome ───────────────────────────────────────────────── */
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
      style={{
        background: "#121214",
        border: "1px solid #232326",
        boxShadow: "0 24px 60px -28px rgba(0,0,0,0.7)",
      }}
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
