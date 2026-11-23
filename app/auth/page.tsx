"use client";

import { Suspense, useRef, useState, type ComponentType, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { loginUser, registerUser } from "@/actions/auth";
import { LABOUR_TYPES, labourLabel } from "@/lib/constants";
import {
  Layers,
  Wrench,
  Store,
  Bike,
  User,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";

const field =
  "w-full h-11 rounded-xl border border-line bg-card px-3.5 text-sm text-ink placeholder:text-mute transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

const primaryBtn =
  "w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-accent-hover active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-accent";

const ghostBtn =
  "h-11 inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-card px-5 text-sm font-semibold text-ink transition-colors hover:border-line-hover hover:bg-elevated active:scale-[0.99]";

function AuthError() {
  const error = useSearchParams().get("error");
  if (!error) return null;
  return (
    <p
      role="alert"
      className="mb-4 flex items-center gap-2 rounded-xl border border-bad/30 bg-bad-soft p-3 text-xs font-semibold text-bad"
    >
      <AlertTriangle className="h-4 w-4 shrink-0 text-bad" strokeWidth={2} />
      <span>{error}</span>
    </p>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-mute">
        {label}
      </span>
      {children}
    </label>
  );
}

function PasswordInput({
  name,
  placeholder,
  minLength,
  isNew,
}: {
  name: string;
  placeholder: string;
  minLength?: number;
  isNew?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        name={name}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        minLength={minLength}
        required
        autoComplete={isNew ? "new-password" : "current-password"}
        className={`${field} pr-12`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-mute hover:text-ink transition-colors"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function RoleCard({
  name,
  icon: Icon,
  title,
  desc,
  defaultChecked,
  checked,
  onChange,
}: {
  name: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  desc: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="checkbox"
        name={name}
        className="peer sr-only"
        defaultChecked={defaultChecked}
        checked={checked}
        onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
      />
      <div className="h-full rounded-xl border border-line bg-card p-3 transition-all hover:border-line-hover peer-checked:border-accent peer-checked:bg-accent-soft/30 peer-checked:ring-1 peer-checked:ring-accent">
        <div className="flex items-center gap-2 mb-1">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-soft text-brand">
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <span className="text-xs font-bold text-ink">{title}</span>
        </div>
        <p className="text-[11px] leading-tight text-mute">{desc}</p>
      </div>
    </label>
  );
}

const perks = [
  {
    icon: Wrench,
    title: "Skilled Trade Specialists",
    text: "Verified plumbers, electricians, painters, and carpenters on demand.",
  },
  {
    icon: Store,
    title: "Direct Store Sourcing",
    text: "Catalog inventory, verified pricing, and instant courier dispatch.",
  },
  {
    icon: Bike,
    title: "Flexible Trade Logistics",
    text: "Participate as a client, trade pro, retail merchant, or dispatch rider.",
  },
];

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [step, setStep] = useState<1 | 2>(1);
  const [isLabour, setIsLabour] = useState(false);
  const step1Ref = useRef<HTMLDivElement>(null);

  const goNext = () => {
    const inputs = step1Ref.current?.querySelectorAll<HTMLInputElement>("input");
    if (inputs) {
      for (const el of Array.from(inputs)) {
        if (!el.reportValidity()) return;
      }
    }
    setStep(2);
  };

  const switchMode = (m: "login" | "register") => {
    setMode(m);
    setStep(1);
  };

  const tab = (m: "login" | "register") =>
    `flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${
      mode === m ? "bg-card text-ink shadow-xs" : "text-mute hover:text-ink"
    }`;

  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      {/* Brand Side Panel */}
      <aside className="relative hidden overflow-hidden bg-brand p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="relative flex items-center gap-2.5 text-lg font-bold tracking-tight font-display">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white">
            <Layers className="h-5 w-5" strokeWidth={2} />
          </span>
          <span>
            Build<span className="text-accent">Link</span>
          </span>
        </div>

        <div className="relative max-w-md space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight font-display">
            The infrastructure network for trade execution.
          </h1>
          <p className="text-sm leading-relaxed text-white/80">
            A unified identity for project contractors, trade specialists, local supply stores, and logistics couriers.
          </p>

          <ul className="mt-8 space-y-4">
            {perks.map((p) => {
              const Icon = p.icon;
              return (
                <li key={p.title} className="flex items-center gap-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-white">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-white font-display">{p.title}</p>
                    <p className="text-xs text-white/70">{p.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative text-xs text-white/60 font-mono">
          © {new Date().getFullYear()} BuildLink Network. Enterprise Grade.
        </p>
      </aside>

      {/* Form Interaction Panel */}
      <section className="flex items-center justify-center bg-paper px-4 py-8 sm:px-8">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Brand Emblem */}
          <div className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-ink font-display lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white">
              <Layers className="h-5 w-5" />
            </span>
            <span>
              Build<span className="text-accent">Link</span>
            </span>
          </div>

          {/* Mode Switch Tabs */}
          <div role="tablist" className="flex gap-1 rounded-2xl border border-line bg-elevated/60 p-1.5 shadow-xs">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "register"}
              onClick={() => switchMode("register")}
              className={tab("register")}
            >
              Register Account
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              onClick={() => switchMode("login")}
              className={tab("login")}
            >
              Sign In
            </button>
          </div>

          <Suspense>
            <AuthError />
          </Suspense>

          {mode === "register" ? (
            <form action={registerUser} className="rounded-2xl border border-line bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h2 className="text-base font-bold text-ink font-display">
                  {step === 1 ? "1. Member Credentials" : "2. Assign Roles in BuildLink"}
                </h2>
                <span className="text-xs font-mono font-semibold text-mute">Step {step} of 2</span>
              </div>

              {/* Step 1 */}
              <div ref={step1Ref} className={step === 1 ? "space-y-3.5" : "hidden"}>
                <Field label="Full Name">
                  <input name="name" placeholder="Muhammad Ali" required autoComplete="name" className={field} />
                </Field>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Email Address">
                    <input
                      name="email"
                      type="email"
                      placeholder="you@domain.com"
                      required
                      autoComplete="email"
                      className={field}
                    />
                  </Field>
                  <Field label="Contact Phone">
                    <input name="phone" type="tel" placeholder="0300 1234567" autoComplete="tel" className={field} />
                  </Field>
                </div>

                <Field label="Password">
                  <PasswordInput name="password" placeholder="Minimum 8 characters" minLength={8} isNew />
                </Field>

                <Field label="Primary Address / Area">
                  <input
                    name="address"
                    placeholder="House/Street, Area, City"
                    required
                    autoComplete="street-address"
                    className={field}
                  />
                </Field>

                <div className="pt-2">
                  <button type="button" onClick={goNext} className={primaryBtn}>
                    <span>Continue to Role Setup</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div className={step === 2 ? "space-y-4" : "hidden"}>
                <fieldset className="space-y-2">
                  <legend className="text-[11px] font-semibold uppercase tracking-wider text-mute">
                    Select Your Operating Capacities (Select all that apply)
                  </legend>
                  <div className="grid grid-cols-2 gap-2.5">
                    <RoleCard
                      name="isUser"
                      icon={User}
                      title="Customer / Client"
                      desc="Direct hire & project contractor"
                      defaultChecked
                    />
                    <RoleCard
                      name="isLabour"
                      icon={Wrench}
                      title="Trade Specialist"
                      desc="Direct contracts & project bidding"
                      checked={isLabour}
                      onChange={setIsLabour}
                    />
                    <RoleCard
                      name="isShopOwner"
                      icon={Store}
                      title="Store Merchant"
                      desc="Publish materials & inventory"
                    />
                    <RoleCard
                      name="isRider"
                      icon={Bike}
                      title="Courier Partner"
                      desc="Fulfill supply dispatches"
                    />
                  </div>
                </fieldset>

                {isLabour && (
                  <div className="space-y-3 rounded-xl border border-line bg-elevated/40 p-4">
                    <Field label="Primary Trade Qualification (required)">
                      <select id="labourType" name="labourType" required defaultValue="" className={field}>
                        <option value="" disabled>
                          Select qualified trade
                        </option>
                        {LABOUR_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {labourLabel(t)}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Trade Bio / Experience Summary">
                      <input
                        name="bio"
                        placeholder="e.g. 7 years commercial & residential electrical work"
                        className={field}
                      />
                    </Field>
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button type="button" onClick={() => setStep(1)} className={ghostBtn}>
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>
                  <button type="submit" className={primaryBtn}>
                    Complete Registration
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form action={loginUser} className="rounded-2xl border border-line bg-card p-6 shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-bold text-ink font-display">Sign In to Your Account</h2>
                <p className="text-xs text-mute mt-0.5">Enter your verified credentials to access your portal.</p>
              </div>

              <Field label="Email Address">
                <input
                  name="email"
                  type="email"
                  placeholder="you@domain.com"
                  required
                  autoComplete="email"
                  className={field}
                />
              </Field>

              <Field label="Password">
                <PasswordInput name="password" placeholder="Enter password" />
              </Field>

              <div className="pt-2">
                <button type="submit" className={primaryBtn}>
                  Authenticate &amp; Enter
                </button>
              </div>

              <p className="text-center text-xs text-mute pt-2 border-t border-line">
                Need an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="font-semibold text-accent hover:underline cursor-pointer"
                >
                  Create free account
                </button>
              </p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
