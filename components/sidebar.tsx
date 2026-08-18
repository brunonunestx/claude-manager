"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, LayoutDashboard, Users, Plus } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agents", label: "Agentes", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-1/2 left-4 z-40 flex w-16 -translate-y-1/2 flex-col items-center gap-2 rounded-2xl border border-neutral-800 bg-neutral-900/80 py-4 backdrop-blur-sm">
      <Link
        href="/"
        title="Claude Manager"
        className="mb-2 flex size-10 items-center justify-center rounded-xl bg-neutral-800 text-orange-500"
      >
        <Bot className="size-5" />
      </Link>

      <nav className="flex flex-col items-center gap-1.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-label={label}
              className={`flex size-10 items-center justify-center rounded-xl transition-colors ${
                active
                  ? "bg-orange-600 text-white"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
              }`}
            >
              <Icon className="size-4" />
            </Link>
          );
        })}
      </nav>

      <div className="my-1 h-px w-8 bg-neutral-800" />

      <Link
        href="/tasks/new"
        title="Nova tarefa"
        aria-label="Nova tarefa"
        className="flex size-10 items-center justify-center rounded-xl bg-orange-600 text-white hover:bg-orange-500"
      >
        <Plus className="size-5" />
      </Link>
    </aside>
  );
}
