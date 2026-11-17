"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  Clock,
  LayoutGrid,
  LogOut,
  Menu,
  Settings,
  X,
} from "lucide-react";
import { AttendMark } from "@/components/brand/attend-mark";
import { signOutAction } from "@/app/auth/actions";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/classes", label: "Classes", icon: BookOpen },
  { href: "/sessions", label: "Sessions", icon: Clock },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function LecturerMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-on-surface hover:bg-surface-container md:hidden"
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-[80] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-on-surface/40"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute top-0 left-0 flex h-full w-72 max-w-[85vw] flex-col bg-surface-container-lowest shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-surface-container-high px-4">
              <div className="flex items-center gap-2">
                <AttendMark />
                <span className="font-title-lg text-title-lg font-bold text-primary">Attend Pal</span>
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-on-surface"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
              {LINKS.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-4 py-2.5 font-label-md text-label-md font-semibold ${
                      active
                        ? "bg-primary-container text-on-primary"
                        : "text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <form action={signOutAction} className="border-t border-surface-container-high p-4">
              <button
                type="submit"
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-2.5 font-label-md text-label-md font-semibold text-error"
              >
                <LogOut className="h-5 w-5" />
                Sign out
              </button>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}
