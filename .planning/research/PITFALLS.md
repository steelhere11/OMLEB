# Domain Pitfalls

**Domain:** HVAC Field Service Daily Report PWA (Next.js + Supabase + Vercel)
**Researched:** 2026-02-23
**Overall confidence:** HIGH (most pitfalls verified across multiple sources and official documentation)

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or a non-functional product for field workers.

---

### Pitfall 1: Android 14/15 Camera Option Missing from File Input

**What goes wrong:** On Android 14 and 15, Chrome and Edge no longer show the "Camera" option when a `<input type="file" accept="image/*" capture="environment">` element is used. The user only sees "Browse files" or "Gallery" -- no way to take a new photo. This is a **showstopper** for HVAC technicians who need to snap photos in the field.

**Why it happens:** Google changed file input behavior in Chrome on Android 14+. The `accept="image/*"` attribute combined with `capture` no longer triggers the camera chooser on these OS versions.

**Consequences:** Technicians cannot take photos from the app. The entire photo-heavy workflow is broken on the majority of modern Android devices.

**Warning signs:** Works fine in dev on desktop or older Android emulators. Breaks silently on real Android 14/15 devices -- no error, just missing camera option.

**Prevention:**
1. **Use `getUserMedia()` API as primary camera method** -- render a live camera preview in a `<video>` element, capture frames to `<canvas>`. This bypasses the broken file input entirely.
2. **Keep `<input type="file">` as a fallback** for gallery uploads only, WITHOUT `accept` or `capture` attributes (a plain `<input type="file">` still shows camera option on most devices).
3. If you must use file input, add the undocumented workaround: `accept="image/*,android/allowCamera"` -- but this is **not spec-compliant** and may break in future Chrome updates.
4. **Test on a real Android 14+ device** from day one, not just emulators.

**Phase:** Must be addressed in the **first phase** (Technician Camera/Photo Capture). Non-negotiable.

**Confidence:** HIGH -- documented by Addpipe (https://blog.addpipe.com/html-file-input-accept-video-camera-option-is-missing-android-14-15/) and confirmed across multiple browser forums.

---

### Pitfall 2: Supabase RLS Infinite Recursion on Role-Based Policies

**What goes wrong:** You write an RLS policy on a table that checks the user's role by SELECTing from a `users` table. But the `users` table also has RLS enabled. When Postgres evaluates the policy, it triggers the `users` table's own RLS policy, which may reference the same or another protected table -- creating infinite recursion. The query fails with `"infinite recursion detected in policy for relation"`.

**Why it happens:** RLS policies are evaluated for every row access. If Policy A on Table X does `SELECT role FROM users WHERE id = auth.uid()`, and Table `users` has its own SELECT policy that does `SELECT ... FROM some_other_table`, you get circular evaluation. This is especially common with role-checking patterns.

**Consequences:** All queries to the affected table fail. The app is completely broken for that role. Hard to debug because the error message is cryptic.

**Warning signs:** Works fine with `service_role` key (bypasses RLS). Fails only with `anon` key or authenticated user JWT. Error mentions "infinite recursion."

**Prevention:**
1. **Create a `SECURITY DEFINER` function** in a private schema to check roles:
   ```sql
   CREATE OR REPLACE FUNCTION private.get_user_role()
   RETURNS text
   LANGUAGE sql
   SECURITY DEFINER
   SET search_path = ''
   AS $$
     SELECT rol FROM public.users WHERE id = auth.uid()
   $$;
   ```
2. **Use this function in RLS policies** instead of direct table SELECTs:
   ```sql
   CREATE POLICY "admin_full_access" ON reportes
     FOR ALL USING (private.get_user_role() = 'admin');
   ```
3. **Wrap the function call in a SELECT** for performance (Postgres caches it per-statement):
   ```sql
   USING ((SELECT private.get_user_role()) = 'admin')
   ```
4. **Never create SECURITY DEFINER functions in the `public` schema** -- they'd be exposed via the API. Use a `private` schema not in Supabase's "Exposed schemas."
5. **Keep the `users` table's RLS policies simple** -- ideally just `USING (id = auth.uid())` for SELECT, with no cross-table references.

**Phase:** Must be addressed when **setting up the database schema and RLS** (Phase 1 or earliest DB setup phase).

**Confidence:** HIGH -- the user has prior direct experience with this exact issue in a Flutter/Supabase project. Also confirmed by official Supabase docs (https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) and discussion #1138.

---

### Pitfall 3: PDF Generation Memory Limits on Vercel Serverless Functions

**What goes wrong:** A daily report with 10-20 high-resolution photos (each 2-5 MB as JPEG) is generated as a PDF. The serverless function runs out of memory, times out, or exceeds Vercel's 50 MB function size limit. The PDF either fails to generate or the function crashes silently.

**Why it happens:** Multiple compounding constraints:
- Vercel Hobby plan: **10s execution timeout**, 1024 MB memory
- Vercel Pro plan: **60s execution timeout**, 3008 MB memory (configurable)
- Serverless function bundle size limit: **50 MB** (including dependencies)
- `@react-pdf/renderer` adds ~1.5 MB minified to the bundle
- `jsPDF` with `addImage()` holds all images as base64 in memory simultaneously (known memory leak issue #844, #2025 on the jsPDF repo)
- Puppeteer/Chromium approaches exceed the 50 MB limit entirely

**Consequences:** PDFs with many photos fail to generate. Admins cannot export reports. On Hobby plan, even moderate PDFs may timeout.

**Warning signs:** PDF generation works with 1-2 photos in dev but fails with 10+ photos. Works locally but fails on Vercel.

**Prevention:**
1. **Compress photos BEFORE they enter the PDF pipeline** -- resize to max 1200px wide, JPEG quality 0.7. This is the single most impactful optimization.
2. **Generate PDFs client-side with `@react-pdf/renderer`** rather than server-side. The admin's browser has more memory and no timeout constraint. Download the result directly.
3. If server-side is required, **use `@react-pdf/renderer` in a Next.js API route** with `serverComponentsExternalPackages` config, and set `maxDuration` to 60s (Pro plan).
4. **Process images as streams, not base64** where possible. Avoid `jsPDF.addImage()` with base64 for many images -- it accumulates memory.
5. **Cap photos per PDF** at a reasonable limit (e.g., 20 photos max) and paginate if needed.
6. **Use Supabase Storage signed URLs** to fetch images on-demand during PDF generation rather than loading all into memory upfront.

**Phase:** Must be addressed during **PDF Export implementation**. Architecture decision (client vs. server) should be made during planning.

**Confidence:** HIGH -- Vercel limits are well-documented (https://vercel.com/docs/functions/limitations), jsPDF memory issues are confirmed in GitHub issues.

---

### Pitfall 4: Photo Memory Crashes on Low-End Android Devices

**What goes wrong:** When a technician takes a photo, the app processes it through a `<canvas>` element (for metadata overlay, compression, orientation fix). On low-end Android phones, processing a 12+ megapixel photo (4000x3000 pixels = 48 MB uncompressed in RGBA) causes the browser tab to crash with "Canvas: trying to draw too large" or an out-of-memory error.

**Why it happens:** A 4000x3000 image requires ~48 MB of RAM just for the canvas pixel buffer. Add the original image, the processed output, and the metadata overlay canvas, and you're at 150+ MB for a single photo. Low-end phones (2-3 GB RAM) with Chrome running can't handle this.

**Consequences:** The app crashes or the browser tab reloads, losing all in-progress form data. The technician has to start over.

**Warning signs:** Works fine on the developer's phone (high-end). Crashes on the technicians' phones (budget/mid-range).

**Prevention:**
1. **Resize photos immediately upon capture** -- before any canvas processing. Target max 1600px on the longest edge (sufficient for report quality, manageable for canvas).
2. **Use `canvas.toBlob()` instead of `canvas.toDataURL()`** -- toBlob is asynchronous and doesn't create a massive base64 string in memory.
3. **Process one photo at a time**, never multiple simultaneously. Queue photo processing sequentially.
4. **Release canvas references** explicitly after processing (`canvas.width = 0; canvas.height = 0;`).
5. **Set `<video>` constraints** when using getUserMedia: `{ video: { width: { ideal: 1600 }, height: { ideal: 1200 } } }` to capture at a reasonable resolution from the start.
6. **Test on a budget Android device** (~$150 range, 3-4 GB RAM) early in development.

**Phase:** Must be addressed during **Photo Capture & Metadata Overlay** implementation.

**Confidence:** HIGH -- confirmed across multiple GitHub issues (canvas-size #13, expo #21949, react-native #23479) and web platform documentation.

---

### Pitfall 5: Supabase Auth Session Handling -- getSession() vs getUser() in Server Code

**What goes wrong:** You use `supabase.auth.getSession()` in Next.js middleware or Server Components to check if the user is authenticated and get their role. The session appears valid (it comes from cookies) but the token may be expired, tampered with, or stale. You make authorization decisions based on an unvalidated token.

**Why it happens:** `getSession()` reads the session from local storage or cookies **without revalidating** the JWT against the Supabase Auth server. It trusts the stored token. In middleware, this means an expired or manipulated token could pass your auth checks.

**Consequences:** Security vulnerability -- users could access routes they shouldn't. Expired sessions appear active. Role checks may use stale data.

**Warning signs:** Auth "works" in development but behaves inconsistently in production. Users sometimes stay "logged in" after their session should have expired.

**Prevention:**
1. **Use `supabase.auth.getUser()` for any authorization decision** -- it validates the token against the Supabase Auth server every time.
2. **For custom claims/role checks in middleware**, use `supabase.auth.getClaims()` (validates JWT signature against published public keys).
3. **Never trust `getSession()` for security-critical decisions** -- use it only for UI display hints (showing a name, avatar).
4. **Implement middleware that refreshes tokens** -- Server Components can't write cookies, so middleware must handle token refresh.
5. Follow the official pattern: https://supabase.com/docs/guides/auth/server-side/nextjs

**Phase:** Must be addressed during **Authentication & Authorization setup** (Phase 1).

**Confidence:** HIGH -- explicitly stated in official Supabase docs: "Never trust supabase.auth.getSession() inside server code such as middleware."

---

## Moderate Pitfalls

Mistakes that cause significant delays, rework, or degraded UX.

---

### Pitfall 6: next-pwa is Deprecated -- Serwist is the Replacement

**What goes wrong:** You install `next-pwa` (the original package) and it doesn't work with Next.js 14+ App Router, or it works but with no updates/security patches. Turbopack (default in Next.js 16) is incompatible with `next-pwa` entirely.

**Why it happens:** The original `next-pwa` package hasn't been updated in 2+ years. The ecosystem has moved to Serwist (`@serwist/next`), which is the official successor.

**Prevention:**
1. **Use `@serwist/next`** (not `next-pwa` or `@ducanh2912/next-pwa`).
2. Install: `npm install @serwist/next @serwist/precaching @serwist/sw`
3. Alternatively, for V1 with a tight timeline, **use Next.js's built-in PWA support** (manifest.json + manual service worker) without any third-party library. The official Next.js PWA guide (https://nextjs.org/docs/app/guides/progressive-web-apps) shows how to do this without dependencies.
4. For this project, offline is V4 -- so V1 only needs installability (manifest + icons), not a full service worker strategy.

**Phase:** Address during **PWA Configuration** setup.

**Confidence:** HIGH -- confirmed by official Next.js docs and Serwist documentation.

---

### Pitfall 7: EXIF Orientation Causes Rotated/Upside-Down Photos

**What goes wrong:** A technician takes a photo holding their phone vertically. When the photo is drawn onto a `<canvas>` for metadata overlay, it appears rotated 90 degrees or upside down. The metadata overlay is burned into the wrong orientation, and the final photo in the report looks broken.

**Why it happens:** Mobile cameras store images in landscape orientation internally and embed an EXIF orientation tag (values 1-8) telling software how to rotate for display. When you load the image into a `<canvas>` via `drawImage()`, most browsers now auto-correct EXIF orientation -- but older browsers and some edge cases don't. Inconsistency across browsers causes confusion.

**Prevention:**
1. **Modern browsers (Chrome 81+, Firefox 26+) auto-correct EXIF orientation** when drawing images to canvas via `drawImage()`. For this project's target (Android Chrome on recent devices), auto-correction is reliable.
2. **Still strip/normalize EXIF data** after canvas processing to prevent double-rotation when the image is later displayed elsewhere.
3. **Test all 8 EXIF orientation values** -- portrait, landscape, flipped variants. Use a test image set.
4. If supporting older browsers, use `blueimp-load-image` or read EXIF manually with `exif-js` and apply canvas transforms.
5. **After canvas processing, export as a new JPEG** (via `canvas.toBlob('image/jpeg', 0.8)`) -- this creates a clean image with orientation 1 (no rotation needed).

**Phase:** Address during **Photo Capture & Metadata Overlay** implementation.

**Confidence:** MEDIUM -- browser auto-correction behavior varies by version. Modern Chrome handles it well, but worth testing.

---

### Pitfall 8: Signature Canvas Scrolls the Page Instead of Drawing

**What goes wrong:** The technician tries to draw a signature on the signature pad. Instead of drawing, the touch gesture scrolls the entire page. Or worse, the page scrolls AND draws simultaneously, creating a jagged line while the view jumps around.

**Why it happens:** Mobile browsers interpret touch events on canvas as scroll gestures by default. Without explicit `e.preventDefault()` on `touchstart`/`touchmove` events with `{ passive: false }`, the browser's default scroll behavior takes over.

**Prevention:**
1. **Use `signature_pad` library** (https://github.com/szimek/signature_pad) or its React wrapper `react-signature-canvas` -- these handle touch events correctly out of the box.
2. **If building custom**: Add touch event listeners with `{ passive: false }` and call `e.preventDefault()`:
   ```js
   canvas.addEventListener('touchstart', (e) => { e.preventDefault(); }, { passive: false });
   canvas.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });
   ```
3. **Wrap the signature canvas in a container** that has `touch-action: none` CSS -- this tells the browser not to handle touch gestures on that element.
4. **Make the signature area large enough** (at least 300px tall) so the user doesn't accidentally touch outside the canvas.
5. **Clear canvas properly**: Use `canvas.width = canvas.width` to fully reset the canvas context, not just `ctx.clearRect()`.

**Phase:** Address during **Signature Capture** implementation (only required for "Completado" status).

**Confidence:** HIGH -- well-documented issue across signature_pad GitHub issues (#16, #318) and web development guides.

---

### Pitfall 9: Supabase Storage Upload Fails on Slow Mobile Connections

**What goes wrong:** A technician on a job site with poor cellular signal tries to upload a 5 MB photo. The standard upload times out. The photo is lost. The technician has to retake it and try again, potentially multiple times.

**Why it happens:** Supabase's standard upload method sends the entire file in a single HTTP request. On a slow or unstable mobile connection, this request may timeout before completing. There's no resume capability -- if it fails at 90%, the entire upload starts over.

**Prevention:**
1. **Compress photos client-side before upload** -- resize to max 1600px, JPEG quality 0.7-0.8. A 5 MB photo becomes ~200-400 KB.
2. **Use Supabase Resumable Uploads (TUS protocol)** for files >1 MB:
   ```js
   const { data, error } = await supabase.storage
     .from('fotos')
     .uploadToSignedUrl(path, token, file, { upsert: true })
   ```
   Or use the TUS client directly for chunked 6 MB uploads with automatic retry.
3. **Show upload progress** to the technician so they know it's working.
4. **Queue uploads** -- save photos locally (IndexedDB / blob URL) and upload sequentially with retry logic.
5. **Don't block form submission on upload completion** -- let the technician continue filling the report while photos upload in the background.

**Phase:** Address during **Photo Upload Pipeline** implementation.

**Confidence:** HIGH -- Supabase officially recommends TUS resumable uploads for files >6 MB (https://supabase.com/docs/guides/storage/uploads/resumable-uploads).

---

### Pitfall 10: Spanish-Only UI Without i18n Framework Creates Technical Debt

**What goes wrong:** Since the entire UI is Spanish, developers hardcode Spanish strings directly in JSX. Later, when the client wants English labels for an international contractor, or when error messages from libraries come through in English mixed with Spanish UI, there's no clean way to change it.

**Why it happens:** "We only need Spanish" seems like it eliminates the need for i18n. Developers skip the abstraction layer and put strings inline.

**Prevention:**
1. **For V1 with a tight timeline, hardcoded Spanish strings are acceptable** -- but keep them organized:
   - Put all user-facing strings in a single `constants/labels.ts` file or colocated `*.labels.ts` files
   - Never hardcode strings deep inside component logic
2. **Handle special characters correctly**: Ensure all files are UTF-8 encoded. Spanish characters (n with tilde, accented vowels, inverted punctuation marks) must render correctly in HTML, PDF, and form inputs.
3. **Date/number formatting**: Use `Intl.DateTimeFormat('es-MX', ...)` and `Intl.NumberFormat('es-MX', ...)` -- not manual string formatting. Mexican Spanish date format is DD/MM/YYYY, not MM/DD/YYYY.
4. **PDF rendering**: Verify that `@react-pdf/renderer` or `jsPDF` correctly renders Spanish characters. Some PDF libraries require explicit font embedding for non-ASCII characters.
5. **Form validation messages**: Libraries like `zod` return English error messages by default. Use `.refine()` with custom Spanish messages or configure a custom error map.
6. **Supabase error messages** come in English -- wrap them before displaying to users.

**Phase:** Address throughout all phases. String organization pattern should be established in Phase 1.

**Confidence:** MEDIUM -- general i18n best practices. Spanish-specific PDF character rendering needs testing.

---

## Minor Pitfalls

Mistakes that cause annoyance or minor rework.

---

### Pitfall 11: PWA Install Prompt Timing Annoys Users

**What goes wrong:** The "Add to Home Screen" prompt fires immediately on first visit, before the technician understands what the app is. They dismiss it. On Chrome, the prompt won't appear again for 90 days (or until the user clears site data).

**Prevention:**
1. **Intercept the `beforeinstallprompt` event** and store it. Show the prompt only after the user has logged in successfully or completed their first action.
2. **Add a manual "Install App" button** in the app settings or header that triggers the stored prompt.
3. For technician onboarding, have the admin install the PWA on the technician's phone as part of account setup.

**Phase:** Address during PWA configuration, but low priority for V1.

---

### Pitfall 12: Camera Permission Prompt Fires Too Early

**What goes wrong:** The app requests camera permission on page load or navigation. The browser shows a permission popup before the user understands why. The user denies it. On Android Chrome, they now have to go to browser settings to re-enable it.

**Prevention:**
1. **Request camera permission only when the user taps a "Take Photo" button** -- just-in-time permission requests.
2. **Show an explanatory message before the permission prompt**: "The app needs camera access to photograph equipment."
3. **Handle the "denied" state gracefully** -- show instructions for re-enabling in browser settings.
4. **Check permission status first** with `navigator.permissions.query({ name: 'camera' })` before calling `getUserMedia()`.

**Phase:** Address during Photo Capture implementation.

---

### Pitfall 13: Vercel 4.5 MB Response Body Limit for API Routes

**What goes wrong:** You generate a PDF server-side in an API route and try to return it in the response. A PDF with many embedded photos exceeds 4.5 MB. Vercel silently truncates the response or returns a 500 error.

**Why it happens:** Vercel serverless functions have a 4.5 MB response body size limit.

**Prevention:**
1. **Generate PDF client-side** (recommended for this project).
2. If server-side: **Upload the generated PDF to Supabase Storage** and return a signed URL instead of the PDF bytes.
3. **Stream the response** -- Vercel Edge Functions have a 25 MB streaming limit (better than the 4.5 MB serverless limit).

**Phase:** Address during PDF Export implementation.

**Confidence:** HIGH -- documented at https://vercel.com/docs/functions/limitations

---

### Pitfall 14: `user_metadata` in JWT is Editable by Users

**What goes wrong:** You store the user's role in `user_metadata` (set during signup or by admin) and reference it in RLS policies or middleware. But authenticated users can call `supabase.auth.updateUser({ data: { role: 'admin' } })` and promote themselves.

**Why it happens:** `user_metadata` is writable by the authenticated user. It was designed for profile preferences, not authorization.

**Prevention:**
1. **Store roles in a database `users` table**, not in `user_metadata`.
2. **Use a `SECURITY DEFINER` function** to read the role (see Pitfall 2).
3. If using custom claims via Auth Hook, the hook reads from the DB table (not user_metadata) and injects the role into the JWT. Users can't modify the JWT claims directly.
4. **Never use `raw_user_meta_data`** in RLS policies for authorization.

**Phase:** Address during Authentication & Database Schema setup (Phase 1).

**Confidence:** HIGH -- explicitly warned in Supabase docs.

---

### Pitfall 15: Service Worker Caches Stale App Versions

**What goes wrong:** After deploying an update, technicians still see the old version of the app. Their service worker serves cached assets. They don't know there's an update. Bug fixes don't reach them.

**Prevention:**
1. For V1, **use a minimal service worker** that only caches the app shell, not API responses or dynamic content.
2. **Implement an update notification**: Listen for the `controllerchange` event and show "New version available -- tap to refresh."
3. **Use `skipWaiting()` + `clients.claim()`** in the new service worker to take control immediately on update.
4. Since V1 doesn't need offline (that's V4), keep the service worker very thin -- just enough for installability.

**Phase:** Address during PWA Configuration.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Severity |
|---|---|---|---|
| **Database & Auth Setup** | RLS infinite recursion (Pitfall 2), user_metadata editable (Pitfall 14), getSession trust (Pitfall 5) | SECURITY DEFINER functions, roles in DB table, use getUser() | Critical |
| **Photo Capture** | Android 14/15 camera missing (Pitfall 1), memory crashes (Pitfall 4), EXIF rotation (Pitfall 7), permission timing (Pitfall 12) | getUserMedia API, resize before canvas, test on real device | Critical |
| **Photo Upload** | Slow connection failures (Pitfall 9) | Client-side compression, resumable uploads, background queue | Moderate |
| **PDF Export** | Vercel memory/timeout (Pitfall 3), response body limit (Pitfall 13), jsPDF memory leak | Client-side generation, compressed images, Supabase Storage for output | Critical |
| **Signature Capture** | Page scroll conflict (Pitfall 8) | signature_pad library, touch-action: none, passive: false | Moderate |
| **PWA Setup** | next-pwa deprecated (Pitfall 6), stale cache (Pitfall 15), install prompt timing (Pitfall 11) | Serwist or manual SW, minimal caching for V1 | Moderate |
| **Spanish UI** | Hardcoded strings, character encoding, date format (Pitfall 10) | Centralized labels, Intl API, UTF-8 everywhere | Minor |

---

## Architecture Decision: Client-Side vs Server-Side PDF Generation

This decision is critical enough to call out separately. The evidence strongly favors **client-side PDF generation** for this project:

| Factor | Client-Side | Server-Side (Vercel) |
|---|---|---|
| Memory limit | Browser (multi-GB) | 1-3 GB (Vercel function) |
| Timeout | None | 10-60s depending on plan |
| Response body limit | N/A | 4.5 MB |
| Bundle size concern | Adds to client JS | Adds to function size (50 MB limit) |
| Photo access | Already in browser memory | Must fetch from Storage |
| Cost | Free (runs on admin's device) | Serverless invocations |
| Offline potential (V4) | Works offline | Requires connection |

**Recommendation:** Use `@react-pdf/renderer` client-side in the admin's browser. The admin reviews the report, clicks "Export PDF," the browser generates it, and the file downloads directly. No serverless function involved.

---

## Sources

- Addpipe: Android 14/15 file input camera issue -- https://blog.addpipe.com/html-file-input-accept-video-camera-option-is-missing-android-14-15/
- Supabase RLS troubleshooting -- https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv
- Supabase infinite recursion discussion -- https://github.com/orgs/supabase/discussions/1138
- Supabase server-side auth for Next.js -- https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase resumable uploads -- https://supabase.com/docs/guides/storage/uploads/resumable-uploads
- Supabase custom claims RBAC -- https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac
- Vercel function limitations -- https://vercel.com/docs/functions/limitations
- Vercel body size limit -- https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions
- jsPDF memory leak with images -- https://github.com/parallax/jsPDF/issues/844, https://github.com/parallax/jsPDF/issues/2025
- @react-pdf/renderer bundle size -- https://github.com/diegomura/react-pdf/issues/632
- Canvas memory crashes on Android -- https://github.com/jhildenbiddle/canvas-size/issues/13
- Next.js PWA guide -- https://nextjs.org/docs/app/guides/progressive-web-apps
- Serwist (next-pwa successor) -- https://javascript.plainenglish.io/building-a-progressive-web-app-pwa-in-next-js-with-serwist-next-pwa-successor-94e05cb418d7
- signature_pad mobile scroll issue -- https://github.com/szimek/signature_pad/issues/318
- EXIF orientation in JavaScript -- https://medium.com/@dollyaswin/image-rotation-problem-from-mobile-phone-camera-javascript-flutter-e38fcba58c5f
