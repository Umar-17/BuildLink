import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { logoutUser } from "@/actions/auth";
import BottomTabs from "@/components/BottomTabs";
import ThemeToggle from "@/components/ThemeToggle";
import { Wrench, Bell } from "lucide-react";

type NavUser = { id: string; name: string; isAdmin: boolean } | null;

export default async function Nav({ user, skeleton = false }: { user: NavUser; skeleton?: boolean }) {
  const unread = user ? await prisma.notification.count({ where: { userId: user.id, read: false } }) : 0;
  const linkCls =
    "rounded-xl px-3.5 py-2 text-sm font-medium text-mute transition-colors hover:bg-elevated hover:text-ink";

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Logo / Brand Mark (Positioned to the left) */}
          <div className="flex items-center shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span
                className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white shadow-xs transition-transform group-hover:scale-105"
                aria-hidden
              >
                <Wrench className="h-4.5 w-4.5 text-brand-foreground -rotate-12" strokeWidth={2} />
              </span>
              <span className="text-lg font-bold tracking-tight text-ink font-display">
                Build<span className="text-accent">Link</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links (Centered) */}
          <nav aria-label="Primary" className="hidden md:flex items-center justify-center gap-1 flex-1">
            <Link href="/" className={linkCls}>
              Home
            </Link>
            <Link href="/explore" className={linkCls}>
              Explore
            </Link>
            {user && (
              <Link href="/dashboard" className={linkCls}>
                Dashboard
              </Link>
            )}
            {user?.isAdmin && (
              <Link href="/admin" className={linkCls}>
                Admin
              </Link>
            )}
            {user && (
              <Link href="/notifications" className={`${linkCls} relative inline-flex items-center gap-1.5`}>
                <Bell className="h-4 w-4" strokeWidth={1.75} />
                <span>Alerts</span>
                {unread > 0 && (
                  <span className="ml-1 rounded-full bg-accent px-1.5 py-0.2 text-[11px] font-bold text-white font-mono tabular-nums leading-tight">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            )}
          </nav>

          {/* Right Area: Standout Auth Actions + Far Right Dark Mode Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-2.5">
                <span
                  className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-xs font-bold text-brand border border-brand/20 font-mono"
                  title={user.name}
                  aria-hidden
                >
                  {user.name.trim().charAt(0).toUpperCase()}
                </span>
                <form action={logoutUser}>
                  <button className="rounded-xl border border-line bg-card hover:border-bad/40 hover:bg-bad-soft hover:text-bad px-3.5 py-1.5 text-xs font-bold text-ink/80 transition-all shadow-xs active:scale-[0.98]">
                    Sign out
                  </button>
                </form>
              </div>
            ) : !skeleton ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth"
                  className="rounded-xl border border-line bg-card hover:border-accent hover:text-accent px-3.5 py-1.5 text-xs font-bold text-ink shadow-xs transition-all hidden sm:inline-flex"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth"
                  className="rounded-xl bg-accent hover:bg-accent-hover px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:shadow transition-all active:scale-[0.98]"
                >
                  Get started
                </Link>
              </div>
            ) : null}

            <div className="h-4 w-[1px] bg-line hidden sm:block" />

            {/* Dark mode button located at far right corner */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {!skeleton && <BottomTabs unread={unread} loggedIn={Boolean(user)} />}
    </>
  );
}
