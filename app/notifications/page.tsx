import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { markAllNotificationsRead } from "@/actions/notifications";
import Nav from "@/components/Nav";
import { Card, Empty, btnGhost } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { Bell, CheckCheck, ArrowRight } from "lucide-react";

export const metadata = { title: "Notifications & Alerts · BuildLink" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <>
      <Nav user={user} />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
              <Bell className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink font-display">
                Alerts &amp; Notifications
              </h1>
              <p className="text-xs text-mute font-mono tabular-nums">
                {unreadCount} unread alert{unreadCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <form action={markAllNotificationsRead}>
              <SubmitButton className={`${btnGhost} h-9 px-3.5 text-xs`}>
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all as read</span>
              </SubmitButton>
            </form>
          )}
        </div>

        {items.length === 0 ? (
          <Empty title="Your inbox is clear">
            Notifications regarding your project requests, specialist bids, and order dispatches will appear here.
          </Empty>
        ) : (
          <div className="space-y-2.5">
            {items.map((n) => (
              <Card
                key={n.id}
                className={`p-4 transition-all hover:border-line-hover ${
                  n.read ? "bg-card" : "border-accent/30 bg-accent-soft/20 shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 min-w-0 flex-1">
                    <Link
                      href={n.href}
                      className="font-medium text-ink hover:text-accent transition-colors block text-sm"
                    >
                      {n.message}
                    </Link>
                    <p className="text-[11px] text-mute font-mono tabular-nums">
                      {n.createdAt.toLocaleString("en-GB")}
                    </p>
                  </div>
                  <Link
                    href={n.href}
                    className="shrink-0 rounded-lg p-2 text-mute hover:text-accent hover:bg-card transition-colors"
                    aria-label="View alert destination"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
