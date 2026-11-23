import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { labourLabel, telLink } from "@/lib/constants";
import { hireLabour } from "@/actions/jobs";
import { submitReview } from "@/actions/reviews";
import { fileComplaint } from "@/actions/complaints";
import Nav from "@/components/Nav";
import { Avatar } from "@/components/cards";
import { TradeIcon } from "@/components/TradeIcon";
import ContactButtons, { InfoGrid } from "@/components/ContactButtons";
import Flash from "@/components/Flash";
import { Badge, Card, Empty, Field, ReviewCard, Section, StarPicker, StarRow, Stars, btn, btnDanger, inputCls } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { ArrowLeft, Phone, MapPin, Calendar, ShieldCheck, AlertTriangle, Send, CheckCircle2 } from "lucide-react";

export default async function LabourProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;
  const sp = await searchParams;

  const labour = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      phone: true,
      isLabour: true,
      isBanned: true,
      createdAt: true,
      labourProfile: true,
      reviewsReceived: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { author: { select: { name: true } }, job: { select: { title: true } } },
      },
    },
  });

  if (!labour || !labour.isLabour || !labour.labourProfile || (labour.isBanned && !me.isAdmin)) {
    notFound();
  }

  const profile = labour.labourProfile;
  const isMe = me.id === labour.id;

  // Check if current user has an unreviewed completed job with this specialist
  const unreviewedJob = !isMe
    ? await prisma.job.findFirst({
        where: {
          clientId: me.id,
          assignedLabourId: labour.id,
          status: "COMPLETED",
          review: null,
        },
        select: { id: true, title: true },
        orderBy: { createdAt: "desc" },
      })
    : null;

  // Check if current user has already submitted a review
  const myExistingReview = !isMe
    ? await prisma.review.findFirst({
        where: {
          authorId: me.id,
          targetUserId: labour.id,
        },
        include: { job: { select: { title: true } } },
      })
    : null;

  return (
    <>
      <Nav user={me} />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-mute hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>

        <Flash error={sp.error} ok={sp.ok} />

        {/* Profile Overview Card */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <Avatar name={labour.name} src={profile.imageUrl} size="h-20 w-20 sm:h-24 sm:w-24" text="text-2xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink font-display">
                  {labour.name}
                </h1>
                <ShieldCheck className="h-5 w-5 text-good" strokeWidth={2} />
                <Badge tone="brand">
                  <TradeIcon trade={profile.labourType} className="h-3.5 w-3.5" />
                  <span>{labourLabel(profile.labourType)}</span>
                </Badge>
                {labour.isBanned && (
                  <Badge tone="bad">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Suspended</span>
                  </Badge>
                )}
              </div>

              <div className="pt-0.5">
                <Stars rating={profile.rating} count={profile.ratingCount} size="md" />
              </div>

              {profile.bio && (
                <p className="text-sm leading-relaxed text-mute pt-1 max-w-2xl">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-line pt-5 space-y-4">
            <InfoGrid
              items={[
                {
                  icon: Phone,
                  label: "Phone Contact",
                  value: labour.phone ? (
                    <a href={telLink(labour.phone)} className="text-accent hover:underline font-mono">
                      {labour.phone}
                    </a>
                  ) : (
                    "Not provided"
                  ),
                },
                {
                  icon: MapPin,
                  label: "Operating Area",
                  value: profile.area || "Area not specified",
                },
                {
                  icon: Calendar,
                  label: "Verified Member Since",
                  value: (
                    <span className="font-mono tabular-nums">
                      {labour.createdAt.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                    </span>
                  ),
                },
              ]}
            />
            <ContactButtons phone={labour.phone} />
          </div>
        </Card>

        {/* Direct Hire Request Form */}
        {!isMe && me.isUser && !labour.isBanned && (
          <Section
            title={`Direct Hire Request: ${labour.name.split(" ")[0]}`}
            hint="Submit your project requirements and target compensation. The specialist will review and accept or propose terms."
          >
            <Card className="p-6">
              <form action={hireLabour} className="grid gap-4 sm:grid-cols-2">
                <input type="hidden" name="labourId" value={labour.id} />

                <div className="sm:col-span-1">
                  <Field label="Project Scope / Title">
                    <input
                      name="title"
                      required
                      placeholder="e.g., Bathroom pipe fitting & valve repair"
                      className={inputCls}
                    />
                  </Field>
                </div>

                <div className="sm:col-span-1">
                  <Field label="Target Compensation (Rs)">
                    <input
                      name="budget"
                      type="number"
                      min="1"
                      step="any"
                      required
                      placeholder="e.g., 2500"
                      className={`${inputCls} font-mono`}
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field label="Work Description & Requirements">
                    <textarea
                      name="description"
                      required
                      rows={3}
                      placeholder="Specify the problem, required materials, and site accessibility..."
                      className="w-full rounded-xl border border-line bg-card p-3.5 text-sm text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors"
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field label="Job Site Location / Address">
                    <input
                      name="location"
                      defaultValue={me.address}
                      required
                      placeholder="House/Street address, neighborhood"
                      className={inputCls}
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2 pt-2">
                  <SubmitButton className={`${btn} h-11 px-6`}>
                    <Send className="h-4 w-4" />
                    <span>Transmit Hire Request</span>
                  </SubmitButton>
                </div>
              </form>
            </Card>
          </Section>
        )}

        {/* Verified Reviews Section */}
        <Section title="Verified Client Reviews" count={labour.reviewsReceived.length}>
          {/* Active Review Form if the client has an eligible completed job */}
          {unreviewedJob && (
            <div className="mb-6 rounded-2xl border border-accent/40 bg-accent-soft/20 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink font-display">Rate Your Completed Project</h3>
                  <p className="text-xs text-mute mt-0.5">
                    Completed contract: <span className="font-semibold text-ink">&ldquo;{unreviewedJob.title}&rdquo;</span>
                  </p>
                </div>
                <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-bold text-accent font-mono">
                  Verified Client
                </span>
              </div>

              <form action={submitReview} className="space-y-3">
                <input type="hidden" name="jobId" value={unreviewedJob.id} />
                <StarPicker idPrefix={`profile-job-${unreviewedJob.id}`} label="Select Star Rating" />
                <Field label="Client Review / Feedback">
                  <textarea
                    name="comment"
                    rows={2}
                    placeholder="Detail the quality of workmanship, communication, and reliability..."
                    className="w-full rounded-xl border border-line bg-card p-3 text-sm text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors"
                  />
                </Field>
                <SubmitButton className={`${btn} h-10 px-5 text-xs font-semibold`}>
                  Submit Verified Review
                </SubmitButton>
              </form>
            </div>
          )}

          {/* User's existing review confirmation */}
          {myExistingReview && (
            <div className="mb-4 rounded-xl border border-good/25 bg-good-soft/30 p-3.5 text-xs text-good flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-good" />
                <span>
                  You submitted a verified review (<strong>★ {myExistingReview.rating}/5</strong>) for project &ldquo;{myExistingReview.job.title}&rdquo;.
                </span>
              </div>
            </div>
          )}

          {/* Verified review policy for non-clients */}
          {!unreviewedJob && !myExistingReview && !isMe && (
            <div className="mb-4 rounded-xl border border-line bg-elevated/40 p-3.5 text-xs text-mute flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <p>
                <strong className="text-ink">Verified Reviews:</strong> Reviews can be submitted once a hired contract with this specialist is completed.
              </p>
              <a href="#hire-form" className="shrink-0 font-semibold text-accent hover:underline">
                Request Direct Hire &rarr;
              </a>
            </div>
          )}

          {labour.reviewsReceived.length === 0 ? (
            <Empty title="No completed job reviews yet">
              Reviews will appear here once the specialist completes assigned direct contracts or bidding projects.
            </Empty>
          ) : (
            <div className="space-y-3">
              {labour.reviewsReceived.map((r) => (
                <ReviewCard
                  key={r.id}
                  rating={r.rating}
                  author={r.author.name}
                  context={r.job.title}
                  comment={r.comment}
                  date={r.createdAt}
                />
              ))}
            </div>
          )}
        </Section>

        {/* Dispute / Complaint Form */}
        {!isMe && (
          <Section title="Dispute Resolution / File Incident Report">
            <Card className="p-6">
              <form action={fileComplaint} className="space-y-4">
                <input type="hidden" name="targetUserId" value={labour.id} />
                <Field
                  label="Incident Details"
                  hint="Reports are reviewed by platform administration. Minimum 10 characters."
                >
                  <textarea
                    name="reason"
                    required
                    minLength={10}
                    rows={3}
                    placeholder="Provide details regarding incomplete delivery, breach of agreement, or misconduct..."
                    className="w-full rounded-xl border border-line bg-card p-3.5 text-sm text-ink placeholder:text-mute focus:border-bad focus:outline-none focus:ring-2 focus:ring-bad/20 transition-colors"
                  />
                </Field>
                <SubmitButton className={btnDanger}>
                  Submit Report to Admin
                </SubmitButton>
              </form>
            </Card>
          </Section>
        )}
      </main>
    </>
  );
}
