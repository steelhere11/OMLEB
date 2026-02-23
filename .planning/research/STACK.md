# Technology Stack

**Project:** OMLEB - HVAC Field Service Daily Report PWA
**Researched:** 2026-02-23
**Overall Confidence:** HIGH (all core libraries verified via npm/official docs)

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js (App Router) | ^16.1.6 | Full-stack React framework | Latest stable (Feb 4 2026). App Router is the standard for new projects. Turbopack default for dev+build. Built-in API routes, server components, image optimization. Vercel deploy is zero-config. | HIGH |
| React | ^19.x | UI library | Ships with Next.js 16. Required for server components, `use()` hook, React Compiler support. | HIGH |
| TypeScript | ^5.x | Type safety | Ships with Next.js 16. Non-negotiable for any project beyond a toy. Catches bugs at dev time. | HIGH |
| Tailwind CSS | ^4.2.0 | Styling | Latest (Feb 19 2026). v4 is a ground-up rewrite: 5x faster builds, zero-config (`@import "tailwindcss"`), CSS-native cascade layers, `@property`. Perfect for mobile-first utility styling. | HIGH |

### Backend / Database / Auth

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @supabase/supabase-js | ^2.97.0 | Supabase client SDK | Latest stable (Feb 2026). Isomorphic client for DB queries, auth, storage, realtime. Mature, well-documented. | HIGH |
| @supabase/ssr | ^0.8.0 | Server-side Supabase client | Official package for Next.js App Router cookie-based auth. Replaces deprecated `@supabase/auth-helpers-nextjs`. Two-client pattern: `createBrowserClient` + `createServerClient`. | HIGH |
| Supabase (hosted) | N/A | Auth, Postgres DB, Storage, Edge Functions | All-in-one backend. Free tier covers 2-5 techs easily. Auth with email/password (Spanish UI). Storage for photos. Row Level Security for multi-tenant isolation. No separate backend to build or deploy. | HIGH |

### PWA Infrastructure

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @serwist/next | ^9.2.3 | Service worker / PWA | The modern successor to next-pwa (which is dead/unmaintained). Built on Google Workbox. Works with Next.js 16. Handles manifest, offline caching, install prompt. NOTE: Does not support Turbopack dev -- use `--webpack` flag for PWA testing. | HIGH |
| serwist | ^9.5.6 | Service worker utilities | Core precaching and SW utilities used alongside @serwist/next. | HIGH |

### Forms & Validation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| react-hook-form | ^7.71.2 | Form state management | Latest (Feb 2026). Uncontrolled forms = minimal re-renders. Perfect for mobile perf. 8500+ dependents, battle-tested. Native integration with Zod via `@hookform/resolvers`. | HIGH |
| zod | ^4.3.6 | Schema validation | Latest stable. TypeScript-first, composable schemas. Validates form inputs AND API payloads. Infers TS types from schemas (single source of truth). v4 adds JSON Schema conversion. | HIGH |
| @hookform/resolvers | latest | RHF + Zod bridge | Connects react-hook-form to Zod schemas for declarative validation. Trivial to set up. | HIGH |

### Camera & Photo Processing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Native `getUserMedia` API | N/A | Camera access | No library needed. All modern mobile browsers support `navigator.mediaDevices.getUserMedia()`. Avoids react-webcam (last updated 2+ years ago, stale). Direct API gives full control over constraints (rear camera, resolution). | HIGH |
| Native `<canvas>` API | N/A | Photo stamping (GPS, time, date overlay) | Draw video frame to canvas, overlay text with `ctx.fillText()`, export as JPEG. No library needed. This is the core of the "metadata burned into photo" requirement. Simple, zero-dependency, full control. | HIGH |
| browser-image-compression | ^2.0.2 | Client-side image compression | Compress photos before upload to save bandwidth (field techs often on cellular). Supports `maxSizeMB`, `maxWidthOrHeight`, web worker offloading, EXIF preservation. | MEDIUM |
| exifr | ^7.1.3 | EXIF metadata reading | Read GPS coordinates from phone camera EXIF data as fallback/verification. Blazing fast, runs in browser, converts GPS DMS to decimal degrees. | MEDIUM |

### PDF Generation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @react-pdf/renderer | ^4.3.2 | PDF report generation | React-first: build PDFs with JSX components and CSS-like styles. Supports images, custom fonts, tables. Works server-side (API route) or client-side. 860K weekly downloads. Perfect for branded reports with company/client logos, technician signatures, stamped photos. | HIGH |

### Signature Capture

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| react-signature-canvas | ^1.0.7 | Digital signature pad | React wrapper around signature_pad. Touch-optimized (mobile-first). `getTrimmedCanvas()` removes whitespace. `toDataURL()` exports PNG for PDF embedding. TypeScript types included. 100% test coverage. Lightweight. | HIGH |

### State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| zustand | ^5.x | Client-side state (draft reports, camera state) | ~3KB, zero boilerplate. Stores persist to localStorage for offline draft saving. No Provider wrapper needed. Simpler than Redux for a small app. Well-suited for "draft report in progress" state that survives page refreshes. | MEDIUM |

**NOTE:** For this app's scope (simple CRUD reports, 2-5 users), React Context or even URL state may suffice. Zustand is recommended only if draft-saving / offline persistence is needed. If not, skip it entirely and use `useState` + `useContext`.

### UI Components & Utilities

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| lucide-react | ^0.575.0 | Icons | 1500+ tree-shakable SVG icons. Default for shadcn/ui ecosystem. Consistent 24x24 grid. | HIGH |
| sonner | ^2.0.7 | Toast notifications | Minimal API (`toast("Saved")`), no Provider needed. Adopted by shadcn/ui. Perfect for "report submitted" / "photo saved" feedback. | HIGH |
| dayjs | ^1.11.19 | Date/time formatting | 2KB gzipped. Moment.js-compatible API. Locale support for Spanish (`es`). Used for timestamp formatting on photo overlays and report dates. | HIGH |
| clsx | latest | Conditional class names | Tiny utility for conditional Tailwind classes. Standard practice. | HIGH |

### Deployment

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vercel | N/A | Hosting | Zero-config deploy for Next.js (same company). Free tier handles this scale. Automatic HTTPS (required for PWA + getUserMedia + Geolocation). Edge functions, preview deploys. | HIGH |

---

## What NOT to Use (and Why)

| Category | Avoid | Why Not | Use Instead |
|----------|-------|---------|-------------|
| PWA | `next-pwa` | Unmaintained. Requires webpack but Next.js 16 defaults to Turbopack. Broken with modern Next.js. | `@serwist/next` |
| PWA | `@ducanh2912/next-pwa` | Fork of next-pwa, same webpack dependency problem. Serwist is the actively maintained successor. | `@serwist/next` |
| Supabase Auth | `@supabase/auth-helpers-nextjs` | Officially deprecated. No bug fixes or features. | `@supabase/ssr` |
| Camera | `react-webcam` | Last published 2+ years ago (v7.2.0). Stale. Adds abstraction over a simple API. | Native `getUserMedia` + `<canvas>` |
| Camera | `html5-qrcode`, `instascan` | QR/barcode focused. Not what we need. | Native `getUserMedia` |
| PDF | `jspdf` | Imperative API (not React-like). Manual positioning. No JSX. Fine for simple docs but painful for branded multi-page reports with images. | `@react-pdf/renderer` |
| PDF | `pdfmake` | JSON-based DSL, not React-native. Extra learning curve for a React team. | `@react-pdf/renderer` |
| PDF | `puppeteer` / `playwright` | Headless browser PDF = heavy, slow, requires server with Chrome binary. Overkill. Cannot run on Vercel serverless. | `@react-pdf/renderer` |
| Image processing | `sharp` | Node.js only (libvips binary). Cannot run in browser. For server-side only. Our stamping happens client-side on canvas. | Native `<canvas>` API |
| Image processing | `jimp` | Slower than canvas for simple operations. Larger bundle. We only need drawImage + fillText. | Native `<canvas>` API |
| State | Redux / Redux Toolkit | Massive overkill for 2-5 users, simple CRUD. Boilerplate overhead. | `zustand` or plain React state |
| State | Jotai | Atomic model is better for complex interdependent state. Our state is simple (current report draft). Zustand's single-store is simpler. | `zustand` |
| Date | `moment.js` | Deprecated by its own maintainers. 300KB. | `dayjs` (2KB) |
| Date | `date-fns` | Excellent library but 22MB unpacked. dayjs is smaller and sufficient for our formatting needs. | `dayjs` |
| Forms | Formik | Older, more verbose, slower than react-hook-form. RHF has won the ecosystem. | `react-hook-form` |
| Styling | CSS Modules / styled-components | Extra build complexity. Tailwind v4 is faster, utility-first, mobile-first by design. Industry standard for new projects. | Tailwind CSS v4 |
| Icons | `react-icons` | 50K+ icons = massive bundle risk if not careful. We need a small, consistent set. | `lucide-react` |
| Toasts | `react-toastify` | Heavier, requires CSS import, more config. Sonner is simpler and lighter. | `sonner` |

---

## Alternatives Considered (Justified Decisions)

### PDF: @react-pdf/renderer vs jsPDF

**Decision: @react-pdf/renderer**

| Criterion | @react-pdf/renderer | jsPDF |
|-----------|---------------------|-------|
| API style | Declarative JSX | Imperative `doc.text(x, y, "...")` |
| React integration | Native (components) | None (vanilla JS) |
| Images | `<Image src={...} />` | `doc.addImage(...)` with manual positioning |
| Fonts | `Font.register()`, supports custom | Manual embedding, tricky |
| Complexity for branded reports | Low (JSX layout) | High (manual x/y math) |
| Server-side rendering | Yes (API route) | Yes |
| Weekly downloads | 860K | 2.6M |

jsPDF has more downloads but the imperative API becomes painful for multi-page branded reports with logos, signatures, photos, and tables. @react-pdf/renderer lets you compose PDF pages like React components.

### State: Zustand vs Nothing

For a small CRUD app with 2-5 users, you could skip state management entirely. The only reason to include Zustand is **offline draft persistence** -- saving an in-progress report to localStorage so field techs don't lose work if they close the browser. If that feature is needed (and it should be for field workers), Zustand's `persist` middleware makes it trivial.

### Camera: Native API vs Library

No camera library adds value here. The entire camera flow is:
1. `getUserMedia({ video: { facingMode: 'environment' } })` -- rear camera
2. Render `<video>` element with stream
3. On capture: draw video frame to `<canvas>`, overlay GPS/time/date text with `ctx.fillText()`
4. Export canvas as JPEG blob with `canvas.toBlob()`

This is ~50 lines of code. A library would add dependencies for zero benefit.

---

## Installation

```bash
# Core framework
npx create-next-app@latest omleb-hvac --typescript --tailwind --app --src-dir

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# PWA
npm install @serwist/next serwist

# Forms & validation
npm install react-hook-form zod @hookform/resolvers

# PDF generation
npm install @react-pdf/renderer

# Signature capture
npm install react-signature-canvas
npm install -D @types/react-signature-canvas

# Image processing
npm install browser-image-compression exifr

# State (if offline drafts needed)
npm install zustand

# UI utilities
npm install lucide-react sonner dayjs clsx
```

---

## Key Architecture Notes for Roadmap

### Photo Stamping Flow (Client-Side)
```
Camera (getUserMedia) --> <video> element --> <canvas> drawImage
     |                                            |
     v                                            v
Geolocation API (GPS coords)              ctx.fillText(GPS, time, date)
     |                                            |
     v                                            v
dayjs (format timestamp)                  canvas.toBlob() --> compressed JPEG
                                                   |
                                                   v
                                          browser-image-compression
                                                   |
                                                   v
                                          Supabase Storage upload
```

### PDF Generation Flow
```
Report data (Supabase query) --> React PDF components (@react-pdf/renderer)
     |                                |
     + Stamped photos (Storage URLs)  + Company logo
     + Signature (base64 PNG)         + Client branding
     + Technician info                + Date/location
                                      |
                                      v
                                 PDF Blob --> Download or Email
```

### Supabase Architecture
```
Auth:     Email/password (Spanish UI prompts)
DB:       reports, branches, technicians, clients tables
Storage:  report-photos bucket (stamped JPEGs)
RLS:      Row-level security per technician / branch
```

### PWA Considerations
- Serwist handles service worker registration, precaching, and offline fallback
- HTTPS required (Vercel provides automatically) for getUserMedia + Geolocation + Service Worker
- `manifest.json` via Next.js App Router metadata API
- Install prompt handling for "Add to Home Screen"
- Offline: cache app shell, queue report submissions for when connectivity returns

---

## Version Verification Sources

| Library | Verified Version | Source | Date Checked |
|---------|-----------------|--------|-------------|
| Next.js | 16.1.6 | [endoflife.date](https://endoflife.date/nextjs), [Next.js releases](https://github.com/vercel/next.js/releases) | 2026-02-23 |
| Tailwind CSS | 4.2.0 | [Tailwind releases](https://github.com/tailwindlabs/tailwindcss/releases) | 2026-02-23 |
| @supabase/supabase-js | 2.97.0 | [npm](https://www.npmjs.com/package/@supabase/supabase-js) | 2026-02-23 |
| @supabase/ssr | 0.8.0 | [npm](https://www.npmjs.com/package/@supabase/ssr) | 2026-02-23 |
| @serwist/next | 9.2.3 | [npm](https://www.npmjs.com/package/@serwist/next) | 2026-02-23 |
| serwist | 9.5.6 | [npm](https://www.npmjs.com/package/serwist) | 2026-02-23 |
| react-hook-form | 7.71.2 | [npm](https://www.npmjs.com/package/react-hook-form) | 2026-02-23 |
| zod | 4.3.6 | [npm](https://www.npmjs.com/package/zod) | 2026-02-23 |
| @react-pdf/renderer | 4.3.2 | [npm](https://www.npmjs.com/package/@react-pdf/renderer) | 2026-02-23 |
| react-signature-canvas | 1.0.7 | [npm](https://www.npmjs.com/package/react-signature-canvas) | 2026-02-23 |
| browser-image-compression | 2.0.2 | [npm](https://www.npmjs.com/package/browser-image-compression) | 2026-02-23 |
| exifr | 7.1.3 | [npm](https://www.npmjs.com/package/exifr) | 2026-02-23 |
| lucide-react | 0.575.0 | [npm](https://www.npmjs.com/package/lucide-react) | 2026-02-23 |
| sonner | 2.0.7 | [npm](https://www.npmjs.com/package/sonner) | 2026-02-23 |
| dayjs | 1.11.19 | [npm](https://www.npmjs.com/package/dayjs) | 2026-02-23 |
| zustand | 5.x | [npm](https://www.npmjs.com/package/zustand) | 2026-02-23 |

---

## Sources

- [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Serwist Getting Started](https://serwist.pages.dev/docs/next/getting-started)
- [Supabase SSR Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase Storage Signed URLs](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl)
- [MDN Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [React PDF Official](https://react-pdf.org/)
- [6 PDF Libraries for React 2025](https://dev.to/ansonch/6-open-source-pdf-generation-and-modification-libraries-every-react-dev-should-know-in-2025-13g0)
- [Tailwind CSS v4.0 Blog](https://tailwindcss.com/blog/tailwindcss-v4)
- [State Management in 2025](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k)
- [React Toast Libraries Compared 2025](https://blog.logrocket.com/react-toast-libraries-compared-2025/)
- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16)
- [Build Next.js 16 PWA with Serwist](https://blog.logrocket.com/nextjs-16-pwa-offline-support/)
