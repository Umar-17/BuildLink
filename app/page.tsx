import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { LABOUR_TYPES, labourLabel } from "@/lib/constants";
import Nav from "@/components/Nav";
import { ProCard, ShopCard } from "@/components/cards";
import { TradeIcon } from "@/components/TradeIcon";
import HeroTypewriter from "@/components/HeroTypewriter";
import { btn } from "@/components/ui";
import {
  Search,
  Handshake,
  CheckCircle2,
  Wrench,
  Store,
  Bike,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "Discover Verified Talent",
    text: "Browse certified trade specialists and local shops. Filter by trade category, verified rating, and neighborhood.",
  },
  {
    icon: Handshake,
    title: "Direct Hire or Bid",
    text: "Send a direct private hire request, post a public project for competitive trade bids, or order materials directly.",
  },
  {
    icon: CheckCircle2,
    title: "Delivered & Verified",
    text: "Track job progress, dispatch delivery riders to your site, and leave verified ratings upon completion.",
  },
];

const JOIN = [
  {
    icon: Wrench,
    title: "Work as a Specialist",
    text: "Plumbers, electricians, painters, and carpenters. Receive direct contract offers and bid on open local jobs.",
  },
  {
    icon: Store,
    title: "Operate a Supply Shop",
    text: "Publish your inventory catalog, fulfill orders seamlessly, and build trusted local relationships.",
  },
  {
    icon: Bike,
    title: "Ride & Fulfill Deliveries",
    text: "Pick up prepared supply orders from local shops and deliver them directly to job sites and residences.",
  },
];

export default async function HomePage() {
  const me = await getCurrentUser();
  const [pros, shops, proCount, shopCount, doneCount] = await Promise.all([
    prisma.user.findMany({
      where: { isLabour: true, isBanned: false, labourProfile: { isNot: null } },
      select: { id: true, name: true, labourProfile: true },
      orderBy: [{ labourProfile: { rating: "desc" } }, { labourProfile: { ratingCount: "desc" } }],
      take: 4,
    }),
    prisma.shop.findMany({
      where: { owner: { isBanned: false } },
      orderBy: [{ rating: "desc" }, { ratingCount: "desc" }],
      take: 3,
    }),
    prisma.user.count({ where: { isLabour: true, isBanned: false } }),
    prisma.shop.count({ where: { owner: { isBanned: false } } }),
    prisma.job.count({ where: { status: "COMPLETED" } }),
  ]);
  const first = me?.name.split(" ")[0];

  return (
    <>
      <Nav user={me} />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-4 pb-12 pt-12 sm:pt-20 sm:px-6">
          <div className="max-w-3xl">
            {/* Elevated Welcome / Network Status Badge */}
            <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-accent/25 bg-accent-soft/40 px-4 py-1.5 text-xs font-semibold text-ink shadow-xs backdrop-blur-xs">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-white shadow-2xs">
                <Wrench className="h-3 w-3 -rotate-45" strokeWidth={2.5} />
              </span>
              <span className="font-medium tracking-wide">
                {first ? (
                  <>
                    Welcome back, <strong className="font-bold text-accent underline decoration-accent/40 underline-offset-2">{first}</strong>
                  </>
                ) : (
                  <span>Verified Trade Specialists &amp; On-Demand Supply Outlets</span>
                )}
              </span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl font-display leading-[1.15]">
              Skilled trade professionals and local supplies,{" "}
              <HeroTypewriter
                words={[
                  "at your doorstep.",
                  "on your job site.",
                  "verified & on demand.",
                  "with rapid dispatch.",
                  "ready for hire.",
                ]}
              />
            </h1>

            <p className="mt-5 text-base sm:text-lg text-mute leading-relaxed max-w-2xl">
              Hire vetted plumbers, electricians, and construction specialists, or source project materials from nearby supply shops with on-demand rider dispatch.
            </p>
          </div>

          {/* Omni-search Bar */}
          <form
            action="/explore"
            className="mt-8 flex max-w-3xl flex-col gap-2 rounded-2xl border border-line bg-card p-2.5 shadow-sm sm:flex-row sm:items-center"
          >
            <div className="flex flex-1 items-center gap-2.5 px-3">
              <Search className="h-4 w-4 text-mute shrink-0" strokeWidth={2} />
              <input
                name="q"
                placeholder="Search trades, plumbing, paint, or shop name..."
                className="w-full bg-transparent text-sm text-ink placeholder:text-mute outline-none"
                aria-label="Search"
              />
            </div>

            <div className="h-6 w-[1px] bg-line hidden sm:block" />

            <select
              name="type"
              aria-label="Trade Category"
              className="rounded-xl bg-elevated px-3 py-2 text-xs font-medium text-ink outline-none sm:w-48 border border-transparent focus:border-line"
            >
              <option value="">All Trade Categories</option>
              {LABOUR_TYPES.map((t) => (
                <option key={t} value={t}>
                  {labourLabel(t)}
                </option>
              ))}
            </select>

            <button className={`${btn} h-11 px-6 text-sm shrink-0`}>
              Search Network
            </button>
          </form>

          {/* Quick Trade Filter Chips */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-mute mr-1">
              Popular Trades:
            </span>
            {LABOUR_TYPES.map((t) => (
              <Link
                key={t}
                href={`/explore?type=${t}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3.5 py-1.5 text-xs font-medium text-ink shadow-xs transition-colors hover:border-line-hover hover:text-accent"
              >
                <TradeIcon trade={t} className="h-3.5 w-3.5 text-mute" />
                <span>{labourLabel(t)}</span>
              </Link>
            ))}
          </div>

          {/* Metrics Banner */}
          <dl className="mt-12 grid max-w-2xl grid-cols-3 gap-4 border-t border-line pt-8">
            {[
              ["Verified Pros", proCount],
              ["Active Shops", shopCount],
              ["Projects Completed", doneCount],
            ].map(([label, val]) => (
              <div key={label as string} className="space-y-1">
                <dd className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink font-mono tabular-nums">
                  {val}
                </dd>
                <dt className="text-xs font-medium text-mute uppercase tracking-wider">
                  {label}
                </dt>
              </div>
            ))}
          </dl>
        </section>

        {/* Category Grid Section */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 border-t border-line">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-ink font-display">
                Browse by Trade
              </h2>
              <p className="text-xs sm:text-sm text-mute mt-1">
                Certified and vetted professionals ready for contract deployment
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {LABOUR_TYPES.map((t) => (
              <Link
                key={t}
                href={`/explore?type=${t}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-line bg-card p-5 text-center shadow-xs transition-all hover:border-accent hover:shadow-md"
              >
                <span
                  className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand transition-colors group-hover:bg-accent group-hover:text-white"
                  aria-hidden
                >
                  <TradeIcon trade={t} className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span className="text-xs font-semibold text-ink group-hover:text-accent transition-colors">
                  {labourLabel(t)}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Top-Rated Pros Showcase */}
        {pros.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 border-t border-line">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-ink font-display">
                  Top-Rated Trade Specialists
                </h2>
                <p className="text-xs sm:text-sm text-mute mt-1">
                  Highest customer satisfaction and completion rates
                </p>
              </div>
              <Link
                href="/explore?tab=labour"
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              >
                <span>View all specialists</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {pros.map((p) => (
                <ProCard key={p.id} p={p} />
              ))}
            </div>
          </section>
        )}

        {/* Popular Shops Showcase */}
        {shops.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 border-t border-line">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-ink font-display">
                  Verified Local Supply Stores
                </h2>
                <p className="text-xs sm:text-sm text-mute mt-1">
                  Hardware, building materials, tools, and paint outlets
                </p>
              </div>
              <Link
                href="/explore?tab=shops"
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              >
                <span>View all shops</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shops.map((s) => (
                <ShopCard key={s.id} s={s} />
              ))}
            </div>
          </section>
        )}

        {/* How It Works Section */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 border-t border-line">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight text-ink font-display">
              Structured Service Delivery
            </h2>
            <p className="text-xs sm:text-sm text-mute mt-1">
              From contract initiation to fulfillment and verified review
            </p>
          </div>

          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              return (
                <li
                  key={s.title}
                  className="rounded-2xl border border-line bg-card p-6 shadow-xs relative space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span className="text-xs font-bold text-mute font-mono">
                      0{idx + 1}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-ink font-display">{s.title}</h3>
                  <p className="text-xs leading-relaxed text-mute">{s.text}</p>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Join Platform Banner */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="rounded-3xl bg-brand p-8 text-white shadow-md sm:p-12">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl font-display">
                Expand Your Business with BuildLink
              </h2>
              <p className="mt-2 text-sm text-white/80 leading-relaxed">
                A single unified account gives you access to commercial hiring, public project bidding, retail shop operations, and delivery logistics.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {JOIN.map((j) => {
                const Icon = j.icon;
                return (
                  <div
                    key={j.title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xs space-y-2"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <h3 className="font-semibold text-sm text-white font-display">{j.title}</h3>
                    <p className="text-xs leading-relaxed text-white/70">{j.text}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8">
              <Link
                href={me ? "/dashboard" : "/auth"}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-accent-hover active:scale-[0.99]"
              >
                <span>{me ? "Access Dashboard" : "Register a Free Account"}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Global Footer */}
        <footer className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 text-xs text-mute border-t border-line">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-display text-sm font-bold text-ink">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span>
                Build<span className="text-accent">Link</span>
              </span>
            </div>

            <div className="flex items-center gap-6">
              <Link href="/explore" className="hover:text-ink transition-colors">
                Explore Directory
              </Link>
              <Link
                href={me ? "/dashboard" : "/auth"}
                className="hover:text-ink transition-colors"
              >
                {me ? "Dashboard" : "Sign In"}
              </Link>
            </div>

            <span className="font-mono tabular-nums">
              © {new Date().getFullYear()} BuildLink Network. All rights reserved.
            </span>
          </div>
        </footer>
      </main>
    </>
  );
}
