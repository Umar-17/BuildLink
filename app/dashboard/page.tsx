import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import Nav from "@/components/Nav";
import Flash from "@/components/Flash";
import UserView from "@/components/views/UserView";
import LabourView from "@/components/views/LabourView";
import ShopView from "@/components/views/ShopView";
import RiderView from "@/components/views/RiderView";
import { User, Wrench, Store, Bike } from "lucide-react";

type SP = Promise<{ view?: string; q?: string; type?: string; error?: string; ok?: string }>;

export const metadata = { title: "Dashboard · BuildLink" };

export default async function DashboardPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const sp = await searchParams;

  const views = [
    user.isUser && { key: "user", label: "Customer Portal", icon: User },
    user.isLabour && user.labourProfile && { key: "labour", label: "Specialist Workspace", icon: Wrench },
    user.isShopOwner && { key: "shop", label: "Supply Store Manager", icon: Store },
    user.isRider && { key: "rider", label: "Delivery Courier", icon: Bike },
  ].filter(Boolean) as { key: string; label: string; icon: typeof User }[];

  if (views.length === 0) redirect(user.isAdmin ? "/admin" : "/auth");
  const current = views.find((v) => v.key === sp.view)?.key ?? views[0].key;

  return (
    <>
      <Nav user={user} />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        {/* Header with Title & Role Switcher */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink font-display">
              Welcome, {user.name.split(" ")[0]}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-mute">
              Manage contracts, project bids, store operations, and dispatch queues.
            </p>
          </div>

          {/* Segmented Role Switcher Pill Bar */}
          {views.length > 1 && (
            <nav
              aria-label="Switch workspace role"
              className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-line bg-card p-1.5 shadow-xs"
            >
              {views.map((v) => {
                const active = v.key === current;
                const Icon = v.icon;
                return (
                  <Link
                    key={v.key}
                    href={`/dashboard?view=${v.key}`}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                      active
                        ? "bg-accent text-white shadow-xs"
                        : "text-mute hover:bg-elevated hover:text-ink"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2 : 1.75} />
                    <span>{v.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <Flash error={sp.error} ok={sp.ok} />

        {/* Dynamic View Panel */}
        <div className="space-y-8">
          {current === "user" && <UserView userId={user.id} address={user.address} />}
          {current === "labour" && user.labourProfile && (
            <LabourView userId={user.id} profile={user.labourProfile} />
          )}
          {current === "shop" && <ShopView shop={user.shop} userAddress={user.address} />}
          {current === "rider" && <RiderView userId={user.id} />}
        </div>
      </main>
    </>
  );
}
