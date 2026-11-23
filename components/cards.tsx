import Link from "next/link";
import { TradeIcon } from "@/components/TradeIcon";
import { fmtTime, isOpenNow, labourLabel } from "@/lib/constants";
import {
  MapPin,
  Store,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Bike,
  Clock,
  Sparkles,
} from "lucide-react";

/** Profile avatar with refined monogram or photo */
export function Avatar({
  name,
  src,
  size = "h-14 w-14",
  text = "text-base",
  trade,
}: {
  name: string;
  src?: string;
  size?: string;
  text?: string;
  trade?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <div className="relative shrink-0">
        <img
          src={src}
          alt={name}
          loading="lazy"
          className={`${size} rounded-2xl object-cover border border-line shadow-xs group-hover:border-accent/50 transition-colors`}
        />
        <span
          className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-card ring-2 ring-card"
          title="Verified Specialist"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
      </div>
    );
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="relative shrink-0">
      <div
        className={`grid ${size} ${text} place-items-center rounded-2xl bg-brand text-white font-bold font-display shadow-xs border border-white/10 group-hover:border-accent/40 transition-colors`}
      >
        <span>{initial}</span>
      </div>
      <span
        className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-card ring-2 ring-card"
        title="Active on Network"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
      </span>
    </div>
  );
}

/** Storefront cover with authentic architectural styling */
export function Cover({
  src,
  className = "h-40",
  shopName,
}: {
  src?: string;
  className?: string;
  shopName?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <div className="relative overflow-hidden w-full">
        <img
          src={src}
          alt={shopName || "Supply Store"}
          loading="lazy"
          className={`${className} w-full object-cover transition-transform duration-500 group-hover:scale-105`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70" />
      </div>
    );
  }

  return (
    <div
      className={`${className} relative grid w-full place-items-center overflow-hidden bg-brand text-white`}
      aria-hidden
    >
      {/* Architectural blueprint grid overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />
      {/* Subtle warm accent glow */}
      <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-accent/20 blur-2xl" />

      <div className="relative flex flex-col items-center gap-2">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-inner">
          <Store className="h-6 w-6 text-white" strokeWidth={1.75} />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/70 font-mono">
          Supply Store &amp; Hardware
        </span>
      </div>
    </div>
  );
}

export function ProCard({
  p,
}: {
  p: {
    id: string;
    name: string;
    labourProfile: {
      labourType: string;
      rating: number;
      ratingCount: number;
      bio: string;
      imageUrl: string;
      area: string;
    } | null;
  };
}) {
  const lp = p.labourProfile;
  const hasReviews = lp && lp.ratingCount > 0;

  return (
    <Link
      href={`/labour/${p.id}`}
      className="group relative flex flex-col justify-between rounded-2xl border border-line bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-lg"
    >
      <div>
        {/* Top Header: Avatar + Trade Badge */}
        <div className="flex items-start justify-between gap-3">
          <Avatar name={p.name} src={lp?.imageUrl} trade={lp?.labourType} />

          {lp?.labourType && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-elevated/80 px-2.5 py-1 text-xs font-semibold text-ink/80 transition-colors group-hover:border-accent/30 group-hover:text-accent">
              <TradeIcon trade={lp.labourType} className="h-3.5 w-3.5 text-accent" />
              <span>{labourLabel(lp.labourType)}</span>
            </span>
          )}
        </div>

        {/* Identity & Location */}
        <div className="mt-4">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-bold text-base text-ink font-display group-hover:text-accent transition-colors">
              {p.name}
            </h3>
            <span title="Verified Specialist">
              <ShieldCheck
                className="h-4 w-4 shrink-0 text-accent"
                strokeWidth={2}
              />
            </span>
          </div>

          <p className="mt-1 flex items-center gap-1 text-xs text-mute truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-mute/80" strokeWidth={1.75} />
            <span className="truncate">{lp?.area || "Available Citywide"}</span>
          </p>
        </div>

        {/* Trust & Performance Metrics Bar */}
        <div className="mt-4 flex items-center gap-3 border-t border-line/60 pt-3 text-xs">
          {hasReviews ? (
            <div className="flex items-center gap-1 font-mono tabular-nums">
              <span className="font-bold text-ink">★ {lp.rating.toFixed(1)}</span>
              <span className="text-mute">({lp.ratingCount})</span>
            </div>
          ) : (
            <span className="text-xs font-medium text-mute">★ New Pro</span>
          )}

          <span className="h-1 w-1 rounded-full bg-line" aria-hidden />

          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Direct Hire</span>
          </span>
        </div>

        {/* Bio / Services Snippet */}
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-mute">
          {lp?.bio
            ? lp.bio
            : "Certified trade professional available for scheduled installations, diagnostics, and repairs."}
        </p>
      </div>

      {/* Action Footer */}
      <div className="mt-5 border-t border-line/60 pt-4 flex items-center justify-between text-xs">
        <span className="font-semibold text-ink group-hover:text-accent transition-colors">
          View Profile &amp; Rates
        </span>
        <span className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-elevated text-mute transition-all group-hover:bg-accent group-hover:text-white group-hover:translate-x-0.5 shadow-2xs">
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </span>
      </div>
    </Link>
  );
}

export function ShopCard({
  s,
}: {
  s: {
    id: string;
    name: string;
    address: string;
    description: string;
    rating: number;
    ratingCount: number;
    imageUrl: string;
    area: string;
    opensAt: number;
    closesAt: number;
  };
}) {
  const open = isOpenNow(s.opensAt, s.closesAt);
  const hasReviews = s.ratingCount > 0;

  return (
    <Link
      href={`/shop/${s.id}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-lg"
    >
      <div>
        {/* Storefront Visual Header */}
        <div className="relative">
          <Cover src={s.imageUrl} className="h-44" shopName={s.name} />

          {/* Floating Live Operating Status */}
          <div className="absolute top-3.5 left-3.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-black/20 bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md shadow-xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  open ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                }`}
              />
              <span>{open ? "Open Now" : `Opens ${fmtTime(s.opensAt)}`}</span>
            </span>
          </div>

          {/* Dispatch Capability Tag */}
          <div className="absolute top-3.5 right-3.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md shadow-xs">
              <Bike className="h-3 w-3 text-accent" strokeWidth={2} />
              <span>Rider Delivery</span>
            </span>
          </div>
        </div>

        {/* Store Identity & Details */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-bold text-base text-ink font-display group-hover:text-accent transition-colors">
                {s.name}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-mute truncate">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-mute/80" strokeWidth={1.75} />
                <span className="truncate">{s.area || s.address}</span>
              </p>
            </div>

            {/* Rating Tag */}
            <div className="shrink-0">
              {hasReviews ? (
                <div className="inline-flex items-center gap-1 rounded-lg border border-line bg-elevated px-2 py-1 text-xs font-bold text-ink font-mono tabular-nums">
                  <span className="text-accent">★</span>
                  <span>{s.rating.toFixed(1)}</span>
                  <span className="text-mute font-normal text-[11px]">({s.ratingCount})</span>
                </div>
              ) : (
                <span className="text-xs text-mute font-mono">New Store</span>
              )}
            </div>
          </div>

          {/* Store Description / Catalog Teaser */}
          <p className="mt-3.5 line-clamp-2 text-xs leading-relaxed text-mute">
            {s.description
              ? s.description
              : "Quality hardware, construction tools, fixtures, and materials available for immediate pickup or delivery."}
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-6 pb-6 pt-0">
        <div className="flex items-center justify-between border-t border-line/60 pt-4 text-xs">
          <span className="font-semibold text-ink group-hover:text-accent transition-colors">
            Browse Catalog
          </span>
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-elevated text-mute transition-all group-hover:bg-accent group-hover:text-white group-hover:translate-x-0.5 shadow-2xs">
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </span>
        </div>
      </div>
    </Link>
  );
}
