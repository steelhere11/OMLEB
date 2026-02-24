import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fallbacks -- proxy middleware ensures user exists on /admin routes,
  // but TypeScript needs safe defaults for the component props.
  const nombre = (user?.user_metadata?.nombre as string) ?? "Admin";
  const email = user?.email ?? "";

  return (
    <div className="min-h-dvh bg-admin-bg">
      <Sidebar userName={nombre} userEmail={email} />

      {/* Main content: offset by sidebar on desktop, by top bar on mobile */}
      <main className="min-h-dvh pt-14 md:pl-64 md:pt-0">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
