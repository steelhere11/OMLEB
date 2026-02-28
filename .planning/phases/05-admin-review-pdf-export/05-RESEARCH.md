# Phase 5: Admin Review & PDF Export - Research

**Researched:** 2026-02-28
**Domain:** Admin report management (list, filter, edit, approve), client-side PDF generation with @react-pdf/renderer, embedded photos and signatures in PDF
**Confidence:** HIGH

## Summary

Phase 5 completes the documentation chain by enabling admins to view all submitted reports, edit/overwrite any field, approve reports, and export professional branded PDFs. The phase splits into three natural units: (1) report list with filters and detail view, (2) admin edit/approve workflow, and (3) PDF generation.

The admin report list and edit functionality follows existing codebase patterns exactly -- server components for data fetching, Supabase queries with joins, and server actions for mutations. The admin already has full CRUD RLS policies (`reportes_admin_all`, `reporte_equipos_admin_all`, etc.) on all report-related tables, so no database changes are needed.

PDF generation uses `@react-pdf/renderer` v4.3.2 (client-side, locked decision). The library supports React 19 since v4.1.0 and works with base64 image strings natively. The critical finding is that `@react-pdf/renderer`'s Image component uses XHR to fetch remote URLs, which is subject to browser CORS restrictions. Supabase Storage public bucket URLs may or may not include proper CORS headers depending on configuration. The safest approach is to pre-fetch all photos via the browser's `fetch()` API (which respects CORS but Supabase public buckets should allow it) and convert them to base64 data URIs before passing to the PDF renderer. This also avoids the renderer making 20+ individual network requests during PDF generation.

**Primary recommendation:** Build the admin report list as a server component with URL-based search params for filtering. Use inline editing on the report detail page (same field types as the technician form but without the mobile-first constraints). For PDF generation, use the `pdf().toBlob()` imperative API to generate on-demand when the admin clicks "Exportar PDF", pre-fetching all photos as base64 before rendering. Register Inter font (TTF) for proper Spanish character support.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@react-pdf/renderer` | 4.3.2 | Client-side PDF document creation | React-native JSX syntax for PDF, supports React 19 since v4.1.0, base64 images, custom fonts. Locked decision from roadmap. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | - | - | No additional libraries required. Native `URL.createObjectURL` + anchor download replaces `file-saver`. Existing Supabase client handles all data fetching. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `pdf().toBlob()` imperative API | `PDFDownloadLink` component | PDFDownloadLink renders eagerly on mount, generating the PDF immediately. With 20+ photos this would block the UI. Imperative `pdf().toBlob()` generates on-demand when admin clicks the button. |
| `pdf().toBlob()` imperative API | `usePDF` hook | usePDF is declarative but doesn't trigger re-generation by default. The imperative API is simpler for a one-shot "generate and download" action. |
| Native blob download | `file-saver` | file-saver adds a dependency for a 5-line utility function. Native `URL.createObjectURL` + anchor `click()` works in all modern browsers. |
| Pre-fetch photos as base64 | Pass Supabase URLs directly to Image component | CORS risk with `@react-pdf/renderer`'s XHR-based image fetching. Pre-fetching via `fetch()` and converting to base64 is safer and also avoids 20+ sequential network requests during PDF render. |

### Installation
```bash
npm install @react-pdf/renderer
```

No `@types/` package needed -- `@react-pdf/renderer` ships its own TypeScript types.

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    admin/
      reportes/
        page.tsx                    # Report list with filters (server component)
        [reporteId]/
          page.tsx                  # Report detail view (server component, data fetch)
          report-detail.tsx         # Client component: view + edit sections
          report-edit-actions.ts    # NOT server actions file. See note below.
        actions.ts                  # Server actions: admin update, approve
  components/
    admin/
      report-filters.tsx            # Filter bar (client component for URL params)
      report-pdf-button.tsx         # "Exportar PDF" button with loading state
    pdf/
      report-document.tsx           # @react-pdf/renderer Document component
      pdf-styles.ts                 # StyleSheet.create() for PDF styling
      pdf-fonts.ts                  # Font.register() for Inter
      pdf-utils.ts                  # Pre-fetch images, base64 conversion, download
  lib/
    pdf-generator.ts                # Orchestrator: gather data, pre-fetch images, call pdf().toBlob()
```

**Note on server actions:** The existing codebase places server actions in `src/app/actions/*.ts` (flat structure). Phase 5 should follow the same pattern by adding functions to the existing `src/app/actions/reportes.ts` file for admin operations (update report fields, approve report).

### Pattern 1: URL-Based Report Filtering (Server Component)
**What:** Report list page uses URL search params (`?estatus=completado&sucursal=abc`) for filtering. Server component reads params and constructs Supabase query accordingly.
**When to use:** The admin report list page.
**Why:** No client-side state management needed. URL params are shareable, bookmarkable, and survive page refresh. Follows Next.js App Router patterns.
**Example:**
```typescript
// src/app/admin/reportes/page.tsx
import { createClient } from "@/lib/supabase/server";

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ estatus?: string; sucursal?: string; fecha?: string; folio?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("reportes")
    .select(`
      id, fecha, estatus, finalizado_por_admin,
      folios(numero_folio, clientes(nombre)),
      sucursales(nombre, numero),
      users:creado_por(nombre)
    `)
    .order("fecha", { ascending: false });

  if (params.estatus) {
    query = query.eq("estatus", params.estatus);
  }
  if (params.sucursal) {
    query = query.eq("sucursal_id", params.sucursal);
  }
  // ... more filters

  const { data: reportes } = await query;
  // Render list...
}
```

### Pattern 2: Admin Inline Edit with Server Actions
**What:** Admin opens a report detail page that displays all report data (equipment entries, materials, status, photos, signature). Each section has an edit mode with save buttons that call server actions.
**When to use:** The report detail/edit page.
**Why:** Admin needs to edit/overwrite any field. The existing technician form sections (EquipmentSection, MaterialsSection, StatusSection) provide the UI patterns but need to be adapted for the admin context (desktop layout, no mobile constraints, no "completado" lockout).
**Example:**
```typescript
// src/app/actions/reportes.ts (add to existing file)
export async function adminUpdateEquipmentEntry(
  entryId: string,
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  // Validate and update -- same Zod schema as technician
  const result = reporteEquipoSchema.safeParse({
    equipo_id: formData.get("equipo_id"),
    tipo_trabajo: formData.get("tipo_trabajo"),
    diagnostico: formData.get("diagnostico"),
    trabajo_realizado: formData.get("trabajo_realizado"),
    observaciones: formData.get("observaciones"),
  });

  if (!result.success) {
    return { fieldErrors: z.flattenError(result.error).fieldErrors };
  }

  const { error } = await supabase
    .from("reporte_equipos")
    .update({ ...result.data })
    .eq("id", entryId);

  if (error) {
    return { error: "Error al actualizar: " + error.message };
  }

  revalidatePath("/admin/reportes");
  return { success: true, message: "Guardado" };
}
```

### Pattern 3: Admin Report Approval
**What:** Admin clicks "Aprobar" button on a report detail page. This sets `finalizado_por_admin = true` on the report. This is a terminal approval state.
**When to use:** After admin has reviewed all fields in a report.
**Example:**
```typescript
// src/app/actions/reportes.ts
export async function approveReport(reporteId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  const { error } = await supabase
    .from("reportes")
    .update({ finalizado_por_admin: true })
    .eq("id", reporteId);

  if (error) {
    return { error: "Error al aprobar: " + error.message };
  }

  revalidatePath("/admin/reportes");
  return { success: true, message: "Reporte aprobado" };
}
```

### Pattern 4: Client-Side PDF Generation (Imperative API)
**What:** When admin clicks "Exportar PDF", the app gathers all report data, pre-fetches all photo URLs as base64, then calls `pdf(<ReportDocument data={...} />).toBlob()` and triggers a download.
**When to use:** The PDF export button on the report detail page.
**Why:** Imperative API generates on-demand (not on page load). Pre-fetching photos as base64 avoids CORS issues and batches network requests.
**Example:**
```typescript
// src/lib/pdf-generator.ts
"use client";

import { pdf } from "@react-pdf/renderer";
import { ReportDocument } from "@/components/pdf/report-document";

interface PdfReportData {
  // All report data needed for PDF
  folio: { numero_folio: string; descripcion_problema: string };
  sucursal: { nombre: string; numero: string; direccion: string };
  cliente: { nombre: string; logoBase64: string | null };
  companyLogoBase64: string | null;
  fecha: string;
  estatus: string;
  teamMembers: { nombre: string; rol: string }[];
  equipmentEntries: Array<{
    equipo: { numero_etiqueta: string; marca: string; modelo: string };
    tipo_trabajo: string;
    diagnostico: string | null;
    trabajo_realizado: string | null;
    observaciones: string | null;
    photosBase64: Array<{ data: string; etiqueta: string; gps: string | null; fecha: string | null }>;
  }>;
  materials: Array<{ cantidad: number; unidad: string; descripcion: string }>;
  firmaBase64: string | null;
  nombreEncargado: string | null;
}

export async function generateAndDownloadPdf(data: PdfReportData) {
  const blob = await pdf(<ReportDocument data={data} />).toBlob();

  // Native download without file-saver
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Reporte_${data.folio.numero_folio}_${data.fecha}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

### Pattern 5: Pre-Fetching Photos as Base64
**What:** Before PDF generation, fetch all photo URLs from Supabase Storage and convert to base64 data URIs. This avoids CORS issues and prevents the PDF renderer from making individual network requests.
**When to use:** During PDF generation, before calling `pdf().toBlob()`.
**Example:**
```typescript
// src/components/pdf/pdf-utils.ts
export async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null; // Skip failed images rather than blocking PDF
  }
}

export async function fetchAllPhotosAsBase64(
  photos: Array<{ url: string; etiqueta: string; metadata_gps: string | null; metadata_fecha: string | null }>
): Promise<Array<{ data: string; etiqueta: string; gps: string | null; fecha: string | null }>> {
  const results = await Promise.allSettled(
    photos.map(async (photo) => {
      const base64 = await fetchImageAsBase64(photo.url);
      if (!base64) return null;
      return {
        data: base64,
        etiqueta: photo.etiqueta ?? "",
        gps: photo.metadata_gps,
        fecha: photo.metadata_fecha,
      };
    })
  );
  return results
    .filter((r): r is PromiseFulfilledResult<NonNullable<typeof r extends PromiseFulfilledResult<infer T> ? T : never>> =>
      r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value!);
}
```

### Pattern 6: Font Registration for Spanish Characters
**What:** Register Inter font (TTF, not variable font) with `@react-pdf/renderer` to ensure proper rendering of Spanish characters (accents, tildes, n-tilde).
**When to use:** Once at module level, before any PDF rendering.
**Why:** The default font in `@react-pdf/renderer` may not support all Unicode characters. Inter TTF files include full Latin Extended character sets needed for Spanish.
**Example:**
```typescript
// src/components/pdf/pdf-fonts.ts
import { Font } from "@react-pdf/renderer";

// Register Inter from Google Fonts CDN (static TTF, NOT variable font)
// Variable fonts (single file with weight axis) do NOT work with react-pdf
Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hjQ.ttf",
      fontWeight: 500,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hjQ.ttf",
      fontWeight: 700,
    },
  ],
});

// Disable hyphenation for Spanish (prevents mid-word breaks on accented characters)
Font.registerHyphenationCallback((word) => [word]);
```

**IMPORTANT:** The Google Fonts CDN URLs above are for the Inter font with Latin subset. These URLs point to static TTF files (not variable fonts). The actual URLs should be verified at build time by checking Google Fonts. An alternative is to host the TTF files in the `public/fonts/` directory for offline reliability.

### Anti-Patterns to Avoid
- **Using PDFDownloadLink for reports with photos:** It generates the PDF on mount, which would immediately trigger fetching and rendering 20+ images. Use `pdf().toBlob()` imperative API instead.
- **Passing Supabase Storage URLs directly to Image component:** The `@react-pdf/renderer` Image component uses XHR for fetching, which is subject to CORS. Pre-fetch as base64.
- **Using variable fonts (e.g., Inter Variable) with react-pdf:** PDF 2.0 spec does not support variable fonts. Use static TTF files with specific weights.
- **Rendering PDFs server-side with Next.js App Router:** Server-side rendering of `@react-pdf/renderer` in App Router route handlers has known issues. Client-side generation is the locked decision.
- **Using `ssr: true` (default) for PDF components:** Always use `dynamic(() => import(...), { ssr: false })` for any component that imports from `@react-pdf/renderer`.
- **Generating PDF with uncompressed photos:** Photos are already compressed to ~800KB during upload (Phase 4). No additional compression needed, but avoid fetching original-size images.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF document generation | Custom canvas-to-PDF, jsPDF manual drawing | `@react-pdf/renderer` with React components | JSX-based layout, flexbox support, automatic page breaks, text wrapping, image embedding |
| PDF download trigger | Custom blob handling library | Native `URL.createObjectURL()` + anchor `download` | 5 lines of code, works in all modern browsers, no dependency needed |
| Font subsetting for PDF | Manual font embedding | `@react-pdf/renderer` `Font.register()` | Handles TTF parsing, subsetting, embedding automatically |
| Admin report list filtering | Client-side state + effect-based refetch | URL search params in server component | Next.js native pattern, shareable URLs, no client state management |
| Report data aggregation query | Multiple sequential queries | Single Supabase `.select()` with nested joins | Supabase handles the join; one round-trip |

**Key insight:** The PDF generation is the most technically complex part of this phase, but `@react-pdf/renderer` handles the hard parts (page layout, text wrapping, image embedding, font subsetting). The custom code is the orchestration: gathering data, pre-fetching images, and structuring the document layout.

## Common Pitfalls

### Pitfall 1: CORS with Supabase Storage + @react-pdf/renderer Image
**What goes wrong:** `@react-pdf/renderer`'s Image component fails to load photos from Supabase Storage URLs due to missing CORS headers.
**Why it happens:** The Image component uses XHR to fetch images, which enforces CORS. Supabase public bucket CORS behavior is configurable but not guaranteed to have permissive defaults.
**How to avoid:** Pre-fetch all photos via `fetch()` API (which works with public URLs) and convert to base64 data URIs before passing to the PDF renderer.
**Warning signs:** PDF generates without photos, console shows CORS errors during PDF generation.

### Pitfall 2: @react-pdf/renderer Import in Server Components
**What goes wrong:** Next.js build fails or crashes with `TypeError: ba.Component is not a constructor` or SSR errors.
**Why it happens:** `@react-pdf/renderer` uses browser APIs and is not compatible with server-side rendering in Next.js App Router.
**How to avoid:** Any component or file that imports from `@react-pdf/renderer` must be client-only. Use `"use client"` directive. For the imperative `pdf()` API, call it only from client components. The report detail page can be a server component that passes data down; the PDF button component is a client component.
**Warning signs:** Build errors mentioning `window`, `document`, or React constructor issues.

### Pitfall 3: Variable Fonts in PDF
**What goes wrong:** PDF renders with fallback font (Helvetica) or fails to render text at all.
**Why it happens:** PDF 2.0 specification does not support variable fonts. `@react-pdf/renderer` silently falls back.
**How to avoid:** Use static TTF font files with explicit weight variants (400, 500, 700), not variable font files. Google Fonts provides both; make sure to use the static variants.
**Warning signs:** Font looks different in PDF vs web, or accent characters (a, e, n) render as squares or question marks.

### Pitfall 4: Memory with 20+ Photos as Base64
**What goes wrong:** Browser tab becomes slow or crashes during PDF generation with many photos.
**Why it happens:** Each 800KB JPEG photo becomes ~1.07MB as base64 string (33% overhead). 20 photos = ~21MB of base64 strings in memory, plus the PDF renderer's internal buffers.
**How to avoid:** Photos are already compressed to ~800KB during upload (Phase 4). This keeps the total manageable. For reports with 30+ photos, consider generating the PDF in chunks or showing a progress indicator. Monitor performance during testing.
**Warning signs:** "Generating PDF..." spinner hangs for more than 10 seconds, browser becomes unresponsive.

### Pitfall 5: Admin Overwriting Technician Data Without Audit
**What goes wrong:** Admin edits a report field but there's no record of what the technician originally submitted.
**Why it happens:** Simple UPDATE overwrites the original value.
**How to avoid:** For V1, this is acceptable -- admin is king. The `updated_at` timestamp on the report will change, which provides minimal audit trail. Full audit logging is a V2+ feature. Document this limitation.
**Warning signs:** Technician disputes what they submitted; no way to verify.

### Pitfall 6: PDF Page Breaks with Equipment Entries
**What goes wrong:** Equipment entry text gets split awkwardly across pages, or photos end up on a different page than their equipment entry.
**Why it happens:** `@react-pdf/renderer` handles page breaks automatically but doesn't always know the best place to break.
**How to avoid:** Use `break-inside: "avoid"` style on equipment entry containers. Group photos with their equipment entry in a single View with `wrap={false}` if they fit on one page. For large entries, allow wrapping but ensure the header stays with the first few lines.
**Warning signs:** Equipment label on one page, details on the next; orphaned photos.

## Code Examples

### PDF Document Component Structure
```typescript
// src/components/pdf/report-document.tsx
"use client";

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import "./pdf-fonts"; // Side-effect: registers Inter font

interface PdfReportData {
  folio: { numero_folio: string; descripcion_problema: string };
  sucursal: { nombre: string; numero: string; direccion: string };
  cliente: { nombre: string; logoBase64: string | null };
  companyLogoBase64: string | null;
  fecha: string;
  estatus: string;
  teamMembers: { nombre: string; rol: string }[];
  equipmentEntries: Array<{
    equipo: { numero_etiqueta: string; marca: string | null; modelo: string | null };
    tipo_trabajo: string;
    diagnostico: string | null;
    trabajo_realizado: string | null;
    observaciones: string | null;
    photosBase64: Array<{
      data: string;
      etiqueta: string;
      gps: string | null;
      fecha: string | null;
    }>;
  }>;
  materials: Array<{ cantidad: number; unidad: string; descripcion: string }>;
  firmaBase64: string | null;
  nombreEncargado: string | null;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 10,
    padding: 40,
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottom: "2px solid #2563eb",
    paddingBottom: 12,
  },
  logo: {
    width: 80,
    height: 40,
    objectFit: "contain",
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1e293b",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginTop: 16,
    marginBottom: 8,
    color: "#1e293b",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    fontWeight: 500,
    width: 120,
    color: "#64748b",
  },
  infoValue: {
    flex: 1,
    color: "#1a1a1a",
  },
  equipmentCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  photoContainer: {
    width: "48%",
  },
  photo: {
    width: "100%",
    height: 150,
    objectFit: "cover",
    borderRadius: 2,
  },
  photoLabel: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
    textTransform: "uppercase",
  },
  materialsTable: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    padding: "6 8",
    fontWeight: 700,
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    padding: "4 8",
    borderBottom: "1px solid #f1f5f9",
  },
  signatureSection: {
    marginTop: 30,
    alignItems: "center",
  },
  signatureImage: {
    width: 200,
    height: 80,
    objectFit: "contain",
  },
  signatureLine: {
    width: 250,
    borderBottom: "1px solid #1a1a1a",
    marginTop: 8,
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 10,
    color: "#64748b",
  },
  statusBadge: {
    fontSize: 9,
    fontWeight: 700,
    padding: "2 8",
    borderRadius: 10,
  },
});

export function ReportDocument({ data }: { data: PdfReportData }) {
  return (
    <Document title={`Reporte ${data.folio.numero_folio}`} author="OMLEB">
      <Page size="LETTER" style={styles.page}>
        {/* Header with logos */}
        <View style={styles.header}>
          {data.companyLogoBase64 && (
            <Image src={data.companyLogoBase64} style={styles.logo} />
          )}
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.title}>Reporte de Mantenimiento</Text>
            <Text style={{ fontSize: 11, color: "#64748b" }}>
              Folio: {data.folio.numero_folio}
            </Text>
          </View>
          {data.cliente.logoBase64 && (
            <Image src={data.cliente.logoBase64} style={styles.logo} />
          )}
        </View>

        {/* Report info */}
        <View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha:</Text>
            <Text style={styles.infoValue}>{data.fecha}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sucursal:</Text>
            <Text style={styles.infoValue}>
              {data.sucursal.nombre} ({data.sucursal.numero})
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Direccion:</Text>
            <Text style={styles.infoValue}>{data.sucursal.direccion}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cliente:</Text>
            <Text style={styles.infoValue}>{data.cliente.nombre}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Equipo de trabajo:</Text>
            <Text style={styles.infoValue}>
              {data.teamMembers.map((m) => m.nombre).join(", ")}
            </Text>
          </View>
        </View>

        {/* Equipment entries */}
        <Text style={styles.sectionTitle}>Equipos Atendidos</Text>
        {data.equipmentEntries.map((entry, i) => (
          <View key={i} style={styles.equipmentCard} wrap={false}>
            <Text style={{ fontWeight: 700, marginBottom: 4 }}>
              {entry.equipo.numero_etiqueta}
              {entry.equipo.marca && ` - ${entry.equipo.marca}`}
              {entry.equipo.modelo && ` ${entry.equipo.modelo}`}
            </Text>
            <Text style={{ fontSize: 9, color: "#2563eb", marginBottom: 6 }}>
              {entry.tipo_trabajo === "preventivo" ? "PREVENTIVO" : "CORRECTIVO"}
            </Text>
            {entry.diagnostico && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Diagnostico:</Text>
                <Text style={styles.infoValue}>{entry.diagnostico}</Text>
              </View>
            )}
            {entry.trabajo_realizado && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Trabajo realizado:</Text>
                <Text style={styles.infoValue}>{entry.trabajo_realizado}</Text>
              </View>
            )}
            {entry.observaciones && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Observaciones:</Text>
                <Text style={styles.infoValue}>{entry.observaciones}</Text>
              </View>
            )}
            {/* Photos for this equipment */}
            {entry.photosBase64.length > 0 && (
              <View style={styles.photoGrid}>
                {entry.photosBase64.map((photo, j) => (
                  <View key={j} style={styles.photoContainer}>
                    <Image src={photo.data} style={styles.photo} />
                    <Text style={styles.photoLabel}>{photo.etiqueta}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Materials table */}
        {data.materials.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Material Empleado</Text>
            <View style={styles.tableHeader}>
              <Text style={{ width: "15%" }}>Cant.</Text>
              <Text style={{ width: "20%" }}>Unidad</Text>
              <Text style={{ width: "65%" }}>Descripcion</Text>
            </View>
            {data.materials.map((mat, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={{ width: "15%" }}>{mat.cantidad}</Text>
                <Text style={{ width: "20%" }}>{mat.unidad}</Text>
                <Text style={{ width: "65%" }}>{mat.descripcion}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Signature */}
        {data.firmaBase64 && (
          <View style={styles.signatureSection}>
            <Text style={styles.sectionTitle}>Firma del Encargado</Text>
            <Image src={data.firmaBase64} style={styles.signatureImage} />
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>
              {data.nombreEncargado ?? "Encargado de sucursal"}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
```

### Native Blob Download Utility
```typescript
// No file-saver dependency needed
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revoke after short delay to ensure download starts
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
```

### Dynamic Import for PDF Components
```typescript
// Any component that uses @react-pdf/renderer must be dynamically imported
// with ssr: false in Next.js App Router
import dynamic from "next/dynamic";

const PdfExportButton = dynamic(
  () => import("@/components/admin/report-pdf-button"),
  { ssr: false }
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-side PDF generation (Puppeteer, wkhtmltopdf) | Client-side with `@react-pdf/renderer` | Standard since react-pdf v2+ | Avoids Vercel serverless limits, no headless browser needed |
| `jsPDF` manual coordinate-based drawing | `@react-pdf/renderer` JSX components | react-pdf matured ~2020+ | Declarative layout with flexbox vs manual x,y positioning |
| `PDFDownloadLink` (renders on mount) | `pdf().toBlob()` imperative API | Available since react-pdf v2 | On-demand generation, better for data-heavy documents |
| `file-saver` for blob downloads | Native `URL.createObjectURL` + anchor | Always available, file-saver just wraps it | One fewer dependency |
| `react-pdf/renderer` v3 (React 18 only) | v4.3.2 (React 19 support) | v4.1.0 added React 19 | Compatible with current project stack |

**Deprecated/outdated:**
- `jsPDF` for complex layouts: Still works but manual positioning makes multi-page reports with images extremely tedious
- `PDFDownloadLink` for large documents: Generates on mount, blocking UI. Use imperative API instead.
- `@react-pdf/renderer` v3.x: Does not support React 19. Use v4.1.0+.

## Open Questions

1. **Google Fonts CDN TTF URL stability**
   - What we know: Google Fonts serves static TTF files at predictable URLs. The URLs include a version parameter (e.g., `/v18/`).
   - What's unclear: Whether these URLs change on font version bumps, which could break PDF rendering.
   - Recommendation: Host the Inter TTF files in `public/fonts/` for reliability. Fetch from Google Fonts CDN as a fallback. Alternatively, register with local file paths and serve from the app's static assets.

2. **PDF generation time with 20+ photos**
   - What we know: Each photo is ~800KB JPEG, ~1.07MB as base64. 20 photos = ~21MB of data. The PDF renderer needs to process and embed all of them.
   - What's unclear: Exact wall-clock time for generating a 20-photo PDF on a typical admin desktop browser.
   - Recommendation: Add a loading spinner during generation. If testing shows >15 seconds, consider reducing photo resolution further for PDF or limiting photos per page to 4-6.

3. **Company logo source**
   - What we know: The PDF header should include the company logo (OMLEB) and the client logo.
   - What's unclear: Where the company logo is stored. Client logos are in Supabase Storage (`clientes.logo_url`). The company logo might be a static asset in `public/`.
   - Recommendation: Store company logo as a static asset in `public/logo.png`. Fetch and convert to base64 at PDF generation time, same as other images.

4. **Workflow step data in PDF**
   - What we know: Phase 3.5 added structured workflow steps (plantillas_pasos, reporte_pasos) that replaced free-text diagnostico/trabajo_realizado for equipment with known types.
   - What's unclear: Whether the PDF should show the structured step data (step name, readings, per-step photos) or the legacy free-text fields, or both.
   - Recommendation: For V1 PDF, show the free-text fields (diagnostico, trabajo_realizado, observaciones) which are still populated. If they're empty (workflow equipment), show a summary derived from reporte_pasos (step names, completion status, readings). This keeps the PDF simple while covering both paths.

## Sources

### Primary (HIGH confidence)
- [react-pdf.org/components](https://react-pdf.org/components) - Image component API, base64 support, all components
- [react-pdf.org/advanced](https://react-pdf.org/advanced) - BlobProvider, usePDF hook, pdf() imperative API
- [react-pdf.org/hooks](https://react-pdf.org/hooks) - usePDF hook documentation
- [react-pdf.org/compatibility](https://react-pdf.org/compatibility) - React 19 support (v4.1.0+), Next.js compatibility notes
- [react-pdf.org/fonts](https://react-pdf.org/fonts) - Font.register() API, TTF/WOFF support, weight variants
- [react-pdf.org/styling](https://react-pdf.org/styling) - StyleSheet API, flexbox, text properties, units
- [npmjs.com/@react-pdf/renderer](https://www.npmjs.com/package/@react-pdf/renderer) - v4.3.2, 2 months old
- Existing codebase: `supabase/rls.sql` - Admin RLS policies already grant full CRUD on all report tables
- Existing codebase: `src/app/actions/reportes.ts` - Server action patterns, Zod validation
- Existing codebase: `src/app/admin/folios/page.tsx` - Admin list page pattern with server component
- Existing codebase: `src/types/index.ts` - All TypeScript types for report entities

### Secondary (MEDIUM confidence)
- [GitHub diegomura/react-pdf #2340](https://github.com/diegomura/react-pdf/issues/2340) - CORS workaround: pre-fetch + base64 conversion
- [GitHub diegomura/react-pdf #1807](https://github.com/diegomura/react-pdf/issues/1807) - Performance with many images: maintainer confirms inherent processing time, latest version improvements
- [GitHub diegomura/react-pdf #216](https://github.com/diegomura/react-pdf/issues/216) - Base64 image support confirmed
- [GitHub diegomura/react-pdf discussions #2352](https://github.com/diegomura/react-pdf/discussions/2352) - pdf().toBlob() imperative API for download without rendering

### Tertiary (LOW confidence)
- [WebSearch] Google Fonts Inter TTF URLs - URLs may change with font version updates; recommend self-hosting
- [WebSearch] Supabase Storage CORS default behavior - Reports suggest CORS is configurable but defaults may vary; base64 pre-fetch is the safe path

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - @react-pdf/renderer v4.3.2 is well-documented, React 19 compatible, API is stable
- Architecture: HIGH - Follows existing codebase patterns exactly (server components, server actions, Supabase queries). PDF generation approach verified against official docs.
- Pitfalls: HIGH - CORS issue is well-documented across multiple GitHub issues. Font/variable font limitation is in official docs. Memory concerns are based on concrete math (photo sizes * count).
- PDF layout/design: MEDIUM - The document structure is standard but exact styling will need iteration during implementation. The code examples provide a solid starting point.

**Research date:** 2026-02-28
**Valid until:** 2026-03-30 (30 days - @react-pdf/renderer is stable, API unlikely to change)
