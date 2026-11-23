import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LABOUR_TYPES, labourLabel, money, jobStatusLabel, orderStatusLabel } from "@/lib/constants";
import { cancelJob, completeJob, postPublicJob, respondBid } from "@/actions/jobs";
import { submitReview, submitShopReview } from "@/actions/reviews";
import { Badge, Empty, Field, StarPicker, StarRow, Stars, btn, btnDanger, btnGhost, inputCls } from "@/components/ui";
import { TradeIcon } from "@/components/TradeIcon";
import SubmitButton from "@/components/SubmitButton";
import {
  Wrench,
  MessageSquare,
  FolderKanban,
  ShoppingBag,
  Plus,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bike,
  ArrowRight,
} from "lucide-react";
import type { ComponentType } from "react";

type Props = { userId: string; address: string };

const panel = "rounded-2xl border border-line bg-card p-5 shadow-xs transition-shadow";

function SectionHead({
  id,
  title,
  hint,
  count,
}: {
  id: string;
  title: string;
  hint?: string;
  count?: number;
}) {
  return (
    <div id={id} className="mb-4 scroll-mt-24">
      <div className="flex items-center gap-2.5">
        <h2 className="text-xl font-bold tracking-tight text-ink font-display">{title}</h2>
        {count !== undefined && (
          <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand font-mono tabular-nums">
            {count}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-mute">{hint}</p>}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3.5 rounded-2xl border p-4 shadow-xs transition-colors ${
        highlight
          ? "border-accent/40 bg-accent-soft/30"
          : "border-line bg-card"
      }`}
    >
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
          highlight ? "bg-accent text-white" : "bg-brand-soft text-brand"
        }`}
        aria-hidden
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div>
        <p className="text-2xl font-extrabold leading-none tracking-tight text-ink font-mono tabular-nums">
          {value}
        </p>
        <p className="mt-1.5 text-xs font-medium text-mute">{label}</p>
      </div>
    </div>
  );
}

export default async function UserView({ userId, address }: Props) {
  const [jobs, orders] = await Promise.all([
    prisma.job.findMany({
      where: { clientId: userId },
      include: {
        assignedLabour: { select: { id: true, name: true, phone: true } },
        review: true,
        bids: {
          orderBy: { createdAt: "desc" },
          include: { labour: { select: { id: true, name: true, labourProfile: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: { customerId: userId },
      include: {
        shop: { select: { id: true, name: true } },
        rider: { select: { name: true, phone: true } },
        items: true,
        review: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const toReview = orders.filter((o) => o.status === "DELIVERED" && !o.review).length;
  const inProgress = jobs.filter((j) => j.status === "ACCEPTED").length;
  const pendingOffers = jobs
    .filter((j) => j.status === "OPEN")
    .reduce((n, j) => n + j.bids.filter((b) => b.status === "PENDING").length, 0);
  const activeOrders = orders.filter((o) => o.status !== "DELIVERED" && o.status !== "REJECTED").length;

  const navLink =
    "whitespace-nowrap rounded-xl border border-line bg-card px-4 py-2 text-xs font-semibold text-mute transition-colors hover:border-line-hover hover:text-ink";

  return (
    <div className="space-y-10">
      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <Stat icon={Wrench} label="Projects in Progress" value={inProgress} />
        <Stat
          icon={MessageSquare}
          label="Pending Specialist Offers"
          value={pendingOffers}
          highlight={pendingOffers > 0}
        />
        <Stat icon={FolderKanban} label="Total Projects Posted" value={jobs.length} />
        <Stat icon={ShoppingBag} label="Active Supply Orders" value={activeOrders} />
      </div>

      {/* Sticky Section Navigation */}
      <nav
        className="sticky top-16 z-10 -mx-4 flex gap-2 overflow-x-auto bg-paper/90 px-4 py-2.5 backdrop-blur-md sm:mx-0 sm:px-0"
        aria-label="Portal Navigation"
      >
        <Link href="/explore" className={navLink}>
          Explore Directory
        </Link>
        <a href="#post" className={navLink}>
          Post a Project
        </a>
        <a href="#projects" className={navLink}>
          My Projects ({jobs.length})
        </a>
        <a href="#orders" className={navLink}>
          My Orders ({orders.length})
        </a>
      </nav>

      {/* Explore Quick-Access Section */}
      <section className="space-y-4">
        <SectionHead
          id="find"
          title="Hire Specialists &amp; Sourcing"
          hint="Directly search verified trade categories or source building materials from verified stores."
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {LABOUR_TYPES.map((t) => (
            <Link
              key={t}
              href={`/explore?type=${t}`}
              className="flex items-center gap-3 rounded-2xl border border-line bg-card p-4 text-xs font-semibold text-ink shadow-xs transition-all hover:border-accent hover:text-accent"
            >
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"
                aria-hidden
              >
                <TradeIcon trade={t} className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <span className="truncate">{labourLabel(t)}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Post a Public Project Section */}
      <section className="space-y-4">
        <SectionHead
          id="post"
          title="Post a Public Project for Bidding"
          hint="Broadcast your project specifications. Qualified trade specialists will submit competitive price bids for your review."
        />
        <details className={`${panel} group`} open={jobs.length === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold uppercase tracking-wider text-accent">
            <span className="inline-flex items-center gap-1.5">
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              <span>Create New Project Listing</span>
            </span>
            <span className="text-mute font-normal lowercase group-open:hidden">
              (click to open)
            </span>
          </summary>

          <form action={postPublicJob} className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <Field label="Project Title / Scope">
                <input
                  name="title"
                  required
                  placeholder="e.g., Rewire living room circuit and install fixtures"
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="sm:col-span-1">
              <Field label="Trade Category Needed">
                <select name="labourType" required className={inputCls}>
                  {LABOUR_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {labourLabel(t)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Detailed Scope of Work">
                <textarea
                  name="description"
                  required
                  rows={3}
                  placeholder="Provide precise details, measurements, and any specific materials needed..."
                  className="w-full rounded-xl border border-line bg-card p-3.5 text-sm text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors"
                />
              </Field>
            </div>

            <div className="sm:col-span-1">
              <Field label="Target Budget (Rs)">
                <input
                  name="budget"
                  type="number"
                  min="1"
                  step="any"
                  required
                  placeholder="e.g., 5000"
                  className={`${inputCls} font-mono`}
                />
              </Field>
            </div>

            <div className="sm:col-span-1">
              <Field label="Job Site Location">
                <input
                  name="location"
                  defaultValue={address}
                  required
                  placeholder="Street address or area"
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="sm:col-span-2 pt-2">
              <SubmitButton className={`${btn} h-11 px-6`}>
                <span>Publish Project to Specialists</span>
                <ArrowRight className="h-4 w-4" />
              </SubmitButton>
            </div>
          </form>
        </details>
      </section>

      {/* Projects List Section */}
      <section className="space-y-4">
        <SectionHead id="projects" title="My Projects &amp; Contracts" count={jobs.length} />
        {jobs.length === 0 ? (
          <Empty title="No projects active or posted yet">
            Publish a public project above or browse the specialist directory to initiate a direct contract.
          </Empty>
        ) : (
          <div className="space-y-4">
            {jobs.map((j) => {
              const pending = j.bids.filter((b) => b.status === "PENDING");
              const isDone = j.status === "COMPLETED";
              const isRejected = j.status === "REJECTED";
              const isAccepted = j.status === "ACCEPTED";

              return (
                <article
                  key={j.id}
                  className={`${panel} space-y-4 border-l-4 ${
                    isDone
                      ? "border-l-good"
                      : isRejected
                      ? "border-l-bad"
                      : isAccepted
                      ? "border-l-brand"
                      : "border-l-gold"
                  }`}
                >
                  <header className="flex flex-wrap items-center justify-between gap-2.5">
                    <h3 className="text-base font-bold text-ink font-display">{j.title}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="brand">
                        <TradeIcon trade={j.labourType} className="h-3 w-3" />
                        <span>{labourLabel(j.labourType)}</span>
                      </Badge>
                      <Badge
                        tone={isDone ? "good" : isRejected ? "bad" : isAccepted ? "good" : "gold"}
                        dot
                      >
                        {jobStatusLabel(j.status)}
                      </Badge>
                      <Badge tone="gray">{j.isPublic ? "Public Bidding" : "Direct Request"}</Badge>
                    </div>
                  </header>

                  <p className="text-xs leading-relaxed text-mute">{j.description}</p>

                  <dl className="grid gap-3 rounded-xl border border-line bg-elevated/40 p-3.5 text-xs sm:grid-cols-3">
                    <div>
                      <dt className="font-semibold uppercase tracking-wider text-mute text-[10px]">
                        Target Budget
                      </dt>
                      <dd className="mt-1 font-bold text-ink font-mono tabular-nums">
                        {money(j.budget)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold uppercase tracking-wider text-mute text-[10px]">
                        Agreed Contract Price
                      </dt>
                      <dd className="mt-1 font-bold text-accent font-mono tabular-nums">
                        {j.agreedPrice != null ? money(j.agreedPrice) : "Pending agreement"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold uppercase tracking-wider text-mute text-[10px]">
                        Assigned Specialist
                      </dt>
                      <dd className="mt-1 font-semibold text-ink">
                        {j.assignedLabour ? (
                          <div className="space-y-0.5">
                            <Link
                              className="text-accent hover:underline"
                              href={`/labour/${j.assignedLabour.id}`}
                            >
                              {j.assignedLabour.name}
                            </Link>
                            {j.status === "ACCEPTED" && j.assignedLabour.phone && (
                              <span className="block text-[11px] font-mono text-mute">
                                {j.assignedLabour.phone}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-mute font-normal">Awaiting specialist</span>
                        )}
                      </dd>
                    </div>
                  </dl>

                  {/* Bids List for Open Public Jobs */}
                  {j.status === "OPEN" && (
                    <div className="space-y-3 border-t border-line pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-mute">
                        Incoming Offers from Specialists ({pending.length})
                      </p>
                      {pending.length === 0 ? (
                        <p className="text-xs text-mute italic">
                          No offers received yet. Notifications will trigger as bids arrive.
                        </p>
                      ) : (
                        pending.map((b) => (
                          <div
                            key={b.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-card p-3.5 shadow-xs"
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Link
                                  href={`/labour/${b.labour.id}`}
                                  className="font-bold text-ink hover:text-accent transition-colors"
                                >
                                  {b.labour.name}
                                </Link>
                                {b.labour.labourProfile && (
                                  <Stars
                                    rating={b.labour.labourProfile.rating}
                                    count={b.labour.labourProfile.ratingCount}
                                  />
                                )}
                              </div>
                              <p className="text-xs font-medium text-ink font-mono tabular-nums">
                                Bid: <strong className="text-accent">{money(b.proposedAmount)}</strong>
                                {b.proposedAmount > j.budget && (
                                  <span className="text-gold ml-1">
                                    (+{money(b.proposedAmount - j.budget)} over offer)
                                  </span>
                                )}
                                {b.proposedAmount < j.budget && (
                                  <span className="text-good ml-1">
                                    ({money(j.budget - b.proposedAmount)} lower than budget)
                                  </span>
                                )}
                              </p>
                              {b.message && (
                                <p className="text-xs text-mute italic">&ldquo;{b.message}&rdquo;</p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <form action={respondBid.bind(null, b.id, true)}>
                                <SubmitButton className={`${btn} h-9 px-4 text-xs`}>
                                  Accept Bid
                                </SubmitButton>
                              </form>
                              <form action={respondBid.bind(null, b.id, false)}>
                                <SubmitButton className={`${btnDanger} h-9 px-4 text-xs`}>
                                  Decline
                                </SubmitButton>
                              </form>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Job Actions */}
                  {(["OPEN", "PENDING_DIRECT"].includes(j.status) || j.status === "ACCEPTED") && (
                    <div className="flex flex-wrap gap-2.5 pt-2 border-t border-line">
                      {["OPEN", "PENDING_DIRECT"].includes(j.status) && (
                        <form action={cancelJob.bind(null, j.id)}>
                          <SubmitButton className={`${btnDanger} h-9 px-4 text-xs`}>
                            Cancel Project
                          </SubmitButton>
                        </form>
                      )}
                      {j.status === "ACCEPTED" && (
                        <form action={completeJob.bind(null, j.id)}>
                          <SubmitButton className={`${btn} h-9 px-4 text-xs`}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Confirm Job Completion</span>
                          </SubmitButton>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Rating / Review Form when completed */}
                  {j.status === "COMPLETED" && j.assignedLabour && (
                    <div className="border-t border-line pt-3">
                      {j.review ? (
                        <div className="rounded-xl border border-line bg-elevated/40 p-3 text-xs text-mute space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-ink">Your Review:</span>
                            <StarRow value={j.review.rating} />
                          </div>
                          {j.review.comment && (
                            <p className="text-ink">&ldquo;{j.review.comment}&rdquo;</p>
                          )}
                        </div>
                      ) : (
                        <form
                          action={submitReview}
                          className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-card p-4 shadow-xs"
                        >
                          <input type="hidden" name="jobId" value={j.id} />
                          <div className="shrink-0">
                            <StarPicker
                              idPrefix={`job-${j.id}`}
                              label={`Rate ${j.assignedLabour.name}`}
                            />
                          </div>
                          <div className="min-w-48 flex-1">
                            <Field label="Feedback / Experience">
                              <input
                                name="comment"
                                placeholder="Detail the quality of workmanship and reliability..."
                                className={inputCls}
                              />
                            </Field>
                          </div>
                          <SubmitButton className={`${btn} h-11 px-5 text-xs`}>
                            Submit Rating
                          </SubmitButton>
                        </form>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Orders List Section */}
      <section className="space-y-4">
        <SectionHead
          id="orders"
          title="Supply Store Orders"
          count={orders.length}
          hint={
            toReview > 0
              ? `${toReview} delivered order${toReview === 1 ? " is" : "s are"} waiting for your review.`
              : undefined
          }
        />
        {orders.length === 0 ? (
          <Empty title="No supply orders placed yet">
            Visit the local supply shops on the Explore page to order tools, building supplies, or materials.
          </Empty>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {orders.map((o) => {
              const isDelivered = o.status === "DELIVERED";
              const isRejected = o.status === "REJECTED";
              return (
                <article key={o.id} className={`${panel} space-y-3.5 text-xs`}>
                  <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-accent" strokeWidth={2} />
                      <Link
                        href={`/shop/${o.shop.id}`}
                        className="font-bold text-sm text-ink hover:text-accent transition-colors font-display"
                      >
                        {o.shop.name}
                      </Link>
                    </div>
                    <Badge tone={isDelivered ? "good" : isRejected ? "bad" : "gold"} dot>
                      {orderStatusLabel(o.status)}
                    </Badge>
                  </header>

                  <ul className="divide-y divide-line rounded-xl border border-line bg-elevated/40 px-3 font-medium">
                    {o.items.map((i) => (
                      <li key={i.id} className="flex justify-between py-2">
                        <span className="text-ink">{i.itemName}</span>
                        <span className="text-mute font-mono tabular-nums">× {i.quantity}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between font-semibold text-xs border-t border-line pt-2">
                    <span className="text-mute">Order Total</span>
                    <strong className="text-sm font-bold text-accent font-mono tabular-nums">
                      {money(o.totalAmount)}
                    </strong>
                  </div>

                  <div className="space-y-1 text-mute text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                      <span className="truncate">{o.deliveryAddress}</span>
                    </div>
                    {o.rider && (
                      <div className="flex items-center gap-1.5 text-ink font-medium">
                        <Bike className="h-3 w-3 shrink-0 text-accent" strokeWidth={2} />
                        <span>
                          Courier: {o.rider.name}
                          {o.rider.phone && (
                            <span className="font-mono text-mute ml-1">({o.rider.phone})</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Review for delivered order */}
                  {isDelivered && (
                    <div className="border-t border-line pt-2.5">
                      {o.review ? (
                        <div className="rounded-xl border border-line bg-elevated/40 p-2.5 text-xs text-mute space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-ink">Store Review:</span>
                            <StarRow value={o.review.rating} />
                          </div>
                          {o.review.comment && (
                            <p className="text-ink">&ldquo;{o.review.comment}&rdquo;</p>
                          )}
                        </div>
                      ) : (
                        <form action={submitShopReview} className="space-y-2.5 rounded-xl border border-line bg-card p-3 shadow-xs">
                          <input type="hidden" name="orderId" value={o.id} />
                          <StarPicker idPrefix={`order-${o.id}`} label={`Rate ${o.shop.name}`} />
                          <div className="flex flex-wrap items-end gap-2">
                            <div className="min-w-48 flex-1">
                              <input
                                name="comment"
                                maxLength={500}
                                placeholder="Add comments regarding packaging and delivery speed..."
                                className={inputCls}
                              />
                            </div>
                            <SubmitButton className={`${btn} h-11 px-4 text-xs`}>
                              Submit Review
                            </SubmitButton>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
