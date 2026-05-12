"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { MobileNav } from "@/components/mobile-nav";
import { MobileStatusBar } from "@/components/mobile-status-bar";
import { Sidebar } from "@/components/sidebar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isSidebarWide, setIsSidebarWide] = useState(false);
  const ToggleIcon = isSidebarWide ? ChevronLeft : ChevronRight;
  const sidebarOffset = isSidebarWide ? "14rem" : "5rem";

  return (
    <div
      className="h-full relative overflow-x-clip"
      style={{ "--sidebar-offset": sidebarOffset } as CSSProperties}
    >
      <aside
        className={cn(
          "hidden h-full md:flex md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900 transition-[width] duration-300 ease-in-out overflow-visible",
          isSidebarWide ? "md:w-56" : "md:w-20"
        )}
      >
        <div className="h-full overflow-hidden">
          <Sidebar expanded={isSidebarWide} />
        </div>
        <button
          type="button"
          aria-label={isSidebarWide ? "사이드바 접기" : "사이드바 펼치기"}
          aria-pressed={isSidebarWide}
          onClick={() => setIsSidebarWide((current) => !current)}
          className="absolute left-full top-1/2 z-[90] flex h-[129px] w-9 -translate-y-1/2 flex-col items-center justify-center gap-2 rounded-r-lg border border-l-0 border-[#7bd800] bg-[#96ef00] text-black shadow-[4px_3px_8px_rgba(15,23,42,0.32),1px_0_2px_rgba(15,23,42,0.18),inset_-1px_-1px_0_rgba(0,0,0,0.1),inset_1px_1px_0_rgba(255,255,255,0.28)] transition-colors hover:bg-[#8be300] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#96ef00]/35"
        >
          <ToggleIcon className="h-3.5 w-3.5 stroke-[3]" aria-hidden="true" />
          <span
            className={cn(
              "inline-block text-[12px] font-black uppercase leading-none tracking-[0.14em] text-black [-webkit-text-stroke:0.35px_currentColor] [font-weight:1000] [text-shadow:0_0_0.35px_currentColor,0_1px_0_rgba(255,255,255,0.18)]",
              isSidebarWide && "rotate-180"
            )}
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
          >
            {isSidebarWide ? "WIDE" : "SIDEBAR"}
          </span>
        </button>
      </aside>
      <main
        className={cn(
          "transition-[padding-left] duration-300 ease-in-out pb-20 md:pb-0",
          isSidebarWide ? "md:pl-56" : "md:pl-20"
        )}
      >
        {children}
      </main>
      <MobileNav />
      <MobileStatusBar />
    </div>
  );
}
