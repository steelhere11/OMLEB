import type { ReactNode } from "react";

// Minimal layout for /admin/login -- prevents admin sidebar/nav layout
// from wrapping the login page. Just renders children directly.
export default function AdminLoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
