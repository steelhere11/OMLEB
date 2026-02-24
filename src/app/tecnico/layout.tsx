import type { ReactNode } from "react";
import { BottomTabBar } from "@/components/tecnico/bottom-tab-bar";

export default function TecnicoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-tech-bg">
      {/* Top header */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center border-b border-gray-200 bg-white px-4">
        <span className="text-lg font-bold text-gray-900">OMLEB</span>
      </header>

      {/* Main content: offset by header (top) and tab bar (bottom) */}
      <main className="pb-20 pt-14">
        <div className="p-4">{children}</div>
      </main>

      <BottomTabBar />
    </div>
  );
}
