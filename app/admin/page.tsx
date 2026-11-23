import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { dismissComplaint, toggleBanUser } from "@/actions/admin";
import { labourLabel } from "@/lib/constants";
import Nav from "@/components/Nav";
import Link from "next/link";
import { Badge, Card, Empty, Section, btn, btnDanger, btnGhost } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import {
  Shield,
  AlertTriangle,
  Users,
  Wrench,
  Store,
  CheckCircle2,
  XCircle,
  LayoutDashboard,
} from "lucide-react";

export const metadata = { title: "Admin Moderation Desk · BuildLink" };

export default async function AdminPage() {
  const admin = await requireAdmin();

  const [users, complaints, completedJobsCount] = await Promise.all([
    prisma.user.findMany({
      include: { labourProfile: true, _count: { select: { complaintsAgainst: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.complaint.findMany({
      include: { reporter: true, targetUser: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.job.count({ where: { status: "COMPLETED" } }),
  ]);

  const specialistCount = users.filter((u) => u.isLabour).length;
  const storeCount = users.filter((u) => u.isShopOwner).length;
  const bannedCount = users.filter((u) => u.isBanned).length;

  return (
    <>
      <Nav user={admin} />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        {/* Desk Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge tone="brand">
                <Shield className="h-3.5 w-3.5" />
                <span>Security &amp; Moderation Desk</span>
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink font-display">
              Administrative Control Console
            </h1>
            <p className="text-xs sm:text-sm text-mute">
              Monitor network integrity, investigate flagged complaints, and enforce account suspensions.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-4 py-2 text-xs font-semibold text-ink shadow-xs hover:border-line-hover transition-colors"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Customer Dashboard</span>
          </Link>
        </div>

        {/* Executive KPI Summary Cards */}
        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-5">
          <div className="rounded-xl border border-line bg-card p-4 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between text-mute">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Total Accounts</span>
              <Users className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <p className="text-2xl font-extrabold text-ink font-mono tabular-nums">{users.length}</p>
          </div>

          <div className="rounded-xl border border-line bg-card p-4 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between text-mute">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Specialists</span>
              <Wrench className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <p className="text-2xl font-extrabold text-brand font-mono tabular-nums">{specialistCount}</p>
          </div>

          <div className="rounded-xl border border-line bg-card p-4 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between text-mute">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Supply Stores</span>
              <Store className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <p className="text-2xl font-extrabold text-ink font-mono tabular-nums">{storeCount}</p>
          </div>

          <div className="rounded-xl border border-line bg-card p-4 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between text-mute">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Completed Jobs</span>
              <CheckCircle2 className="h-4 w-4 text-good" strokeWidth={1.75} />
            </div>
            <p className="text-2xl font-extrabold text-good font-mono tabular-nums">{completedJobsCount}</p>
          </div>

          <div className="rounded-xl border border-line bg-card p-4 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between text-mute">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Flagged Incidents</span>
              <AlertTriangle className="h-4 w-4 text-bad" strokeWidth={1.75} />
            </div>
            <p className="text-2xl font-extrabold text-bad font-mono tabular-nums">{complaints.length}</p>
          </div>
        </div>

        {/* Flagged Complaints Section */}
        <Section
          title="Flagged Misconduct &amp; Dispute Reports"
          hint="Incidents reported by clients or specialists requiring moderation action."
          count={complaints.length}
        >
          {complaints.length === 0 ? (
            <Empty title="No open dispute complaints">
              The moderation queue is clear. No incidents currently require review.
            </Empty>
          ) : (
            <div className="space-y-3">
              {complaints.map((c) => (
                <Card
                  key={c.id}
                  className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between p-5 border-l-4 border-l-bad"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-ink">{c.reporter.name}</span>
                      <span className="text-mute">reported</span>
                      <span className="font-bold text-ink">{c.targetUser.name}</span>
                      <span className="font-mono text-mute text-[11px]">({c.targetUser.email})</span>
                      {c.targetUser.isBanned && (
                        <Badge tone="bad" dot>
                          Account Suspended
                        </Badge>
                      )}
                    </div>

                    <p className="rounded-lg border border-bad/20 bg-bad-soft/40 p-2.5 text-xs text-bad leading-relaxed">
                      <strong className="block text-[10px] uppercase tracking-wider">Report Reason:</strong>
                      <span>{c.reason}</span>
                    </p>

                    <p className="text-[11px] text-mute font-mono tabular-nums">
                      Logged on: {c.createdAt.toLocaleString("en-GB")}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-line">
                    {!c.targetUser.isBanned && !c.targetUser.isAdmin && (
                      <form action={toggleBanUser.bind(null, c.targetUser.id, true)}>
                        <SubmitButton className={`${btnDanger} h-9 px-4 text-xs`}>
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Suspend Account</span>
                        </SubmitButton>
                      </form>
                    )}
                    <form action={dismissComplaint.bind(null, c.id)}>
                      <SubmitButton className={`${btnGhost} h-9 px-4 text-xs`}>
                        Dismiss Report
                      </SubmitButton>
                    </form>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Section>

        {/* Global Accounts Directory Section */}
        <Section
          title="Network Accounts Directory"
          hint="Inspect registered members, assigned trade roles, and enforce account standing."
          count={users.length}
        >
          <div className="space-y-2.5">
            {users.map((u) => {
              const roles = [
                u.isUser && "Customer",
                u.isLabour && `Specialist (${u.labourProfile ? labourLabel(u.labourProfile.labourType) : "Unassigned"})`,
                u.isShopOwner && "Store Owner",
                u.isRider && "Courier",
                u.isAdmin && "System Admin",
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <Card
                  key={u.id}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-sm text-ink">{u.name}</p>
                      <span className="font-mono text-xs text-mute font-normal">({u.email})</span>
                      {u.isBanned ? (
                        <Badge tone="bad" dot>
                          Suspended
                        </Badge>
                      ) : (
                        <Badge tone="good" dot>
                          Active Standing
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-mute">
                      <span>Assigned: {roles}</span>
                      {u._count.complaintsAgainst > 0 && (
                        <span className="text-bad font-semibold ml-2 font-mono tabular-nums">
                          ({u._count.complaintsAgainst} filed complaint{u._count.complaintsAgainst === 1 ? "" : "s"})
                        </span>
                      )}
                    </p>
                  </div>

                  {!u.isAdmin && (
                    <div className="shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-line">
                      <form action={toggleBanUser.bind(null, u.id, !u.isBanned)}>
                        <SubmitButton
                          className={
                            u.isBanned
                              ? `${btn} h-8 px-3.5 text-xs`
                              : `${btnDanger} h-8 px-3.5 text-xs`
                          }
                        >
                          {u.isBanned ? "Reinstate Account" : "Suspend Account"}
                        </SubmitButton>
                      </form>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </Section>
      </main>
    </>
  );
}
