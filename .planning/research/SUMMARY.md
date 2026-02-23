# Project Research Summary

**Project:** OMLEB - HVAC Field Service Daily Report PWA
**Domain:** HVAC field service documentation (commercial subcontractor workflow)
**Researched:** 2026-02-23
**Confidence:** HIGH

## Executive Summary

OMLEB needs a mobile-first PWA that replaces an informal WhatsApp-based workflow with structured daily service reports for commercial HVAC maintenance. Research across ServiceTitan, BuildOps, Jobber, Housecall Pro, and FieldPulse confirms a consistent feature set that field service professionals expect: per-equipment service entries, GPS-stamped photos, digital client signatures, PDF report export, and offline operation. The recommended stack is Next.js 16 App Router + Supabase + Tailwind CSS v4 + `@react-pdf/renderer`, all with verified current versions. The entire stack is well-documented with official sources at HIGH confidence.

The architecture should split into two surfaces sharing a single Next.js deployment: an `/admin` route group for setup and report review (desktop) and a `/tecnico` route group for field data entry (mobile PWA). The critical dependency chain is: database schema and auth first, then admin CRUD data entry (clients, branches, equipment, folios), then the technician reporting interface, then PDF export and admin review. Offline operation is a table-stakes requirement but is explicitly scoped to V4 in the project brief — the V1 service worker needs only PWA installability and push notification support, not full offline caching.

The highest-risk areas are photo capture (Android 14/15 broke file input camera access — use `getUserMedia` API only), PDF generation (favor client-side generation to avoid Vercel serverless memory/timeout limits), and Supabase RLS (cross-table role checks cause infinite recursion — use `SECURITY DEFINER` helper functions from day one). These three pitfalls are showstoppers if encountered late; they must be addressed in the first phases. All other risks are moderate or minor.

---

## Key Findings

### Recommended Stack

The full stack is Next.js 16 App Router + React 19 + TypeScript 5 + Tailwind CSS v4, deployed to Vercel. Supabase handles auth, PostgreSQL (with RLS), and file storage. All versions are current as of February 2026 and verified against npm/official documentation. No alternatives are competitive at this scope.

For specialized needs: `@serwist/next` (not the deprecated `next-pwa`) for PWA; `@react-pdf/renderer` (not jsPDF or Puppeteer) for branded PDF reports with embedded photos; native `getUserMedia` + `<canvas>` (not `react-webcam`) for camera capture; `react-hook-form` + `zod` for forms; `react-signature-canvas` for touch signatures; `browser-image-compression` for client-side photo size reduction before upload. Zustand is recommended only if offline draft persistence is needed; otherwise plain React state suffices at this scale (2-5 users).

**Core technologies:**
- **Next.js 16 App Router**: Full-stack framework — server components for data, client components for interactivity, API route handlers for PDF, zero-config Vercel deploy
- **Supabase**: Auth + PostgreSQL + Storage in one — covers multi-role auth, RLS per technician/branch, photo storage, no separate backend needed
- **Tailwind CSS v4**: Mobile-first styling — 5x faster builds, zero-config, utility-first, ideal for touch-optimized field UI
- **@react-pdf/renderer**: JSX-based PDF generation — declarative layout for branded reports with photos, logos, signatures; works client-side (avoids Vercel limits)
- **Native getUserMedia + canvas**: Camera capture — avoids broken file input on Android 14/15, full control over GPS/timestamp overlay burned into pixels
- **react-hook-form + zod**: Forms and validation — minimal re-renders, TypeScript-first schema, Spanish custom error messages
- **react-signature-canvas**: Touch-optimized signature pad — handles mobile touch events correctly out of the box

### Expected Features

Research confirms 10 table-stakes features that define the minimum viable product. All are present across every major competitor (ServiceTitan, BuildOps, Jobber, Housecall Pro, FieldPulse). Missing any of them means the app is worse than the WhatsApp workflow it replaces.

**Must have (table stakes — all 10 required for V1 launch):**
- **Per-equipment service entries (T1)** — preventivo/correctivo classification, multiple entries per report; the atomic unit of HVAC reporting
- **Photo capture with burned-in metadata stamps (T2)** — GPS coordinates, date, time, technician name permanently overlaid on pixels; dedicated apps (Solocator, Timemark) exist because clients need tamper-evident proof
- **Digital signature from on-site client manager (T3)** — legal proof of service completion; universal across all competitors
- **PDF report generation with company branding (T4)** — primary deliverable that branch managers and contractor PMs receive
- **Materials/parts used log per report (T5)** — supports billing documentation between subcontractor and contractor
- **Offline-first operation (T6)** — critical for mechanical rooms, basements, rural bank branches with no signal; hardest table-stakes feature; must be designed into the architecture from day 0 (even if V1 scope is limited)
- **Report submission workflow: draft → submitted → reviewed (T7)** — replaces WhatsApp chaos with a traceable status lifecycle
- **Folio/work order context (T8)** — ties each report to a client, branch, and date range; without it reports are untraceable documents
- **Crew (cuadrilla) shared reports (T9)** — 2-3 techs at the same branch contribute to one report; specific to commercial HVAC workflow
- **Mobile-first Spanish UI (T10)** — large tap targets, minimal typing, Spanish language throughout; must work on budget Android phones

**Should have (high-value additions for V1.1, post-launch):**
- **QR code equipment scan (D3)** — low complexity, eliminates wrong-equipment selection errors
- **Before/after photo pairing (D4)** — low complexity, high report quality for client
- **Auto-draft from previous visit (D9)** — low complexity, saves daily repetitive setup for recurring branch visits
- **Push notification reminders (D10)** — end-of-day reminder for missing reports; test iOS Safari support thoroughly

**Defer to V2+:**
- **Photo annotation/markup (D1)** — medium complexity, needs separate canvas library; nice but not blocking
- **Voice-to-text notes (D2)** — medium-high complexity, Spanish accuracy, offline challenge; emerging differentiator not yet expected
- **Equipment report history (D5)** — requires accumulated data before it is useful
- **Smart defaults/templates (D6)** — requires understanding actual usage patterns before designing
- **Contractor-flexible branding (D7)** — multi-tenant branding system; adds complexity
- **Admin status dashboard (D8)** — admin can review reports manually at launch

**Never build:**
- Scheduling/dispatching, invoicing, inventory management, customer portal, live GPS tracking, quoting, CRM, AI diagnostics (all out of scope per anti-features analysis)

### Architecture Approach

The recommended architecture is Next.js App Router with a server-first, client-islands pattern. Server Components handle all data fetching and static layouts; Client Components handle interactivity (forms, camera, canvas, signature). The app splits into `/admin/*` (desktop, CRUD management, report review) and `/tecnico/*` (mobile PWA, field data entry) route groups under a single deployment. Three auth layers enforce security: Edge middleware (`getUser()` JWT validation), Supabase RLS (row-level policies), and UI conditional rendering (cosmetic only). Crucially, PDF generation should be client-side in the admin's browser — not a serverless function — to avoid Vercel memory limits and timeouts.

**Major components:**
1. **middleware.ts** — Edge-layer auth guard; validates JWT with `getUser()` (never `getSession()`), enforces role-based route access, refreshes tokens on every request
2. **Admin CRUD pages (`/admin/*`)** — Server Components for data fetching, Client Component forms for mutations via Server Actions; manages clients, branches, equipment, folios, users
3. **Report form wizard (`/tecnico/reporte/`)** — Primarily Client Component; multi-step: equipment selection, photo capture with GPS overlay, materials table, signature pad, submission
4. **Photo capture module** — Native `getUserMedia` → `<video>` preview → `<canvas>` drawImage + metadata overlay → `canvas.toBlob()` → `browser-image-compression` → direct Supabase Storage upload (bypasses Server Actions due to 4.5MB limit)
5. **PDF generator** — `@react-pdf/renderer` running client-side in admin browser; fetches report data + photos + signature + logos; outputs branded multi-page PDF for download
6. **Supabase RLS layer** — `SECURITY DEFINER` helper functions for role checks; prevents infinite recursion; enforces per-technician, per-folio data isolation

### Critical Pitfalls

The 5 highest-severity pitfalls that require architectural decisions before the first line of code:

1. **Android 14/15 file input camera broken** — Chrome dropped camera from `<input type="file" capture>` on Android 14/15; prevents all photo capture. Fix: use `getUserMedia()` API as the primary camera method from the start. Test on real Android 14+ hardware, not emulators.

2. **Supabase RLS infinite recursion** — Cross-table role checks in RLS policies cause circular evaluation and break all queries. Fix: create `SECURITY DEFINER` functions in a private schema for role lookups; never query `users` table directly inside RLS policies. Must be designed into the schema before any data layer is written.

3. **PDF generation memory/timeout on Vercel** — Server-side PDF with 10-20 embedded photos exceeds Vercel's 10s timeout (Hobby) or 4.5MB response limit. Fix: generate PDFs client-side with `@react-pdf/renderer` running in the admin's browser; no serverless function involved. Compress all photos to max 1200px/0.7 quality before embedding.

4. **Canvas memory crashes on budget Android phones** — A 12MP photo requires ~48MB RAM for canvas processing; 2-3 such operations crash low-end phones. Fix: constrain `getUserMedia` to 1600x1200 at capture time; resize before canvas processing; use `canvas.toBlob()` not `toDataURL()`; release canvas references after use.

5. **`getSession()` is a security vulnerability in server code** — `getSession()` trusts cookies without JWT validation; attackers can spoof sessions. Fix: always use `supabase.auth.getUser()` in middleware and Server Components. No exceptions.

---

## Implications for Roadmap

Based on the dependency chain identified in ARCHITECTURE.md and FEATURES.md, and the phase-specific pitfall warnings from PITFALLS.md, the research strongly suggests a 4-phase structure:

### Phase 1: Foundation (Auth + DB Schema + PWA Shell)

**Rationale:** Nothing else is buildable without a working auth system, database schema, and base project structure. This phase also front-loads the two critical security pitfalls (RLS infinite recursion, getSession vulnerability) before they can cause cascading damage.

**Delivers:** A deployed Next.js PWA shell with working login, role-based routing, complete database schema with correct RLS policies, and minimal service worker for installability.

**Addresses:** T7 (status lifecycle model), T8 (folio data model), T10 (Spanish UI foundation)

**Avoids:** Pitfall 2 (RLS recursion — design SECURITY DEFINER functions now), Pitfall 5 (getSession — use getUser() from first middleware commit), Pitfall 14 (user_metadata roles — store roles in DB table)

**Stack elements:** Next.js App Router scaffold, Supabase auth setup (`@supabase/ssr` two-client pattern), Tailwind CSS v4, middleware.ts role routing, manifest.ts PWA metadata, minimal `sw.js`

**Research flag:** Standard patterns (skip additional research) — Supabase SSR auth for Next.js is thoroughly documented with official code examples.

---

### Phase 2: Admin Data Layer (CRUD Management)

**Rationale:** Technician features depend entirely on admin-created data existing first. A tech cannot select equipment that hasn't been registered. A report cannot be attached to a folio that doesn't exist. This phase creates all the reference data the reporting interface needs.

**Delivers:** Admin can manage clients, branches, equipment per branch, users (techs), and folios with crew assignments. All CRUD operations with server-side validation.

**Addresses:** T8 (folio/work order context), T9 (crew assignment), admin prerequisite for all T1-T6 features

**Uses:** Server Component + Client Component form pattern, Server Actions for mutations, react-hook-form + zod with Spanish validation messages

**Implements:** Admin layout (`/admin/*`), CRUD pages (clientes, sucursales, equipos, usuarios, folios, folio_asignados)

**Research flag:** Standard patterns — CRUD with Next.js App Router and Supabase is well-established.

---

### Phase 3: Technician Reporting Interface (Core Product)

**Rationale:** This is the product. All previous phases exist to support this one. It is also the largest and most technically risky phase, containing the two hardest technical problems: camera capture on Android and offline photo reliability. The photo capture module should be prototyped and tested on real Android 14+ hardware before the rest of Phase 3 begins.

**Delivers:** Field technicians can: view assigned folios, create daily reports, select/add equipment, classify work (preventivo/correctivo), capture GPS-stamped photos, log materials used, capture client signature, and submit the completed report.

**Addresses:** T1 (per-equipment entries), T2 (photo + GPS stamps), T3 (digital signature), T5 (materials log), T6 (partial offline — draft save to localStorage minimum), T7 (draft → submitted), T9 (crew shared report via last-write-wins)

**Avoids:** Pitfall 1 (Android 14/15 camera — getUserMedia only, no file input capture), Pitfall 4 (canvas memory — constrain resolution, sequential processing), Pitfall 7 (EXIF rotation — test all 8 orientation values), Pitfall 8 (signature scroll conflict — react-signature-canvas + touch-action: none), Pitfall 9 (slow upload — client-side compression + direct Storage upload bypassing Server Actions), Pitfall 12 (permission timing — request camera only on explicit tap)

**Research flag:** Needs deeper research during planning — specifically the photo capture pipeline (getUserMedia + canvas + compression + upload) and cuadrilla collaboration pattern. These are the highest-risk components; plan them in detail before building.

---

### Phase 4: Admin Review + PDF Export

**Rationale:** Admin review requires submitted reports to exist (Phase 3). PDF generation is the primary output the client sees — it completes the documentation chain. Client-side PDF is the correct architecture; this must be decided and designed before implementation begins to avoid the Vercel serverless pitfall.

**Delivers:** Admin can view all submitted reports, filter by branch/folio/date, edit any field, approve/finalize reports, and export branded PDFs (company logo + client logo + per-equipment entries + photos + materials table + signature).

**Addresses:** T4 (PDF report generation), T7 (reviewed/approved state), D7 (branded PDF — foundation for later multi-tenant branding), D8 (status overview — basic report list with filter)

**Avoids:** Pitfall 3 (Vercel PDF memory/timeout — generate client-side in admin browser), Pitfall 13 (4.5MB response limit — N/A if client-side)

**Stack elements:** `@react-pdf/renderer` client-side, Supabase Storage signed URLs for photos, notification system via Supabase Edge Function or realtime postgres_changes

**Research flag:** Needs research-phase for PDF template design — `@react-pdf/renderer` has unique layout constraints (Yoga flexbox, no CSS grid, no arbitrary fonts without registration). Plan the PDF component structure before building. Server-side photo fetching for PDF is MEDIUM confidence — test with 20 photos before committing to final approach.

---

### Phase Ordering Rationale

- **Auth before everything:** The middleware, RLS, and two-client Supabase pattern must be correct from the first commit. Retrofitting security is painful and error-prone.
- **Admin CRUD before tech features:** The technician form is purely consumption of admin-created data. Building it first would require mocking that data and then replacing all the mocks.
- **Photo capture prototype early in Phase 3:** This is the highest-risk component (Android device bugs, memory constraints). Spike it in the first week of Phase 3; if it surfaces unexpected issues, there is time to adapt.
- **PDF last:** PDFs require complete, real report data to look right. Building PDF templates against mock data leads to layout surprises when real photos and Spanish text are plugged in.
- **Offline (T6) deferred to V4 per project scope:** The V1 service worker needs only installability and push notifications — not full IndexedDB sync. Serwist caching strategies are a Phase 5+ concern.

### Research Flags

Phases needing `/gsd:research-phase` during planning:
- **Phase 3 (Photo Capture module):** Camera API + canvas + GPS + compression pipeline has multiple Android-specific failure modes. Research the exact getUserMedia constraints, canvas sizing limits, and Supabase Storage resumable upload TUS implementation before building.
- **Phase 4 (PDF template):** `@react-pdf/renderer` v4 has its own layout model (Yoga flexbox). Research the component API for tables, image embedding at scale, and multi-page layout before designing the PDF template.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Official Supabase SSR + Next.js App Router documentation is complete and well-tested. The middleware pattern and two-client setup are copy-paste documented.
- **Phase 2 (Admin CRUD):** Server Component + Server Action pattern is the default Next.js App Router pattern. No research needed beyond what is in ARCHITECTURE.md.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All library versions verified against npm registries and official docs as of 2026-02-23. Alternatives considered and rejected with documented rationale. |
| Features | HIGH | Table stakes cross-verified across 6+ major FSM platforms. Domain patterns are consistent and well-documented. Crew collaboration is MEDIUM (commercial HVAC specific, less documented than residential). |
| Architecture | HIGH | Core patterns (Server/Client Components, middleware auth, RLS) verified against official Next.js and Supabase docs. PDF server-side embedding is MEDIUM — needs real-photo testing. |
| Pitfalls | HIGH | Critical pitfalls backed by official documentation, GitHub issues with hundreds of reports, and direct prior experience (RLS recursion). EXIF orientation is MEDIUM — modern Chrome auto-corrects but edge cases exist. |

**Overall confidence: HIGH**

### Gaps to Address

- **Offline scope for V1:** Research confirmed offline is table stakes for the domain, but the project brief defers full offline to V4. During Phase 1 planning, decide the minimum offline story for V1 (at minimum: localStorage draft save, no sync queue). Document this decision explicitly so techs are not surprised.
- **Photo compression tuning:** `browser-image-compression` config (maxSizeMB, quality) needs calibration against real HVAC field photos (varying lighting, resolution). Budget time in Phase 3 for this tuning pass.
- **PDF with 20+ photos:** The client-side PDF approach is recommended but needs validation at scale. During Phase 4 planning, run a spike with 20 real photos to confirm browser memory is manageable and rendering time is acceptable.
- **cuadrilla conflict resolution:** Last-write-wins is correct for V1, but the exact concurrent-edit scenario (two techs editing the same equipment entry simultaneously) needs a UX decision: silent overwrite, or a "refresh to see latest" toast?
- **Spanish PDF characters:** `@react-pdf/renderer` requires explicit font registration for non-ASCII characters (n with tilde, accented vowels). Confirm font embedding works before designing the full PDF template.

---

## Sources

### Primary (HIGH confidence)
- [Next.js official docs](https://nextjs.org/docs/app) — App Router, Server/Client Components, PWA guide, middleware
- [Supabase official docs](https://supabase.com/docs) — SSR auth for Next.js, RLS, Storage, resumable uploads, custom claims RBAC
- [Vercel documentation](https://vercel.com/docs/functions/limitations) — Function limits, response body limits, timeout tiers
- [Serwist documentation](https://serwist.pages.dev/docs/next/getting-started) — PWA successor to next-pwa
- npm registry — All library versions verified: Next.js 16.1.6, Tailwind 4.2.0, @supabase/supabase-js 2.97.0, @supabase/ssr 0.8.0, @serwist/next 9.2.3, react-hook-form 7.71.2, zod 4.3.6, @react-pdf/renderer 4.3.2

### Secondary (MEDIUM confidence)
- [BuildOps HVAC reporting guide](https://buildops.com/resources/hvac-service-report/) — Commercial HVAC feature patterns
- [ServiceTitan HVAC software](https://www.servicetitan.com/industries/hvac-software) — Feature set and mobile app
- [Housecall Pro](https://www.housecallpro.com/features/mobile-app/) — Technician mobile features
- [FieldPulse](https://www.fieldpulse.com/solutions/hvac-r) — Field reporting and dashboards
- [Addpipe: Android 14/15 file input camera bug](https://blog.addpipe.com/html-file-input-accept-video-camera-option-is-missing-android-14-15/) — Android camera pitfall
- [@react-pdf/renderer server-side discussion](https://github.com/diegomura/react-pdf/discussions/2402) — PDF server-side feasibility
- [jsPDF memory issues](https://github.com/parallax/jsPDF/issues/844) — Confirmed rejection rationale
- [signature_pad mobile scroll issue](https://github.com/szimek/signature_pad/issues/318) — Touch event handling

### Tertiary (LOW confidence, needs validation)
- Spanish PDF character rendering with `@react-pdf/renderer` — gap identified, needs implementation testing
- `browser-image-compression` config for real HVAC photos — calibration required in Phase 3

---
*Research completed: 2026-02-23*
*Ready for roadmap: yes*
