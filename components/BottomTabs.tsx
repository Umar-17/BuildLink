"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, LayoutDashboard, Bell, LogIn } from "lucide-react";

/** Mobile app-style bottom navigation with clean monochrome vector icons. */
export default function BottomTabs({ unread, loggedIn }: { unread: number; loggedIn: boolean }) {
  const path = usePathname();

  const tabs = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      match: (p: string) => p === "/",
    },
    {
      href: "/explore",
      label: "Explore",
      icon: Compass,
      match: (p: string) => p.startsWith("/explore") || p.startsWith("/labour") || p.startsWith("/shop"),
    },
    loggedIn
      ? {
          href: "/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          match: (p: string) => p.startsWith("/dashboard"),
        }
      : {
          href: "/auth",
          label: "Sign in",
          icon: LogIn,
          match: (p: string) => p.startsWith("/auth"),
        },
    ...(loggedIn
      ? [
          {
            href: "/notifications",
            label: "Alerts",
            icon: Bell,
            match: (p: string) => p.startsWith("/notifications"),
          },
        ]
      : []),
  ];

  return (
    <nav aria-label="Mobile Navigation" className="bottom-tabs fixed inset-x-3 bottom-3 z-30 md:hidden">
      <ul className="flex items-center justify-around rounded-2xl border border-line bg-card/95 px-2 py-1.5 shadow-lg backdrop-blur-lg">
        {tabs.map((t) => {
          const on = t.match(path);
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={`relative flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors ${
                  on ? "text-accent bg-accent-soft font-semibold" : "text-mute hover:text-ink"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={on ? 2 : 1.75} />
                <span>{t.label}</span>
                {t.label === "Alerts" && unread > 0 && (
                  <span className="absolute right-[24%] top-1 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] font-bold leading-4 text-white font-mono tabular-nums">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
