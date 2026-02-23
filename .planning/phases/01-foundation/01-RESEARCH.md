# Phase 1: Foundation - Research

**Researched:** 2026-02-23
**Domain:** Next.js 16 + Supabase Auth + PWA + Tailwind CSS v4
**Confidence:** HIGH

## Summary

Phase 1 covers four domains: project scaffolding (Next.js 16 + Tailwind CSS v4), authentication (Supabase Auth SSR with role-based routing), PWA setup (Serwist for service worker + manifest), and database schema with RLS policies. The technology landscape has shifted significantly from what CLAUDE.md assumed -- Next.js is now at v16 (not 15), Tailwind CSS is at v4 (CSS-first config, no tailwind.config.js), and Supabase has renamed its API keys from "anon"/"service_role" to "publishable"/"secret" format.

The core stack is well-documented and production-proven. The main integration concern is Serwist's requirement for Webpack in production builds while Next.js 16 defaults to Turbopack -- this is solvable with a `--webpack` flag on `next build`. The auth architecture uses `@supabase/ssr` with a proxy file (Next.js 16 renamed `middleware.ts` to `proxy.ts`) that refreshes tokens on every request and enables role-based redirects.

**Primary recommendation:** Use Next.js 16 (latest), Tailwind CSS v4, `@supabase/ssr` with the new `proxy.ts` convention, and Serwist for PWA. Build auth around `app_metadata` custom claims for role-based routing (admin/tecnico/ayudante) checked in the proxy, with SECURITY DEFINER helper functions for RLS policies from day one.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.x | App framework (App Router) | Latest stable; Turbopack default, React 19.2, async APIs |
| react / react-dom | 19.2.x | UI library | Bundled with Next.js 16; View Transitions, Activity API |
| @supabase/supabase-js | 2.x | Supabase client | Official JS client for database, auth, storage |
| @supabase/ssr | 0.5.x | SSR auth helpers | Cookie-based auth for Next.js server components; replaces deprecated @supabase/auth-helpers |
| tailwindcss | 4.2.x | Utility-first CSS | CSS-first config, 5x faster builds, no tailwind.config.js needed |
| @tailwindcss/postcss | 4.x | PostCSS integration | Required for Next.js integration with Tailwind v4 |
| @serwist/next | 9.x | PWA service worker | Successor to next-pwa; precaching, runtime caching, offline fallback |
| serwist | 9.x | Service worker core | Core library for Serwist service worker |
| typescript | 5.x+ | Type safety | Required by Next.js 16 (minimum 5.1.0) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| postcss | 8.x | CSS processing | Required by @tailwindcss/postcss |
| @types/react | latest | React types | TypeScript support |
| @types/react-dom | latest | React DOM types | TypeScript support |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Serwist | Manual service worker (Next.js official guide) | Manual gives full control but no precaching automation; Serwist handles precaching manifest generation |
| @tailwindcss/postcss | @tailwindcss/vite | Vite plugin is faster but Next.js uses PostCSS pipeline, not Vite |
| proxy.ts (Next.js 16) | middleware.ts (legacy) | middleware.ts still works in Next.js 16 but is deprecated; use proxy.ts for forward compatibility |

**Installation:**
```bash
npx create-next-app@latest omleb-hvac --typescript --tailwind --app --src-dir
npm install @supabase/supabase-js @supabase/ssr
npm install @serwist/next
npm install -D serwist postcss @tailwindcss/postcss
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── layout.tsx              # Root layout (metadata, viewport, PWA meta)
│   ├── page.tsx                # Landing / redirect to login
│   ├── manifest.ts             # PWA manifest (Next.js file convention)
│   ├── sw.ts                   # Serwist service worker source
│   ├── ~offline/
│   │   └── page.tsx            # Offline fallback page
│   ├── login/
│   │   └── page.tsx            # Technician login (branded, mobile-first)
│   ├── admin/
│   │   ├── login/
│   │   │   └── page.tsx        # Admin login (dark mode)
│   │   ├── layout.tsx          # Admin shell (sidebar nav, dark mode)
│   │   ├── page.tsx            # Admin dashboard landing
│   │   ├── clientes/
│   │   ├── sucursales/
│   │   ├── equipos/
│   │   ├── folios/
│   │   ├── usuarios/
│   │   └── reportes/
│   ├── tecnico/
│   │   ├── layout.tsx          # Technician shell (bottom tab bar, light mode)
│   │   ├── page.tsx            # Technician landing (folio list placeholder)
│   │   ├── folios/
│   │   └── perfil/
│   │       └── page.tsx        # Technician profile tab
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts        # Auth callback handler (PKCE flow)
│   └── actions/
│       └── auth.ts             # Server actions for login, signup, logout
├── components/
│   ├── ui/                     # Shared UI primitives (button, input, etc.)
│   ├── admin/                  # Admin-specific components
│   ├── tecnico/                # Technician-specific components
│   └── shared/                 # Cross-role components
├── lib/
│   └── supabase/
│       ├── client.ts           # Browser client (createBrowserClient)
│       ├── server.ts           # Server client (createServerClient with cookies)
│       ├── admin.ts            # Admin client (service role key, server-only)
│       └── proxy.ts            # updateSession helper for proxy.ts
├── types/
│   └── index.ts                # TypeScript types (database types)
proxy.ts                        # Root proxy (Next.js 16 convention, calls updateSession)
```

### Pattern 1: Supabase SSR Client Architecture (THREE clients)

**What:** Three distinct Supabase client factories for different execution contexts.
**When to use:** Always -- every Supabase call must use the correct client for its context.

```typescript
// src/lib/supabase/client.ts -- Browser Client (Client Components)
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

```typescript
// src/lib/supabase/server.ts -- Server Client (Server Components, Server Actions)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component -- safe to ignore
            // if proxy is refreshing sessions
          }
        },
      },
    }
  )
}
```

```typescript
// src/lib/supabase/admin.ts -- Admin Client (Server-only, bypasses RLS)
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
```

### Pattern 2: Proxy-Based Auth with Role Routing

**What:** The `proxy.ts` file (formerly middleware.ts) refreshes auth tokens and redirects based on user role.
**When to use:** On every request -- this is the auth backbone.

```typescript
// proxy.ts (root of project or src/ folder)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Use getUser() not getSession() for security
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Unauthenticated users: redirect to appropriate login
  if (!user) {
    if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    if (pathname.startsWith('/tecnico')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  // Authenticated users: role-based routing
  const role = user.app_metadata?.rol

  // Prevent technicians from accessing admin routes
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/tecnico', request.url))
  }

  // Prevent admins from accessing technician routes (optional)
  if (pathname.startsWith('/tecnico') && role === 'admin') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // Redirect authenticated users away from login pages
  if (pathname === '/login' || pathname === '/admin/login') {
    const redirectUrl = role === 'admin' ? '/admin' : '/tecnico'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Pattern 3: Admin Creates Users (Server Action + Service Role)

**What:** Admin creates technician accounts using `supabase.auth.admin.createUser()` with the service role key. No self-signup.
**When to use:** For the user management feature (AUTH-03).

```typescript
// src/app/actions/auth.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function createTechnicianAccount(formData: FormData) {
  const serverClient = await createClient()
  const { data: { user: currentUser } } = await serverClient.auth.getUser()

  // Verify caller is admin
  if (currentUser?.app_metadata?.rol !== 'admin') {
    return { error: 'No autorizado' }
  }

  const adminClient = createAdminClient()

  const { data, error } = await adminClient.auth.admin.createUser({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    email_confirm: true, // Skip email confirmation for admin-created accounts
    app_metadata: {
      rol: formData.get('rol') as string, // 'tecnico' or 'ayudante'
    },
    user_metadata: {
      nombre: formData.get('nombre') as string,
    },
  })

  if (error) return { error: error.message }

  // Also insert into public.users table
  const { error: dbError } = await adminClient
    .from('users')
    .insert({
      id: data.user.id,
      email: data.user.email,
      nombre: formData.get('nombre') as string,
      rol: formData.get('rol') as string,
    })

  if (dbError) return { error: dbError.message }
  return { success: true }
}
```

### Pattern 4: Database Trigger for User Profile Sync

**What:** A trigger on `auth.users` that auto-creates a row in `public.users` when a new user is created, pulling data from `raw_user_meta_data`.
**When to use:** As a safety net alongside the server action insert.

```sql
-- Trigger function to create public.users row on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, nombre, rol)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'nombre',
    COALESCE(NEW.raw_app_meta_data->>'rol', 'tecnico')
  )
  ON CONFLICT (id) DO NOTHING; -- Avoid duplicate if server action already inserted
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Anti-Patterns to Avoid

- **Using `getSession()` in server code for auth checks:** Always use `getUser()` which validates the token with Supabase Auth server. `getSession()` reads from cookies without validation and is insecure for authorization decisions.
- **Using `user_metadata` for roles:** `user_metadata` can be updated by the authenticated user via `supabase.auth.update()`. Roles MUST go in `app_metadata` which only the service role key can modify.
- **Creating Supabase client with `@supabase/auth-helpers`:** This package is deprecated. Use `@supabase/ssr` exclusively.
- **Using `middleware.ts` function name:** In Next.js 16, rename to `proxy.ts` with `export function proxy()`. The old convention is deprecated.
- **Direct function calls in RLS policies:** Always wrap `auth.uid()` and `auth.jwt()` in `(SELECT ...)` for performance (94%+ improvement in benchmarks).
- **Using `NEXT_PUBLIC_SUPABASE_ANON_KEY`:** Supabase has transitioned to "publishable key" naming. New projects use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. For existing projects, the anon key still works but update the naming convention.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth token refresh | Custom token refresh logic | `@supabase/ssr` + proxy.ts `updateSession` | Token refresh via cookies is tricky; the library handles edge cases (multiple tabs, expired tokens, PKCE flow) |
| Session cookies | Manual cookie management | `@supabase/ssr` createServerClient with cookie adapter | Cookie chunking, HttpOnly settings, SameSite policies are complex |
| Service worker precaching | Manual cache manifest | Serwist `__SW_MANIFEST` + `defaultCache` | Serwist auto-generates precache manifest from build output; manual is error-prone |
| PWA manifest | Static JSON file | Next.js `app/manifest.ts` file convention | TypeScript manifest with `MetadataRoute.Manifest` type gives type safety and dynamic capabilities |
| Role-based access in DB | Application-level checks only | RLS policies + SECURITY DEFINER functions | Defense in depth; DB-level enforcement prevents data leaks even if app code has bugs |
| User creation | Custom signup flow | `supabase.auth.admin.createUser()` | Handles password hashing, email confirmation bypass, metadata storage properly |
| Dark mode | Custom CSS variable system | Tailwind CSS v4 dark mode (`dark:` variant) | Built-in, well-tested, consistent across components |

**Key insight:** The Supabase SSR + Next.js auth pattern is well-documented but has specific cookie handling requirements. The `@supabase/ssr` package abstracts away the complex cookie chunking and refresh logic. Deviating from the official pattern leads to session bugs that are extremely hard to debug.

## Common Pitfalls

### Pitfall 1: Stale CLAUDE.md Technology Versions
**What goes wrong:** The CLAUDE.md references `next-pwa`, `tailwind.config.js`, `middleware.ts`, and `SUPABASE_ANON_KEY` -- all of which have been superseded or renamed.
**Why it happens:** CLAUDE.md was written before Next.js 16, Tailwind v4, and the Supabase key rename.
**How to avoid:** Follow THIS research document for current conventions. Update CLAUDE.md references during scaffold plan.
**Warning signs:** Import errors, deprecation warnings, build failures referencing old conventions.

### Pitfall 2: Turbopack + Serwist Build Conflict
**What goes wrong:** Next.js 16 defaults to Turbopack for `next build`. Serwist's `@serwist/next` plugin wraps the webpack config. Running `next build` without `--webpack` flag will fail or skip service worker generation.
**Why it happens:** Serwist's Next.js plugin uses webpack under the hood; Turbopack is the new default.
**How to avoid:** Set `"build": "next build --webpack"` in package.json. Development can still use Turbopack (`next dev` works fine since SW is disabled in dev).
**Warning signs:** No `sw.js` generated in public folder after build; "webpack configuration found" error.

### Pitfall 3: getSession() vs getUser() in Server Code
**What goes wrong:** Using `supabase.auth.getSession()` in server components or proxy for auth decisions. The session data comes from cookies without server-side validation and can be tampered with.
**Why it happens:** `getSession()` is simpler to call and returns more data. Many old tutorials use it.
**How to avoid:** ALWAYS use `supabase.auth.getUser()` in server code. It sends a request to Supabase Auth server to validate the token.
**Warning signs:** Auth working in development but failing security audit; users able to access restricted routes by modifying cookies.

### Pitfall 4: RLS Circular Dependencies
**What goes wrong:** Cross-table RLS policies cause "infinite recursion detected in policy" errors. For example: `folios` policy checks `folio_asignados`, which has a policy that checks `folios`.
**Why it happens:** PostgreSQL evaluates RLS policies recursively when tables reference each other.
**How to avoid:** Use SECURITY DEFINER helper functions in a private schema. These bypass RLS for the lookup query. Example: `private.get_user_folio_ids(user_id)` returns folio IDs without triggering RLS on `folio_asignados`.
**Warning signs:** Supabase dashboard query errors mentioning "infinite recursion"; queries hanging.

### Pitfall 5: Role Storage in user_metadata Instead of app_metadata
**What goes wrong:** Storing `rol` in `user_metadata` allows any authenticated user to change their own role via `supabase.auth.update({ data: { rol: 'admin' } })`.
**Why it happens:** `user_metadata` is the more commonly documented field. The security difference is subtle.
**How to avoid:** Store roles in `app_metadata` via `admin.createUser({ app_metadata: { rol: 'admin' } })`. Only the service role key can modify `app_metadata`.
**Warning signs:** Users able to escalate privileges; RLS policies based on `user_metadata` being bypassed.

### Pitfall 6: Supabase Env Variable Naming
**What goes wrong:** Using old env variable names (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) when Supabase now issues "publishable" keys for new projects.
**Why it happens:** CLAUDE.md and many tutorials use the old naming. Supabase has transitioned to new key format as of November 2025.
**How to avoid:** When creating the Supabase project, note which key format is provided. New projects get `sb_publishable_...` keys. Use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as the env variable name. If the project gives legacy JWT keys, the old naming still works.
**Warning signs:** 401 errors when connecting to Supabase; key format mismatch.

### Pitfall 7: Missing ON CONFLICT in User Trigger
**What goes wrong:** If both the server action AND the database trigger try to insert into `public.users`, the trigger fails with a unique constraint violation, which cascades and blocks the auth signup.
**Why it happens:** The `handle_new_user` trigger fires after `auth.users` insert; if the server action already inserted the public.users row, the trigger insert conflicts.
**How to avoid:** Add `ON CONFLICT (id) DO NOTHING` to the trigger function, or skip the trigger entirely and rely solely on the server action for admin-created users.
**Warning signs:** User creation fails silently; auth.users row exists but public.users row missing.

## Code Examples

### Tailwind CSS v4 Setup (No tailwind.config.js)

```css
/* src/app/globals.css */
@import "tailwindcss";

/* Custom theme variables for OMLEB */
@theme {
  /* Placeholder brand colors -- replace when logo provided */
  --color-brand-50: oklch(0.97 0.01 250);
  --color-brand-100: oklch(0.93 0.02 250);
  --color-brand-500: oklch(0.55 0.15 250);
  --color-brand-600: oklch(0.48 0.15 250);
  --color-brand-700: oklch(0.40 0.15 250);
  --color-brand-900: oklch(0.25 0.10 250);

  /* Admin dark theme surface colors */
  --color-admin-bg: oklch(0.15 0.01 250);
  --color-admin-surface: oklch(0.20 0.01 250);
  --color-admin-border: oklch(0.30 0.01 250);

  /* Technician light theme */
  --color-tech-bg: oklch(0.98 0 0);
  --color-tech-surface: oklch(1.0 0 0);
}
```

```javascript
// postcss.config.mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

### PWA Manifest (Next.js File Convention)

```typescript
// src/app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OMLEB',
    short_name: 'OMLEB',
    description: 'Reportes diarios de mantenimiento HVAC',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6', // Placeholder -- update with brand color
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
```

### Serwist Service Worker Setup

```typescript
// src/app/sw.ts
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [{
      url: "/~offline",
      matcher({ request }) {
        return request.destination === "document";
      },
    }],
  },
});

serwist.addEventListeners();
```

```typescript
// next.config.ts
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withSerwist(nextConfig);
```

### SECURITY DEFINER Helper Functions for RLS

```sql
-- Private schema for helper functions (not exposed via API)
CREATE SCHEMA IF NOT EXISTS private;

-- Helper: Get current user's role from app_metadata in JWT
CREATE OR REPLACE FUNCTION private.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'rol',
    'tecnico'
  );
$$;

-- Helper: Check if current user is admin
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'rol') = 'admin';
$$;

-- Helper: Get folio IDs assigned to current user (avoids circular RLS)
CREATE OR REPLACE FUNCTION private.get_my_folio_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT folio_id FROM public.folio_asignados
  WHERE usuario_id = (SELECT auth.uid());
$$;

-- Example RLS policies using helpers:

-- folios: admin sees all, technician sees assigned only
ALTER TABLE public.folios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_folios" ON public.folios
  FOR ALL TO authenticated
  USING ((SELECT private.is_admin()));

CREATE POLICY "tech_assigned_folios" ON public.folios
  FOR SELECT TO authenticated
  USING (id IN (SELECT private.get_my_folio_ids()));

-- reportes: admin sees all, technician sees own folio's reports
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_reportes" ON public.reportes
  FOR ALL TO authenticated
  USING ((SELECT private.is_admin()));

CREATE POLICY "tech_folio_reportes" ON public.reportes
  FOR ALL TO authenticated
  USING (folio_id IN (SELECT private.get_my_folio_ids()));
```

### Root Layout with PWA Metadata

```typescript
// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "OMLEB",
  title: { default: "OMLEB", template: "%s | OMLEB" },
  description: "Reportes diarios de mantenimiento HVAC",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OMLEB",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Prevent zoom on mobile form inputs
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` + `export function middleware()` | `proxy.ts` + `export function proxy()` | Next.js 16 (2025) | Must rename file and function; old convention deprecated |
| `tailwind.config.js` with `content` array | `@import "tailwindcss"` in CSS + `@theme` block | Tailwind v4 (Jan 2025) | No JS config file needed; all config in CSS |
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | Old package deprecated; new package uses `getAll`/`setAll` cookies only |
| `next-pwa` package | Serwist (`@serwist/next`) | 2024 | next-pwa unmaintained; Serwist is the official successor |
| Supabase `anon` key (`SUPABASE_ANON_KEY`) | Supabase publishable key (`SUPABASE_PUBLISHABLE_KEY`) | Nov 2025 | New projects get `sb_publishable_*` format; legacy keys still work |
| `next build` uses Webpack | `next build` uses Turbopack (default) | Next.js 16 | Serwist requires `--webpack` flag for build |
| `next lint` command | Direct ESLint CLI | Next.js 16 | `next lint` removed; configure ESLint separately |
| Sync `cookies()`, `headers()`, `params` | Async `cookies()`, `headers()`, `params` | Next.js 15->16 | All request APIs must be awaited |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Fully deprecated. Do not use.
- `next-pwa` (shadowwalker): Unmaintained. Do not use.
- `tailwind.config.js`: Not needed in Tailwind v4. Use CSS `@theme` instead.
- `middleware.ts`: Deprecated in Next.js 16. Rename to `proxy.ts`.
- Synchronous `cookies()` / `headers()`: Removed in Next.js 16. Must await.

## Session Persistence Strategy (Claude's Discretion)

**Recommendation: Long-lived sessions for technicians.**

Supabase Auth sessions default to 1 hour access token + 1 week refresh token. The proxy automatically refreshes access tokens using the refresh token in cookies. This means:
- Technicians stay logged in for up to 1 week without re-entering credentials
- The proxy silently refreshes the access token on every request
- Sessions survive app close/reopen, phone restart, etc.
- After 1 week of complete inactivity, they must log in again

This is ideal for field workers who reopen the app daily. No custom session logic needed -- the default Supabase behavior with the proxy pattern handles it. If needed later, session lifetime can be configured in Supabase Dashboard > Auth > Settings.

## Offline Fallback Strategy (Claude's Discretion)

**Recommendation: Graceful degradation with offline fallback page.**

For V1 (full offline is V4):
- Serwist precaches the app shell (HTML, CSS, JS) so the app loads even on weak signal
- When fully offline and navigating to a page that requires data, show a dedicated `/~offline` page with a Spanish message: "Sin conexion a internet. Reconectando..." and an auto-retry mechanism
- The Serwist `reloadOnOnline: true` config automatically reloads when connectivity returns
- This is NOT full offline mode -- just graceful handling of connectivity loss

## Placeholder Color Palette (Claude's Discretion)

**Recommendation: Steel blue professional palette.**

A neutral-professional steel blue works well for both HVAC industry expectations and placeholder branding:
- Admin dark mode: Dark slate backgrounds (`oklch(0.15-0.25)`) with blue accent highlights
- Technician light mode: White/light gray backgrounds with blue primary actions
- Status colors: Green (completado), Yellow (en espera), Blue (en progreso)
- The palette is defined in CSS custom properties via Tailwind v4's `@theme`, making it trivial to swap when the real brand colors arrive

## Open Questions

1. **Supabase Project Region**
   - What we know: Supabase project must be created manually. Region affects latency.
   - What's unclear: Whether to use US or Latin America region for best latency to Mexican technicians.
   - Recommendation: Use `us-east-1` (Virginia) or check if Supabase has a closer region. This is a setup-time decision.

2. **Serwist + Turbopack in Development**
   - What we know: Serwist requires webpack for production builds. In dev, the service worker is disabled anyway.
   - What's unclear: Whether the `@serwist/turbopack` package is needed or if disabling SW in dev is sufficient.
   - Recommendation: Disable SW in dev (already the default), use `--webpack` for build. Skip `@serwist/turbopack` for V1.

3. **Initial Admin Account Creation**
   - What we know: The system has no self-signup. The first admin account needs to exist before the app can create other accounts.
   - What's unclear: Whether to create the admin via Supabase Dashboard, a seed script, or a one-time setup route.
   - Recommendation: Create the first admin via Supabase Dashboard (Auth > Users > Create User) and manually set `app_metadata: { "rol": "admin" }`. Then use that admin account to create all subsequent accounts through the app.

4. **Next.js 15 vs 16 Decision**
   - What we know: Next.js 16 is latest stable (16.1.6). It has significant changes (proxy rename, async APIs, Turbopack default).
   - What's unclear: Whether the Supabase starter template fully supports Next.js 16 yet, or if it still targets 15.
   - Recommendation: Use Next.js 16. The Supabase docs already reference `proxy.ts`. The breaking changes (async APIs, proxy rename) are mechanical and well-documented. Starting on 16 avoids a migration later.

## Sources

### Primary (HIGH confidence)
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) - Complete breaking changes, proxy rename, async APIs
- [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps) - Official PWA manifest, service worker, install prompt patterns
- [Supabase Auth SSR for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) - proxy.ts, client creation, updateSession
- [Supabase AI Prompt: Next.js 16 Auth](https://supabase.com/docs/guides/getting-started/ai-prompts/nextjs-supabase-auth) - Complete client.ts, server.ts, proxy.ts code
- [Supabase admin.createUser()](https://supabase.com/docs/reference/javascript/auth-admin-createuser) - Server-side user creation API
- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) - SECURITY DEFINER patterns, performance tips
- [Supabase Custom Claims RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac) - Role storage in app_metadata, JWT hook
- [Tailwind CSS v4 Blog](https://tailwindcss.com/blog/tailwindcss-v4) - CSS-first config, @theme, installation
- [Serwist Getting Started](https://serwist.pages.dev/docs/next/getting-started) - Next.js integration, service worker setup

### Secondary (MEDIUM confidence)
- [LogRocket: Next.js 16 PWA with Serwist](https://blog.logrocket.com/nextjs-16-pwa-offline-support/) - Turbopack/Webpack build flag, Next.js 16-specific setup
- [Supabase API Keys](https://supabase.com/docs/guides/api/api-keys) - Publishable key transition from anon key
- [Supabase API Key Transition Discussion](https://github.com/orgs/supabase/discussions/29260) - Timeline and migration details

### Tertiary (LOW confidence)
- None -- all findings verified with official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified with official docs and current versions confirmed
- Architecture: HIGH - Patterns sourced from official Supabase and Next.js documentation
- Pitfalls: HIGH - Based on official docs warnings and verified breaking changes
- PWA setup: HIGH - Serwist docs + Next.js 16 official guide + LogRocket verification

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (30 days -- stack is stable, no major releases expected)
