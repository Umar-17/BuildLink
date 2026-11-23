import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { LABOUR_TYPES, isOpenNow, labourLabel, nearScore } from "@/lib/constants";
import Nav from "@/components/Nav";
import { ProCard, ShopCard } from "@/components/cards";
import { Empty, btn, inputCls, selectCls } from "@/components/ui";
import type { LabourType } from "@/app/generated/prisma/enums";
import { Search, SlidersHorizontal, X, Clock, Check } from "lucide-react";

type SP = Promise<{ q?: string; type?: string; tab?: string; min?: string; sort?: string; open?: string }>;

export const metadata = { title: "Explore Directory · BuildLink" };

export default async function ExplorePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const me = await getCurrentUser();
  const q = (sp.q ?? "").trim();
  const tab = sp.tab === "labour" || sp.tab === "shops" ? sp.tab : "all";
  const type = (LABOUR_TYPES as readonly string[]).includes(sp.type ?? "") ? (sp.type as LabourType) : undefined;
  const min = [3, 4, 4.5].includes(Number(sp.min)) ? Number(sp.min) : 0;
  const sort = sp.sort === "near" || sp.sort === "new" ? sp.sort : "rating";
  const openOnly = sp.open === "1";
  const wantPros = tab !== "shops";
  const wantShops = tab !== "labour" && !type;

  const text = q ? { contains: q, mode: "insensitive" as const } : undefined;

  const [pros, shopsRaw] = await Promise.all([
    wantPros
      ? prisma.user.findMany({
          where: {
            isLabour: true,
            isBanned: false,
            ...(me ? { id: { not: me.id } } : {}),
            ...(text ? { OR: [{ name: text }, { labourProfile: { bio: text } }, { labourProfile: { area: text } }] } : {}),
            labourProfile: { is: { ...(type ? { labourType: type } : {}), ...(min ? { rating: { gte: min } } : {}) } },
          },
          select: { id: true, name: true, createdAt: true, labourProfile: true },
          take: 60,
        })
      : [],
    wantShops
      ? prisma.shop.findMany({
          where: {
            owner: { isBanned: false },
            ...(text ? { OR: [{ name: text }, { description: text }, { address: text }, { area: text }, { categories: { some: { name: text } } }] } : {}),
            ...(min ? { rating: { gte: min } } : {}),
          },
          take: 60,
        })
      : [],
  ]);

  const shops = openOnly ? shopsRaw.filter((s) => isOpenNow(s.opensAt, s.closesAt)) : shopsRaw;
  const addr = me?.address ?? "";
  const byRating = (a: number, ac: number, b: number, bc: number) => b - a || bc - ac;
  pros.sort((a, b) =>
    sort === "new"
      ? +b.createdAt - +a.createdAt
      : sort === "near" && addr
      ? nearScore(addr, b.labourProfile?.area ?? "") - nearScore(addr, a.labourProfile?.area ?? "") ||
        byRating(
          a.labourProfile?.rating ?? 0,
          a.labourProfile?.ratingCount ?? 0,
          b.labourProfile?.rating ?? 0,
          b.labourProfile?.ratingCount ?? 0,
        )
      : byRating(
          a.labourProfile?.rating ?? 0,
          a.labourProfile?.ratingCount ?? 0,
          b.labourProfile?.rating ?? 0,
          b.labourProfile?.ratingCount ?? 0,
        ) || +b.createdAt - +a.createdAt,
  );
  shops.sort((a, b) =>
    sort === "new"
      ? +b.createdAt - +a.createdAt
      : sort === "near" && addr
      ? nearScore(addr, b.area, b.address) - nearScore(addr, a.area, a.address) ||
        byRating(a.rating, a.ratingCount, b.rating, b.ratingCount)
      : byRating(a.rating, a.ratingCount, b.rating, b.ratingCount),
  );

  const activeFilters = [type, min, openOnly, sort !== "rating", q].filter(Boolean).length;
  const tabHref = (t: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (type) p.set("type", type);
    if (min) p.set("min", String(min));
    if (sort !== "rating") p.set("sort", sort);
    if (openOnly) p.set("open", "1");
    if (t !== "all") p.set("tab", t);
    return `/explore?${p.toString()}`;
  };

  const chip = (on: boolean) =>
    `inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border px-4 py-2 text-xs font-semibold transition-all ${
      on
        ? "border-accent bg-accent text-white shadow-xs"
        : "border-line bg-card text-mute hover:border-line-hover hover:text-ink"
    }`;

  return (
    <>
      <Nav user={me} />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink font-display">
            Directory &amp; Marketplace
          </h1>
          <p className="mt-1 text-sm text-mute">
            Find certified trade professionals, project contractors, and local hardware supplies.
          </p>
        </div>

        {/* Filter Form Card */}
        <form
          action="/explore"
          className="rounded-2xl border border-line bg-card p-5 shadow-xs space-y-4"
        >
          {tab !== "all" && <input type="hidden" name="tab" value={tab} />}

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-mute" strokeWidth={2} />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search specialist name, neighborhood, or supply item..."
                aria-label="Search directory"
                className={`${inputCls} pl-10`}
              />
            </div>
            <button className={`${btn} sm:w-auto h-11 px-6 text-sm shrink-0`}>
              Apply Search
            </button>
          </div>

          {/* Filter options row */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-mute mb-1">
                Trade Specialty
              </label>
              <select name="type" defaultValue={type ?? ""} aria-label="Trade Category" className={selectCls}>
                <option value="">All Trades</option>
                {LABOUR_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {labourLabel(t)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-mute mb-1">
                Minimum Rating
              </label>
              <select name="min" defaultValue={min ? String(min) : ""} aria-label="Minimum rating" className={selectCls}>
                <option value="">Any Rating</option>
                <option value="3">3.0+ Stars</option>
                <option value="4">4.0+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-mute mb-1">
                Sort Order
              </label>
              <select name="sort" defaultValue={sort} aria-label="Sort order" className={selectCls}>
                <option value="rating">Highest Rated</option>
                <option value="near">Nearest Neighborhood{me ? "" : " (requires login)"}</option>
                <option value="new">Recently Joined</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex h-11 items-center gap-2.5 rounded-xl border border-line bg-elevated/40 px-3.5 text-xs font-semibold text-ink cursor-pointer hover:border-line-hover transition-colors">
                <input
                  type="checkbox"
                  name="open"
                  value="1"
                  defaultChecked={openOnly}
                  className="h-4 w-4 rounded accent-accent"
                />
                <Clock className="h-3.5 w-3.5 text-mute" strokeWidth={2} />
                <span>Open Shops Only</span>
              </label>
            </div>
          </div>

          {/* Active Filter Bar */}
          {activeFilters > 0 && (
            <div className="flex items-center justify-between border-t border-line pt-3 text-xs">
              <span className="font-medium text-mute font-mono tabular-nums">
                {activeFilters} filter{activeFilters > 1 ? "s" : ""} active
              </span>
              <Link
                href="/explore"
                className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
              >
                <X className="h-3.5 w-3.5" />
                <span>Reset all filters</span>
              </Link>
            </div>
          )}
        </form>

        {/* Tab Pills */}
        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Result type">
          <Link href={tabHref("all")} className={chip(tab === "all")}>
            <span>All Results</span>
          </Link>
          <Link href={tabHref("labour")} className={chip(tab === "labour")}>
            <span>Trade Specialists</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.2 font-mono tabular-nums">
              {pros.length}
            </span>
          </Link>
          <Link href={tabHref("shops")} className={chip(tab === "shops")}>
            <span>Supply Stores</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.2 font-mono tabular-nums">
              {wantShops ? shops.length : 0}
            </span>
          </Link>
        </nav>

        {/* Trade Professionals Grid */}
        {wantPros && (
          <section className="space-y-4" aria-labelledby="pros-heading">
            <div className="flex items-center justify-between">
              <h2 id="pros-heading" className="text-xl font-bold tracking-tight text-ink font-display">
                Trade Specialists{" "}
                <span className="text-mute font-mono text-sm font-normal">
                  ({pros.length})
                </span>
              </h2>
            </div>
            {pros.length === 0 ? (
              <Empty title="No specialists matched your criteria">
                Try widening your search terms or resetting the trade filters.
              </Empty>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pros.map((p) => (
                  <ProCard key={p.id} p={p} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Supply Shops Grid */}
        {wantShops && (
          <section className="space-y-4 pt-4" aria-labelledby="shops-heading">
            <div className="flex items-center justify-between">
              <h2 id="shops-heading" className="text-xl font-bold tracking-tight text-ink font-display">
                Local Supply Stores{" "}
                <span className="text-mute font-mono text-sm font-normal">
                  ({shops.length})
                </span>
              </h2>
            </div>
            {shops.length === 0 ? (
              <Empty title="No supply stores matched your criteria">
                Try searching for a different area or unchecking &quot;Open Shops Only&quot;.
              </Empty>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {shops.map((s) => (
                  <ShopCard key={s.id} s={s} />
                ))}
              </div>
            )}
          </section>
        )}

        {sort === "near" && !addr && (
          <p className="text-xs text-mute font-mono">
            * Sign in with your registered account to calculate proximity from your primary delivery address.
          </p>
        )}
      </main>
    </>
  );
}
