"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cpu,
  LayoutDashboard,
  Play,
  BookOpen,
  Settings,
  ChevronLeft,
  LogOut,
  Github,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/simulation", icon: Play, label: "Simulator" },
  { href: "/simulation?mode=learn", icon: BookOpen, label: "Examples" },
];

export function SimulatorShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-void overflow-hidden">
      {/* Sidebar */}
      <aside
        className="flex flex-col shrink-0 border-r border-white/5 transition-all duration-200"
        style={{ width: collapsed ? 52 : 180 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-3 py-4 border-b border-white/5">
          <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
            <Cpu size={14} className="text-accent" />
          </div>
          {!collapsed && (
            <span className="font-display font-semibold text-white text-sm tracking-tight">
              PipelineViz
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 flex flex-col gap-0.5 px-1.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "?");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-all ${
                  active
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/4"
                }`}
              >
                <item.icon size={15} className="shrink-0" />
                {!collapsed && (
                  <span className="font-medium truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-1.5 pb-3 flex flex-col gap-0.5 border-t border-white/5 pt-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/4 transition-all text-sm"
          >
            <Github size={15} className="shrink-0" />
            {!collapsed && <span>GitHub</span>}
          </a>
          <Link
            href="/simulation?settings=1"
            className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/4 transition-all text-sm"
          >
            <Settings size={15} className="shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/4 transition-all text-sm w-full"
          >
            <ChevronLeft
              size={15}
              className={`shrink-0 transition-transform ${collapsed ? "rotate-180" : ""}`}
            />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 font-mono">
              5-Stage MIPS Pipeline Simulator
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span className="text-xs text-gray-700 font-mono">v0.1.0</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-gray-600 font-mono">READY</span>
            </div>
            <Link
              href="/auth"
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-300 transition-colors"
            >
              <LogOut size={12} />
              Sign out
            </Link>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
      </main>
    </div>
  );
}
