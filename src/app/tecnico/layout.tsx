import type { ReactNode } from "react";
import { BottomTabBar } from "@/components/tecnico/bottom-tab-bar";
import { OfflineBannerController } from "@/components/shared/offline-status-wrapper";

export default function TecnicoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-tech-bg">
      {/* Top header */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center border-b border-tech-border bg-tech-surface px-4">
        <img src="/logo.png" alt="OMLEB" className="h-8 w-auto" />
      </header>

      {/* Offline banner (below header, pushes content down when visible) */}
      <div className="fixed inset-x-0 top-14 z-30">
        <OfflineBannerController />
      </div>

      {/* Main content: offset by header (top) and tab bar (bottom) */}
      <main className="pb-20 pt-14">
        <div className="p-4">{children}</div>
      </main>

      <BottomTabBar />
    </div>
  );
}
