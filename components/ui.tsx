import { Fragment, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Star, AlertCircle } from "lucide-react";

/* ---------- Reusable Class Tokens ---------- */
export const inputCls =
  "w-full h-11 rounded-xl border border-line bg-card px-3.5 text-sm text-ink placeholder:text-mute transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-60";

export const selectCls =
  "w-full h-11 rounded-xl border border-line bg-card px-3.5 text-sm text-ink transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-60";

/* Base button styles matching Midnight Indigo & Burnished Copper system */
export const btn =
  "inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-accent px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-accent-hover hover:shadow active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-50";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-line bg-card px-5 text-sm font-semibold text-ink transition-colors hover:border-line-hover hover:bg-elevated active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50";

export const btnDanger =
  "inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-bad/30 bg-bad-soft px-5 text-sm font-semibold text-bad transition-colors hover:bg-bad/15 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50";

/* ---------- Button Component Primitive ---------- */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: "bg-accent text-white hover:bg-accent-hover shadow-sm",
    secondary: "bg-brand text-white hover:opacity-95 shadow-sm",
    outline: "border border-line bg-card text-ink hover:bg-elevated hover:border-line-hover",
    ghost: "bg-transparent text-ink hover:bg-elevated",
    danger: "border border-bad/30 bg-bad-soft text-bad hover:bg-bad/15",
  };

  const sizeClasses = {
    sm: "h-9 px-3.5 text-xs rounded-lg gap-1.5",
    md: "h-11 px-5 text-sm rounded-xl gap-2",
    lg: "h-12 px-6 text-base rounded-xl gap-2.5",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold transition-all active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-r-transparent animate-spin"
        />
      )}
      {children}
    </button>
  );
}

/* ---------- Structural Primitives ---------- */
export function Section({
  title,
  hint,
  count,
  action,
  children,
}: {
  title: string;
  hint?: string;
  count?: number;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-ink font-display">{title}</h2>
            {count !== undefined && (
              <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand font-mono tabular-nums">
                {count}
              </span>
            )}
          </div>
          {hint && <p className="mt-0.5 text-sm text-mute">{hint}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </section>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  const pad = /(^|\s)p-\d/.test(className) ? "" : "p-5";
  return (
    <div className={`rounded-2xl border border-line bg-card text-ink shadow-sm transition-shadow ${pad} ${className}`}>
      {children}
    </div>
  );
}

export function Empty({
  title = "No records found",
  children,
}: {
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-elevated/40 p-8 text-center">
      <AlertCircle className="h-8 w-8 text-mute/60" strokeWidth={1.5} />
      <p className="mt-2 text-sm font-semibold text-ink">{title}</p>
      {children && <p className="mt-1 text-xs text-mute max-w-sm">{children}</p>}
    </div>
  );
}

/* ---------- Status Pills & Badges ---------- */
const badgeTones = {
  gray: "bg-elevated border-line text-mute",
  good: "bg-good-soft border-good/20 text-good",
  green: "bg-good-soft border-good/20 text-good",
  bad: "bg-bad-soft border-bad/20 text-bad",
  red: "bg-bad-soft border-bad/20 text-bad",
  gold: "bg-gold-soft border-gold/20 text-gold",
  brand: "bg-brand-soft border-brand/20 text-brand",
  teal: "bg-brand-soft border-brand/20 text-brand",
  copper: "bg-accent-soft border-accent/20 text-accent",
};

export function Badge({
  tone = "gray",
  dot = false,
  children,
}: {
  tone?: keyof typeof badgeTones;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide ${badgeTones[tone]}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

/* ---------- Monochrome Star Ratings (lucide-react) ---------- */
export function Stars({
  rating,
  count,
  size = "sm",
}: {
  rating: number;
  count: number;
  size?: "sm" | "md" | "lg";
}) {
  if (count === 0) return <Badge tone="gray">New pro</Badge>;
  const iconSize = size === "lg" ? "w-4 h-4" : size === "md" ? "w-3.5 h-3.5" : "w-3 h-3";

  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-xs text-ink font-mono tabular-nums">
      <span className="inline-flex items-center gap-0.5 text-gold">
        <Star className={`${iconSize} fill-current`} strokeWidth={1.5} />
      </span>
      <span className="font-semibold">{rating.toFixed(1)}</span>
      <span className="text-mute font-normal">({count})</span>
    </span>
  );
}

export function StarRow({ value }: { value: number }) {
  return (
    <div className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= value ? "fill-gold text-gold" : "text-line fill-transparent"}`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

export function StarPicker({ idPrefix, label = "Your rating" }: { idPrefix: string; label?: string }) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-xs font-semibold uppercase tracking-wider text-mute">{label}</legend>
      <div className="star-picker">
        {[5, 4, 3, 2, 1].map((n) => (
          <Fragment key={n}>
            <input id={`${idPrefix}-${n}`} type="radio" name="rating" value={n} required defaultChecked={n === 5} />
            <label htmlFor={`${idPrefix}-${n}`} title={`${n} star${n > 1 ? "s" : ""}`}>
              ★
            </label>
          </Fragment>
        ))}
      </div>
    </fieldset>
  );
}

/* ---------- Review Card ---------- */
export function ReviewCard({
  rating,
  author,
  context,
  comment,
  date,
}: {
  rating: number;
  author: string;
  context?: string;
  comment?: string;
  date?: Date;
}) {
  return (
    <Card className="space-y-2 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
        <div className="flex items-center gap-2">
          <StarRow value={rating} />
          <strong className="text-ink font-medium">{author}</strong>
          {context && <span className="text-xs text-mute">for &ldquo;{context}&rdquo;</span>}
        </div>
        {date && (
          <span className="text-xs text-mute font-mono tabular-nums">
            {date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        )}
      </div>
      {comment && <p className="text-sm leading-relaxed text-ink/90">{comment}</p>}
    </Card>
  );
}

/* ---------- Form Field Wrapper ---------- */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-mute">{label}</span>
        {hint && <span className="text-xs text-mute">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
