import type { ReactNode } from "react";

// Minimal layout for /login -- prevents any parent layout (e.g. tecnico)
// from wrapping the login page. Just renders children directly.
export default function LoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
