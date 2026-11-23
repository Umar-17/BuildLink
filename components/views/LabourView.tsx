import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { labourLabel, money, jobStatusLabel } from "@/lib/constants";
import { respondDirectJob, submitBid } from "@/actions/jobs";
import { saveLabourProfile } from "@/actions/profile";
import { Badge, Card, Empty, Field, Section, Stars, btn, btnDanger, inputCls } from "@/components/ui";
import { TradeIcon } from "@/components/TradeIcon";
import type { LabourType } from "@/app/generated/prisma/enums";
import SubmitButton from "@/components/SubmitButton";
import { MapPin, User, Phone, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft font-mono text-xs font-bold text-brand border border-brand/20">
      {initials}
    </span>
  );
}

function Stat({
  label,
  value,
  tone = "",
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-mute">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold tracking-tight font-mono tabular-nums ${tone || "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}

export default async function LabourView({
  userId,
  profile,
}: {
  userId: string;
  profile: { labourType: LabourType; rating: number; ratingCount: number; bio: string; imageUrl: string; area: string };
}) {
  const clientSel = { select: { id: true, name: true, phone: true } } as const;
  const [mine, publicJobs] = await Promise.all([
    prisma.job.findMany({ where: { assignedLabourId: userId }, include: { client: clientSel }, orderBy: { createdAt: "desc" } }),
    prisma.job.findMany({
      where: { isPublic: true, status: "OPEN", labourType: profile.labourType, clientId: { not: userId } },
      include: { client: clientSel, bids: { where: { labourId: userId } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const requests = mine.filter((j) => j.status === "PENDING_DIRECT");
  const active = mine.filter((j) => j.status === "ACCEPTED");
  const history = mine.filter((j) => ["COMPLETED", "REJECTED"].includes(j.status));
  const completed = history.filter((j) => j.status === "COMPLETED");
  const earned = completed.reduce((sum, j) => sum + (j.agreedPrice ?? 0), 0);
  const trade = labourLabel(profile.labourType);

  return (
    <div className="space-y-10">
      {/* Profile Overview Banner */}
      <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6 border-b border-line">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge tone="brand">
                <TradeIcon trade={profile.labourType} className="h-3.5 w-3.5" />
                <span>{trade}</span>
              </Badge>
              <ShieldCheck className="h-4 w-4 text-good" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-ink font-display">
              Specialist Operating Dashboard
            </h2>
            <Stars rating={profile.rating} count={profile.ratingCount} size="md" />
          </div>

          <Link
            href={`/labour/${userId}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-elevated/50 px-4 py-2.5 text-xs font-semibold text-ink shadow-xs transition-colors hover:border-line-hover hover:text-accent"
          >
            <span>View Public Profile</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Operational KPI Strip */}
        <div className="grid grid-cols-2 gap-3 bg-elevated/30 p-4 sm:grid-cols-4">
          <Stat label="Direct Requests" value={requests.length} tone={requests.length ? "text-accent" : ""} />
          <Stat label="Jobs in Progress" value={active.length} />
          <Stat label="Completed Contracts" value={completed.length} />
          <Stat label="Total Volume Earned" value={money(earned)} tone="text-good" />
        </div>
      </div>

      {/* Direct Hire Requests */}
      <Section
        title="Direct Hire Requests"
        hint="Customers who selected you directly for contract work. Review details and choose to accept or decline."
        count={requests.length}
      >
        {requests.length === 0 ? (
          <Empty title="No direct hire requests pending">
            Direct requests from clients will show up here as they arrive.
          </Empty>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {requests.map((j) => (
              <Card key={j.id} className="flex flex-col gap-3.5 border-l-4 border-l-gold">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-sm text-ink font-display leading-snug">{j.title}</h3>
                  <span className="shrink-0 rounded-lg bg-gold-soft border border-gold/20 px-2.5 py-1 text-xs font-bold text-gold font-mono tabular-nums">
                    {money(j.budget)}
                  </span>
                </div>

                <p className="line-clamp-3 text-xs leading-relaxed text-mute">{j.description}</p>

                <div className="flex items-center gap-3 border-t border-line/60 pt-3">
                  <Avatar name={j.client.name} />
                  <div className="flex min-w-0 flex-col text-xs">
                    <span className="truncate font-semibold text-ink">{j.client.name}</span>
                    <span className="inline-flex items-center gap-1 text-mute text-[11px] truncate">
                      <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                      <span>{j.location}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-2 pt-2 border-t border-line/60">
                  <form action={respondDirectJob.bind(null, j.id, true)} className="contents">
                    <SubmitButton className={`${btn} h-9 text-xs`}>Accept Contract</SubmitButton>
                  </form>
                  <form action={respondDirectJob.bind(null, j.id, false)} className="contents">
                    <SubmitButton className={`${btnDanger} h-9 text-xs`}>Decline</SubmitButton>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {/* Active Jobs in Progress */}
      <Section
        title="Active Jobs in Progress"
        hint="Contracts currently active. The client marks the contract completed upon physical verification."
        count={active.length}
      >
        {active.length === 0 ? (
          <Empty title="No jobs currently in progress">
            Accept a direct request above or bid on open trade projects below to start working.
          </Empty>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {active.map((j) => (
              <Card key={j.id} className="space-y-3.5 border-l-4 border-l-good">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-sm text-ink font-display leading-snug">{j.title}</h3>
                  <span className="shrink-0 rounded-lg bg-good-soft border border-good/20 px-2.5 py-1 text-xs font-bold text-good font-mono tabular-nums">
                    {money(j.agreedPrice ?? j.budget)}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-mute">{j.description}</p>

                <div className="flex items-center gap-3 rounded-xl border border-line bg-elevated/40 p-3 text-xs">
                  <Avatar name={j.client.name} />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-semibold text-ink">{j.client.name}</span>
                    {j.client.phone && (
                      <a
                        href={`tel:${j.client.phone}`}
                        className="inline-flex items-center gap-1 text-accent hover:underline font-mono"
                      >
                        <Phone className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                        <span>{j.client.phone}</span>
                      </a>
                    )}
                    <span className="inline-flex items-center gap-1 text-mute text-[11px] truncate">
                      <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                      <span>{j.location}</span>
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {/* Open Public Projects Bidding Board */}
      <Section
        title={`Open ${trade} Projects for Bidding`}
        hint="Public client listings seeking your trade. Offer the listed budget or submit your custom bid."
        count={publicJobs.length}
      >
        {publicJobs.length === 0 ? (
          <Empty title="No open public projects currently listed">
            New public projects matching your trade category will appear here.
          </Empty>
        ) : (
          <div className="space-y-4">
            {publicJobs.map((j) => {
              const bid = j.bids[0];
              const cta =
                bid?.status === "PENDING"
                  ? "Update Proposed Bid"
                  : bid?.status === "REJECTED"
                  ? "Send Revised Bid"
                  : "Submit Price Bid";
              return (
                <Card key={j.id} className="space-y-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <h3 className="font-bold text-sm text-ink font-display leading-snug">{j.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-mute">
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3 w-3" strokeWidth={1.75} />
                          <span>{j.client.name}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" strokeWidth={1.75} />
                          <span>{j.location}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-mute">Client Budget</p>
                      <p className="text-base font-bold text-accent font-mono tabular-nums">{money(j.budget)}</p>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-mute">{j.description}</p>

                  {bid?.status === "REJECTED" && (
                    <Badge tone="bad">Your last offer was declined. You can submit a revised price.</Badge>
                  )}
                  {bid?.status === "PENDING" && (
                    <Badge tone="gold">
                      Your offer of {money(bid.proposedAmount)} is pending client review
                    </Badge>
                  )}

                  <details className="group rounded-xl border border-line bg-elevated/40 open:bg-card">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-wider text-accent [&::-webkit-details-marker]:hidden">
                      <span>{cta}</span>
                      <span className="transition-transform group-open:rotate-180 text-mute" aria-hidden>
                        ▾
                      </span>
                    </summary>

                    <form
                      action={submitBid}
                      className="grid gap-3 border-t border-line p-4 sm:grid-cols-[12rem_1fr_auto] sm:items-end"
                    >
                      <input type="hidden" name="jobId" value={j.id} />
                      <Field label="Your Proposed Price (Rs)">
                        <input
                          name="proposedAmount"
                          type="number"
                          min="1"
                          step="any"
                          required
                          defaultValue={bid?.proposedAmount ?? j.budget}
                          className={`${inputCls} font-mono`}
                        />
                      </Field>
                      <Field label="Message to Client (optional)">
                        <input
                          name="message"
                          defaultValue={bid?.message ?? ""}
                          placeholder="Highlight your availability, tools, and experience..."
                          className={inputCls}
                        />
                      </Field>
                      <SubmitButton className={`${btn} h-11 px-5 text-xs`}>
                        {bid?.status === "PENDING" ? "Update Bid" : "Transmit Bid"}
                      </SubmitButton>
                    </form>
                  </details>
                </Card>
              );
            })}
          </div>
        )}
      </Section>

      {/* Completed Past Contracts */}
      {history.length > 0 && (
        <Section title="Historical Completed Contracts">
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-xs">
            {history.map((j) => (
              <div key={j.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs">
                <div className="flex items-center gap-3">
                  <Avatar name={j.client.name} />
                  <div>
                    <p className="font-semibold text-ink">{j.title}</p>
                    <p className="text-mute">Client: {j.client.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {j.agreedPrice != null && (
                    <span className="font-bold text-ink font-mono tabular-nums">
                      {money(j.agreedPrice)}
                    </span>
                  )}
                  <Badge tone={j.status === "COMPLETED" ? "good" : "bad"} dot>
                    {jobStatusLabel(j.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Profile Configuration Editor */}
      <Section
        title="Public Profile Configuration"
        hint="Control how clients discover your trade services in the network directory."
      >
        <Card className="p-6">
          <form action={saveLabourProfile} className="grid gap-4 sm:grid-cols-2">
            <Field label="Profile Image Link (https://…)">
              <input
                name="imageUrl"
                type="url"
                defaultValue={profile.imageUrl}
                placeholder="https://…/avatar.jpg"
                className={inputCls}
              />
            </Field>

            <Field label="Operating Area / Neighborhood">
              <input
                name="area"
                defaultValue={profile.area}
                maxLength={80}
                placeholder="e.g. Gulberg, Lahore"
                className={inputCls}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Professional Bio &amp; Qualifications">
                <textarea
                  name="bio"
                  rows={3}
                  maxLength={400}
                  defaultValue={profile.bio}
                  placeholder="Detail your years of trade experience, specializations, and guarantees..."
                  className="w-full rounded-xl border border-line bg-card p-3.5 text-sm text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors"
                />
              </Field>
            </div>

            <div className="sm:col-span-2 pt-2">
              <SubmitButton className={`${btn} h-11 px-6`}>
                Save Profile Changes
              </SubmitButton>
            </div>
          </form>
        </Card>
      </Section>
    </div>
  );
}
