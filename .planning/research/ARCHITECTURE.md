# Architecture Patterns

**Domain:** HVAC field service daily report PWA
**Researched:** 2026-02-23
**Overall confidence:** HIGH (core patterns verified with official docs; domain-specific integration patterns at MEDIUM)

---

## Recommended Architecture

Next.js App Router with a **server-first, client-islands** approach. The app has two distinct surfaces: an admin dashboard (desktop web) and a technician reporting interface (mobile PWA). Both share a single Next.js deployment but diverge at the layout level via `/admin` and `/tecnico` route groups.

```
                        +---------------------------+
                        |        Vercel CDN         |
                        |  (Edge Network + Hosting) |
                        +------------+--------------+
                                     |
                        +------------+--------------+
                        |    Next.js App Router     |
                        |  middleware.ts (auth gate) |
                        +--+----------+----------+--+
                           |          |          |
              +------------+    +-----+-----+    +-------------+
              | /admin/*   |    | /tecnico/*|    | /api/*      |
              | (layouts,  |    | (layouts, |    | (route      |
              |  pages)    |    |  pages)   |    |  handlers)  |
              +-----+------+    +-----+----+    +------+------+
                    |                 |                 |
                    +--------+--------+---------+------+
                             |                  |
                    +--------+--------+  +------+------+
                    | Supabase Client |  | Supabase    |
                    | (Browser SSR)   |  | Admin/Svc   |
                    +--------+--------+  +------+------+
                             |                  |
                    +--------+------------------+------+
                    |        Supabase Platform         |
                    |  +----------+  +-----------+     |
                    |  | Auth     |  | PostgreSQL|     |
                    |  | (JWT +   |  | (+ RLS)   |     |
                    |  |  cookies)|  +-----------+     |
                    |  +----------+  +-----------+     |
                    |                | Storage   |     |
                    |                | (photos,  |     |
                    |                |  logos,   |     |
                    |                |  sigs)    |     |
                    |                +-----------+     |
                    +----------------------------------+
```

---

## Component Boundaries

| Component | Responsibility | Communicates With | Server or Client |
|---|---|---|---|
| **middleware.ts** | Refresh Supabase auth tokens on every request; redirect unauthenticated users; enforce role-based route access | Supabase Auth (server client), Next.js request/response cookies | Server (Edge) |
| **Root layout** (`/app/layout.tsx`) | HTML shell, metadata, manifest link, global providers | Manifest, global CSS | Server Component |
| **Admin layout** (`/app/admin/layout.tsx`) | Sidebar navigation, admin-only shell, role guard | middleware (enforced upstream) | Server Component |
| **Tecnico layout** (`/app/tecnico/layout.tsx`) | Bottom nav, mobile shell, PWA chrome | middleware (enforced upstream) | Server Component |
| **CRUD pages** (sucursales, equipos, clientes, folios, usuarios) | List/detail views, forms for admin data management | Supabase DB via Server Actions | Server Components with Client Component forms |
| **Report form** (`/app/tecnico/reporte/`) | Multi-step report creation: equipment selection, work details, photos, materials, signature, status | Supabase DB (Server Actions), Supabase Storage (direct upload), Camera API, Canvas API, Geolocation API | Primarily Client Component (heavy interactivity) |
| **Photo capture module** | Camera access, GPS/time overlay burn, compression, upload | Browser MediaDevices API, Canvas API, Geolocation API, browser-image-compression, Supabase Storage | Client Component |
| **Signature pad** | Canvas-based signature capture, export as PNG base64 | react-signature-canvas, Canvas API | Client Component |
| **Report viewer** (`/app/admin/reportes/`) | Read-only and edit views of submitted reports | Supabase DB (Server Components for read, Server Actions for edit) | Server Component (list), Client Component (edit form) |
| **PDF generator** | Compose branded PDF from report data + photos + logos + signature | @react-pdf/renderer (server-side via Route Handler or Server Action) | Server (Route Handler) |
| **Notification system** | In-app badge/toast when report submitted; email via Supabase Edge Function or webhook | Supabase Realtime (postgres_changes), Resend/SMTP for email | Server + Client |
| **Supabase browser client** (`/src/lib/supabase/client.ts`) | Client-side Supabase operations (direct file uploads, realtime subscriptions) | Supabase JS SDK | Client |
| **Supabase server client** (`/src/lib/supabase/server.ts`) | Server-side Supabase operations (auth validation, DB queries in Server Components/Actions) | Supabase JS SDK (@supabase/ssr) | Server |
| **Service worker** (`/public/sw.js`) | PWA installability, push notifications, asset caching | Web Push API, Cache API | Browser (background) |

---

## Data Flow

### 1. Authentication Flow

```
Technician opens app
  --> middleware.ts intercepts request
    --> createServerClient reads cookies
    --> supabase.auth.getUser() validates JWT (NOT getSession -- getSession can be spoofed)
      --> If no valid session: redirect to /login
      --> If valid session: check user.rol from profiles/users table
        --> If rol=tecnico and path=/admin/*: redirect to /tecnico
        --> If rol=admin and path=/tecnico/*: allow (admin can see everything)
        --> Pass refreshed cookies to response
  --> Page renders with authenticated context
```

**Confidence:** HIGH. Verified against [Supabase official SSR docs](https://supabase.com/docs/guides/auth/server-side/nextjs). Key insight: always use `supabase.auth.getUser()` server-side, never trust `getSession()` alone because cookies can be spoofed.

### 2. Report Submission Pipeline

```
Technician on /tecnico/reporte/[folioId]

  Step 1: Load Context (Server Component)
    --> Server fetches folio details, branch, equipment list, assigned users
    --> Passes as props to Client Component form

  Step 2: Fill Report (Client Component)
    --> Select equipment from dropdown (pre-loaded from branch)
    --> OR tap "Agregar Equipo" to add new equipment inline
    --> Fill tipo_trabajo (toggle), diagnostico, trabajo_realizado, observaciones
    --> Add materials rows (cantidad, unidad, descripcion)

  Step 3: Capture Photos (Client Component - Photo Module)
    --> User taps camera button
    --> navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    --> Live viewfinder displayed in <video> element
    --> User taps capture
    --> Frame grabbed to <canvas>
    --> navigator.geolocation.getCurrentPosition() called
    --> Canvas draws overlay text: GPS coords, date/time, formatted in corner
    --> canvas.toBlob() exports stamped image
    --> browser-image-compression compresses to ~800KB max, maxWidth 1920
    --> supabase.storage.upload() sends to `fotos/{folio_id}/{report_id}/{uuid}.jpg`
    --> URL stored in reporte_fotos row via Server Action

  Step 4: Set Status
    --> If "Completado": signature pad appears
    --> Client's branch manager signs on screen
    --> signaturePad.toDataURL('image/png') exports base64
    --> Stored as data URL in reportes.firma_encargado
    --> OR uploaded to Storage and URL stored (better for large signatures)

  Step 5: Submit
    --> Server Action receives form data
    --> Validates required fields server-side
    --> Upserts reportes row + reporte_equipos + reporte_materiales
    --> Triggers notification to admin (via DB trigger or Supabase Edge Function)
    --> Returns success/error to client
    --> Client shows confirmation toast, navigates back to folio list
```

### 3. PDF Generation Pipeline

```
Admin clicks "Exportar PDF" on report detail page

  --> Client requests /api/pdf/[reporteId] (Route Handler)
  --> Route Handler:
      1. Authenticates request (server Supabase client)
      2. Fetches full report data: reporte + reporte_equipos + reporte_materiales + reporte_fotos
      3. Fetches related data: folio, sucursal, cliente (with logo_url), company logo
      4. Downloads photo images from Supabase Storage (as buffers)
      5. Downloads signature image
      6. Renders React PDF document using @react-pdf/renderer:
         - Page 1: Header (company logo + client logo), folio info, branch info, date
         - Per equipment: tipo_trabajo, diagnostico, trabajo_realizado, observaciones
         - Photos section: embedded images with metadata captions
         - Materials table
         - Status + signature image
         - Footer: page numbers
      7. Streams PDF buffer as response with Content-Type: application/pdf
  --> Browser downloads or displays PDF
```

**Why server-side PDF:** Photos need to be fetched from Supabase Storage and embedded. Client-side PDF would require downloading all images to the browser first, which is slow on mobile. Server-side keeps it fast and avoids CORS issues. @react-pdf/renderer works in Node.js for this exact use case.

**Confidence:** MEDIUM. The @react-pdf/renderer library works server-side per [GitHub discussions](https://github.com/diegomura/react-pdf/discussions/2402), but embedding many large images in PDFs may need memory tuning on Vercel serverless functions (watch the 50MB response limit and 10s/60s timeout).

### 4. Shared Report Editing (Cuadrilla Collaboration)

```
Multiple technicians assigned to same folio open /tecnico/reporte/[folioId]

  Approach: LAST-WRITE-WINS with optimistic UI (NOT real-time collaborative editing)

  Rationale:
    - Crews are 2-3 people physically together at the same branch
    - They coordinate verbally ("I'll do equipment 1-3, you do 4-6")
    - Real-time CRDT editing is massive overkill for this use case
    - Risk of conflict is low; cost of real-time infrastructure is high

  How it works:
    --> Each user loads the current report state from DB
    --> Each user edits their section (typically different equipment entries)
    --> On submit, Server Action upserts individual reporte_equipos rows
    --> If two users edit the SAME equipment entry, last save wins
    --> Optional: Supabase Realtime postgres_changes subscription to auto-refresh
        the report view when another team member saves (low priority for V1)

  V2 enhancement: Add updated_at conflict detection -- if the row changed since
  the user loaded it, show a merge prompt instead of silently overwriting.
```

**Confidence:** HIGH that last-write-wins is correct for V1. The team is small (2-3 people) and physically co-located. Real-time collaborative editing (Yjs, CRDTs) would be overengineered. A simple "refresh on change" via Supabase Realtime is the right ceiling for V1.

---

## Server Components vs Client Components Boundary

### The Decision Framework

**Server Components** (default in App Router) for:
- Data fetching (Supabase queries)
- Layout shells (admin sidebar, tecnico bottom nav)
- List views (sucursales list, reportes list, folios list)
- Detail views (read-only report display)
- Anything that does not need `useState`, `useEffect`, or browser APIs

**Client Components** (`'use client'`) for:
- Forms with interactive state (report form, equipment form, folio assignment)
- Camera capture (requires `navigator.mediaDevices`)
- Photo overlay (requires `<canvas>`)
- Signature pad (requires `<canvas>`)
- Photo gallery with lightbox
- Dropdowns with search/filter behavior
- Status toggles
- Toast notifications
- Any component using `onClick`, `onChange`, etc.

### Concrete Boundary Map

```
/app/admin/sucursales/page.tsx          --> SERVER (fetches list, renders table)
/app/admin/sucursales/[id]/page.tsx     --> SERVER (fetches detail)
  └─ <BranchForm />                     --> CLIENT (form with state)

/app/admin/reportes/page.tsx            --> SERVER (fetches report list)
/app/admin/reportes/[id]/page.tsx       --> SERVER (fetches full report)
  └─ <ReportEditForm />                 --> CLIENT (admin edit form)
  └─ <PhotoGallery />                   --> CLIENT (lightbox, zoom)

/app/tecnico/folios/page.tsx            --> SERVER (fetches assigned folios)
/app/tecnico/reporte/[folioId]/page.tsx --> SERVER (fetches folio context)
  └─ <ReportFormWizard />               --> CLIENT (multi-step form)
    ├─ <EquipmentSection />             --> CLIENT (equipment selection + details)
    ├─ <PhotoCapture />                 --> CLIENT (camera + overlay + upload)
    ├─ <MaterialsTable />              --> CLIENT (dynamic rows)
    ├─ <SignaturePad />                 --> CLIENT (canvas signature)
    └─ <StatusSelector />              --> CLIENT (toggle)
```

**Pattern:** Server Components fetch data and pass it down as props to Client Component islands. This avoids client-side data fetching waterfalls and keeps bundle sizes small.

**Confidence:** HIGH. This is the standard Next.js App Router pattern per [official docs](https://nextjs.org/docs/app/getting-started/server-and-client-components).

---

## Supabase Auth Flow with Role-Based Access

### Auth Architecture

```
┌─────────────────────────────────────────────────┐
│                  Supabase Auth                   │
│                                                  │
│  users table (auth.users) -- managed by Supabase │
│  profiles table (public.users) -- app-managed    │
│    ├── rol: 'admin' | 'tecnico' | 'ayudante'    │
│    └── nombre, email                             │
│                                                  │
│  On signup trigger: insert profile row           │
│  Custom JWT claim: app_metadata.rol (optional)   │
└─────────────────────────────────────────────────┘
```

### Three Auth Layers

1. **Middleware (Edge):** Validates session, refreshes tokens, enforces route-level access
2. **RLS (Database):** Row-level security policies enforce data access per user/role
3. **UI (Client):** Conditional rendering based on role (hide admin nav items, etc.)

### Middleware Pattern

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANT: use getUser(), NOT getSession()
  const { data: { user } } = await supabase.auth.getUser()

  // Not authenticated -- redirect to login
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role-based route protection
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('rol')
      .eq('id', user.id)
      .single()

    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
    const isTecnicoRoute = request.nextUrl.pathname.startsWith('/tecnico')

    if (isAdminRoute && profile?.rol !== 'admin') {
      return NextResponse.redirect(new URL('/tecnico/folios', request.url))
    }
    if (isTecnicoRoute && profile?.rol === 'admin') {
      // Allow admin to access tecnico routes (for testing/support)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest).*)'],
}
```

**Critical caveat:** The middleware profile query runs on every request. For V1 with <10 users this is fine. For scale, move `rol` into a Supabase custom JWT claim (`app_metadata.rol`) so middleware can read it from the token without a DB query.

### RLS Policy Pattern

```sql
-- Admin can read everything
CREATE POLICY "admin_read_all" ON reportes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.rol = 'admin'
    )
  );

-- Technician can only read reports for their assigned folios
CREATE POLICY "tecnico_read_own" ON reportes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM folio_asignados
      WHERE folio_asignados.folio_id = reportes.folio_id
      AND folio_asignados.usuario_id = auth.uid()
    )
  );

-- Technician can insert reports for their assigned folios
CREATE POLICY "tecnico_insert_own" ON reportes
  FOR INSERT WITH CHECK (
    reportes.creado_por = auth.uid()
    AND EXISTS (
      SELECT 1 FROM folio_asignados
      WHERE folio_asignados.folio_id = reportes.folio_id
      AND folio_asignados.usuario_id = auth.uid()
    )
  );

-- Admin can update any report
CREATE POLICY "admin_update_all" ON reportes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.rol = 'admin'
    )
  );
```

**Warning (from MEMORY.md experience):** Cross-table RLS policies can cause infinite recursion. If `users` table has RLS enabled and the policy on `reportes` queries `users`, and `users` policy queries something else, you get circular dependencies. Solution: Use `SECURITY DEFINER` helper functions that bypass RLS for role checks.

```sql
-- Helper function to avoid RLS recursion
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol FROM users WHERE id = auth.uid();
$$;

-- Then use in policies:
CREATE POLICY "admin_read_all" ON reportes
  FOR SELECT USING (get_user_role() = 'admin');
```

**Confidence:** HIGH. This pattern is well-documented in Supabase docs and aligns with previous experience noted in MEMORY.md about RLS circular dependencies.

---

## File Upload Pipeline (Photo Capture)

### Complete Pipeline Architecture

```
[Camera Button Tap]
    |
    v
[navigator.mediaDevices.getUserMedia()]
  facingMode: 'environment' (back camera)
  video constraints: { width: { ideal: 1920 }, height: { ideal: 1080 } }
    |
    v
[<video> element displays live feed]
    |
    v
[User taps capture / "Tomar Foto"]
    |
    v
[Draw video frame to <canvas>] -- canvas dimensions match video
    |
    v
[Get GPS coordinates]
  navigator.geolocation.getCurrentPosition()
  Fallback: "Sin ubicacion" text if denied/unavailable
    |
    v
[Burn metadata overlay onto canvas]
  ctx.fillStyle = 'rgba(0,0,0,0.6)' -- semi-transparent background bar
  ctx.fillRect(0, height-80, width, 80)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 24px Arial'
  ctx.fillText(`${lat}, ${lng}`, 10, height-50)
  ctx.fillText(`${fecha} ${hora}`, 10, height-20)
    |
    v
[canvas.toBlob('image/jpeg', 0.85)]
    |
    v
[browser-image-compression]
  maxSizeMB: 0.8 (800KB target)
  maxWidthOrHeight: 1920
  useWebWorker: true
    |
    v
[Upload to Supabase Storage]
  Bucket: 'fotos'
  Path: `${folio_id}/${reporte_id}/${uuid}.jpg`
  Content-Type: 'image/jpeg'
    |
    v
[Get public URL]
  supabase.storage.from('fotos').getPublicUrl(path)
    |
    v
[Save metadata to DB via Server Action]
  INSERT INTO reporte_fotos (reporte_id, equipo_id, url, etiqueta, metadata_gps, metadata_fecha)
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| Client-side compression before upload | Mobile data is limited; 800KB target keeps uploads fast |
| JPEG at 0.85 quality | Good balance of quality and size for field photos |
| GPS overlay burned into image pixels | Matches existing workflow (external stamping app); tamper-evident |
| `browser-image-compression` over `compressorjs` | Web Worker support prevents UI blocking during compression |
| Direct client-to-Storage upload | Avoids sending large files through Server Actions (which have size limits) |
| UUID filenames | Prevents naming collisions from concurrent uploads |
| Gallery upload path | Same pipeline minus camera capture; uses `<input type="file" accept="image/*">` |

### Storage Bucket Configuration

```sql
-- Supabase Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos', 'fotos', true);

-- RLS: tecnico can upload to their folio's folder
CREATE POLICY "tecnico_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'fotos'
    AND auth.role() = 'authenticated'
  );

-- RLS: authenticated users can read photos
CREATE POLICY "authenticated_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'fotos'
    AND auth.role() = 'authenticated'
  );
```

**Confidence:** HIGH for the pipeline pattern. MEDIUM for exact `browser-image-compression` config -- will need testing with real HVAC field photos to tune quality vs size.

---

## PWA Configuration

### Manifest

```typescript
// app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OMLEB Reportes HVAC',
    short_name: 'Reportes',
    description: 'Reportes diarios de mantenimiento HVAC',
    start_url: '/tecnico/folios',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1e40af', // brand blue -- adjust later
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
```

### Service Worker Strategy

For V1 (no offline mode), the service worker is **minimal** -- just enough for PWA installability and push notifications:

```javascript
// public/sw.js
self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json()
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
      })
    )
  }
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  event.waitUntil(clients.openWindow('/tecnico/folios'))
})
```

**Do NOT use Serwist or next-pwa for V1.** Offline caching adds complexity and the project doc explicitly defers offline to V4. A manual `sw.js` for push notifications is sufficient. When V4 arrives, migrate to Serwist for proper precaching and runtime caching strategies.

### Camera API Considerations

| Concern | Solution |
|---|---|
| iOS Safari camera permissions | Must use HTTPS (Vercel provides this); `getUserMedia` works in standalone PWA mode on iOS 16.4+ |
| Android Chrome camera | Works reliably in both browser and installed PWA |
| Fallback for denied permissions | Show `<input type="file" accept="image/*" capture="environment">` as fallback |
| Portrait lock | `manifest.orientation: 'portrait'` handles this for installed PWA |
| Viewfinder performance | Use `<video>` element with `object-fit: cover`; do NOT render to canvas continuously (battery drain) |

**Confidence:** HIGH. Verified via [Next.js official PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps). Camera API patterns are well-established.

---

## Patterns to Follow

### Pattern 1: Server Component Data Fetch + Client Component Form

**What:** Server Component fetches data, passes it as props to a Client Component that handles the interactive form.

**When:** Every CRUD page, every data-entry form.

```typescript
// app/admin/sucursales/[id]/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/server'
import { BranchForm } from '@/components/admin/branch-form'

export default async function BranchEditPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: branch } = await supabase
    .from('sucursales')
    .select('*')
    .eq('id', params.id)
    .single()

  return <BranchForm branch={branch} />
}

// components/admin/branch-form.tsx (Client Component)
'use client'
import { useActionState } from 'react'
import { updateBranch } from '@/app/admin/sucursales/actions'

export function BranchForm({ branch }: { branch: Branch }) {
  const [state, formAction, pending] = useActionState(updateBranch, null)
  return (
    <form action={formAction}>
      {/* form fields pre-filled from branch prop */}
    </form>
  )
}
```

### Pattern 2: Server Actions for Mutations

**What:** Use `'use server'` functions for all data mutations instead of API routes.

**When:** Form submissions, status updates, any write operation.

```typescript
// app/tecnico/reporte/actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitReport(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('reportes').insert({
    folio_id: formData.get('folio_id'),
    creado_por: user.id,
    fecha: new Date().toISOString(),
    estatus: formData.get('estatus'),
    // ...
  })

  if (error) return { error: error.message }
  revalidatePath('/tecnico/folios')
  return { success: true }
}
```

### Pattern 3: Direct Client Upload for Large Files

**What:** Upload photos directly from the browser to Supabase Storage, bypassing Server Actions.

**When:** Photo and signature uploads (Server Actions have ~4.5MB body size limit on Vercel).

```typescript
// Client component
const supabase = createBrowserClient(/* ... */)
const { data, error } = await supabase.storage
  .from('fotos')
  .upload(`${folioId}/${reporteId}/${crypto.randomUUID()}.jpg`, compressedBlob, {
    contentType: 'image/jpeg',
    upsert: false,
  })
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Fetching Data in Client Components

**What:** Using `useEffect` + `fetch` or `supabase.from().select()` in Client Components for initial data loading.

**Why bad:** Creates client-side waterfalls, shows loading spinners, duplicates data fetching logic, breaks SSR benefits.

**Instead:** Fetch in Server Components, pass data as props to Client Components.

### Anti-Pattern 2: Putting Role Logic Only in the UI

**What:** Hiding admin buttons with `{role === 'admin' && <Button />}` without server-side enforcement.

**Why bad:** Anyone can call the Server Action or API directly. UI-only checks are security theater.

**Instead:** Enforce role checks in Server Actions, middleware, AND RLS policies. UI hiding is cosmetic only.

### Anti-Pattern 3: Uploading Uncompressed Photos via Server Actions

**What:** Sending raw 5-10MB camera photos through Server Actions.

**Why bad:** Vercel has a ~4.5MB request body limit for serverless functions. Large uploads will fail silently or timeout.

**Instead:** Compress client-side with `browser-image-compression`, then upload directly to Supabase Storage from the browser client.

### Anti-Pattern 4: Using `getSession()` for Auth in Server Code

**What:** Calling `supabase.auth.getSession()` instead of `supabase.auth.getUser()` in Server Components or middleware.

**Why bad:** `getSession()` reads from cookies which can be spoofed. It does not validate the JWT. An attacker can forge session data.

**Instead:** Always use `supabase.auth.getUser()` server-side. It validates the JWT against Supabase's servers.

### Anti-Pattern 5: Real-Time Collaborative Editing for V1

**What:** Implementing Yjs/CRDT-based collaborative editing so multiple cuadrilla members can edit the same report simultaneously.

**Why bad:** Massive complexity for a team of 2-3 people who are physically standing next to each other. Weeks of development time for a problem that doesn't exist.

**Instead:** Last-write-wins with optional auto-refresh via Supabase Realtime postgres_changes.

---

## Scalability Considerations

| Concern | At 5 users (V1) | At 50 users | At 500 users |
|---|---|---|---|
| Auth middleware DB query | Fine | Move rol to JWT custom claim | JWT custom claim required |
| Photo storage | ~1GB/month | ~10GB/month; consider lifecycle policies | Tiered storage or S3 |
| PDF generation | Vercel serverless (10s timeout) | Vercel serverless (60s pro) | Move to background job queue |
| RLS policy complexity | Simple | Add indexes on FK columns used in policies | SECURITY DEFINER functions for hot paths |
| Realtime subscriptions | Not needed | Optional nice-to-have | Channel-per-folio pattern |

---

## Suggested Build Order (Dependencies)

The build order must respect technical dependencies. You cannot build the report form before the data it depends on exists.

```
Phase 1: Foundation
  ├── Next.js project scaffold + Tailwind + folder structure
  ├── Supabase project creation (auth, DB, storage)
  ├── Database schema migration (all tables)
  ├── Supabase auth setup (browser + server clients, middleware)
  ├── PWA manifest + basic service worker
  └── Login page (shared by admin + tecnico)

Phase 2: Admin Data Layer (CRUD)
  ├── Client management (clientes) ── needed for folios
  ├── Branch management (sucursales) ── needed for folios + equipos
  ├── Equipment management (equipos) ── needed for reports
  ├── User management (usuarios) ── needed for folio assignment
  └── Folio management (folios + folio_asignados) ── ties everything together

Phase 3: Technician Reporting (THE product)
  ├── Folio list view (assigned folios for logged-in tecnico)
  ├── Report form scaffold (multi-step or single-page)
  ├── Equipment selection + inline add-new
  ├── Photo capture module (camera + GPS overlay + compression + upload)
  ├── Gallery upload alternative
  ├── Materials table (dynamic rows)
  ├── Status selector + signature pad (when Completado)
  └── Report submission (Server Action + validation)

Phase 4: Admin Review + PDF
  ├── Report list view (all submitted reports)
  ├── Report detail + edit form (admin can overwrite any field)
  ├── Report finalization (admin approval toggle)
  ├── PDF generation (Route Handler + @react-pdf/renderer)
  └── Notification system (in-app + email on report submit)
```

**Phase ordering rationale:**
- Phase 1 before everything: can't do anything without auth and DB
- Phase 2 before Phase 3: technician forms need equipment/branch/folio data to exist
- Phase 3 before Phase 4: admin can't review reports that don't exist yet
- Phase 3 is the largest and most complex phase; it should get the most development time
- Photo capture module is the highest-risk component in Phase 3 (camera API + canvas + GPS + compression); consider prototyping it early

---

## Sources

- [Next.js: Server and Client Components (official)](https://nextjs.org/docs/app/getting-started/server-and-client-components) -- HIGH confidence
- [Next.js: Progressive Web Apps guide (official)](https://nextjs.org/docs/app/guides/progressive-web-apps) -- HIGH confidence
- [Supabase: Server-Side Auth for Next.js (official)](https://supabase.com/docs/guides/auth/server-side/nextjs) -- HIGH confidence
- [Supabase: Row Level Security (official)](https://supabase.com/docs/guides/database/postgres/row-level-security) -- HIGH confidence
- [Supabase: Custom Claims & RBAC (official)](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac) -- HIGH confidence
- [Supabase: Storage Access Control (official)](https://supabase.com/docs/guides/storage/security/access-control) -- HIGH confidence
- [browser-image-compression (npm)](https://www.npmjs.com/package/browser-image-compression) -- HIGH confidence
- [react-signature-canvas (npm)](https://www.npmjs.com/package/react-signature-canvas) -- HIGH confidence
- [@react-pdf/renderer server-side discussion](https://github.com/diegomura/react-pdf/discussions/2402) -- MEDIUM confidence
- [Serwist Next.js integration](https://serwist.pages.dev/docs/next/getting-started) -- HIGH confidence (for V4 offline, not V1)
- [Client-side image compression with Supabase](https://dev.to/mikeesto/client-side-image-compression-with-supabase-storage-1193) -- MEDIUM confidence
- [Next.js App Router pitfalls 2026](https://imidef.com/en/2026-02-11-app-router-pitfalls) -- MEDIUM confidence
