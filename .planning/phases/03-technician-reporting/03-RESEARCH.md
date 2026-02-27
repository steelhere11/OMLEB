# Phase 3: Technician Reporting - Research

**Researched:** 2026-02-27
**Domain:** Mobile-first multi-section forms, dynamic form arrays, shared cuadrilla report editing, auto-draft/pre-population, Supabase Realtime for edit awareness
**Confidence:** HIGH

## Summary

Phase 3 builds the core product: technicians creating and submitting daily reports from their phones. The existing codebase has all database tables (reportes, reporte_equipos, reporte_materiales), TypeScript types, and RLS policies already in place from Phase 1. The admin CRUD patterns from Phase 2 (Server Actions + useActionState + Zod 4 validation) carry forward, but the technician side introduces several new challenges: (1) complex multi-section mobile forms with dynamic add/remove rows, (2) a shared cuadrilla report where multiple team members contribute to one report per folio per day, (3) auto-draft pre-population from previous day's report, and (4) a cuadrilla RLS gap that must be fixed.

The technician form is fundamentally different from admin CRUD forms. Admin forms are simple create/edit pages. The technician report form is a multi-section, stateful document that grows dynamically (add equipment entries, add material rows, add new equipment on-the-fly). This requires a hybrid approach: client-side state management (useState) for dynamic arrays and UI responsiveness, combined with Server Actions for persistence. The form should NOT be a traditional HTML form with a single submit -- it should auto-save sections independently or use a "save draft" pattern with a final "submit" action.

**Primary recommendation:** Build the report form as a client-side stateful component that manages equipment entries and material rows via useState arrays, with individual Server Actions for each mutation (createReport, addEquipmentEntry, updateEquipmentEntry, removeEquipmentEntry, addMaterial, removeMaterial, updateReportStatus). Use "last-write-wins" for concurrent cuadrilla edits with a lightweight Supabase Realtime notification to prompt refresh when another team member saves changes. Add a unique constraint on `reportes(folio_id, fecha)` and fix the `folio_asignados` RLS policy to allow technicians to see all team members for their assigned folios.

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | App Router, Server Components, Server Actions | Already installed; same patterns as Phase 2 |
| react | 19.2.3 | useActionState, useState for dynamic forms | Already installed; manages form state |
| @supabase/supabase-js | 2.97.0 | Database queries + Realtime subscriptions | Already installed; CRUD + realtime channels |
| @supabase/ssr | 0.8.0 | Server-side Supabase client | Already installed; cookie-based auth |
| zod | ^4.3.6 | Server-side form validation | Already installed; validates report data |
| tailwindcss | 4.x | Mobile-first styling | Already installed; CSS-first config |

### New Dependencies

None required. All functionality can be built with the existing stack.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| useState arrays for dynamic form | react-hook-form | Adds 15KB dependency; existing patterns use useActionState. Dynamic arrays are simple enough with useState. |
| Supabase Realtime for cuadrilla sync | Polling with setInterval | Polling wastes resources. Realtime is built into @supabase/supabase-js already installed. |
| Last-write-wins for concurrent edits | Optimistic locking with updated_at check | Optimistic locking adds complexity (merge UI, conflict resolution). Teams are 2-3 people; concurrent edits are rare. LWW + refresh notification is sufficient for V1. |
| Multiple Server Actions per section | Single large form submit | Single submit would lose work on failure. Granular actions let technicians save progress incrementally. |

## Architecture Patterns

### File Organization for Phase 3

```
src/
├── app/
│   ├── actions/
│   │   ├── reportes.ts           # NEW: Report CRUD + status actions
│   │   └── equipos.ts            # MODIFIED: Add tech-side createEquipoFromField action
│   └── tecnico/
│       ├── page.tsx              # MODIFIED: Real folio list (replace empty state)
│       ├── folios/
│       │   └── [folioId]/
│       │       └── page.tsx      # NEW: Folio detail + report entry point
│       └── reporte/
│           └── [reporteId]/
│               ├── page.tsx      # NEW: Server Component wrapper (fetch report data)
│               ├── report-form.tsx    # NEW: Main report form (Client Component)
│               ├── equipment-section.tsx  # NEW: Equipment entries section
│               ├── equipment-entry-form.tsx # NEW: Single equipment entry
│               ├── add-equipment-modal.tsx  # NEW: Add new equipment from field
│               ├── materials-section.tsx    # NEW: Materials log section
│               └── status-section.tsx      # NEW: Status + submit section
├── lib/
│   └── validations/
│       └── reportes.ts           # NEW: Zod schemas for report data
└── types/
    └── index.ts                  # No changes needed (types already exist)
```

### Pattern 1: Folio List for Technicians (Server Component)

**What:** Technician's landing page shows assigned folios with today's report status.
**When to use:** The `/tecnico` page (replaces current empty state placeholder).

```typescript
// Source: Existing codebase pattern (admin/folios/page.tsx) adapted for technician
// File: src/app/tecnico/page.tsx

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Folio, FolioEstatus } from "@/types";

type FolioWithDetails = Folio & {
  sucursales: { nombre: string; numero: string; direccion: string } | null;
  clientes: { nombre: string } | null;
};

export default async function TecnicoFoliosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // RLS ensures only assigned folios are returned
  const { data: folios } = await supabase
    .from("folios")
    .select("*, sucursales(nombre, numero, direccion), clientes(nombre)")
    .in("estatus", ["abierto", "en_progreso", "en_espera"])
    .order("created_at", { ascending: false });

  const list = (folios as FolioWithDetails[] | null) ?? [];

  // Check today's reports for each folio
  const today = new Date().toISOString().split("T")[0];
  const folioIds = list.map((f) => f.id);
  const { data: todayReports } = await supabase
    .from("reportes")
    .select("id, folio_id, estatus")
    .in("folio_id", folioIds)
    .eq("fecha", today);

  const reportByFolio = new Map(
    (todayReports ?? []).map((r) => [r.folio_id, r])
  );

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-900">Mis Folios</h1>
      {list.length === 0 ? (
        /* empty state */
      ) : (
        <div className="space-y-3">
          {list.map((folio) => {
            const todayReport = reportByFolio.get(folio.id);
            return (
              <Link
                key={folio.id}
                href={`/tecnico/folios/${folio.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm active:bg-gray-50"
              >
                {/* Folio card content */}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

### Pattern 2: Get-or-Create Daily Report

**What:** When a technician taps a folio, find or create today's shared report. This is the central pattern that ensures one report per folio per day.
**When to use:** Folio detail page that routes to the report form.

```typescript
// Source: Application-specific pattern
// File: src/app/actions/reportes.ts (partial)

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function getOrCreateTodayReport(folioId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  const today = new Date().toISOString().split("T")[0];

  // Try to find existing report for this folio + today
  const { data: existing } = await supabase
    .from("reportes")
    .select("id")
    .eq("folio_id", folioId)
    .eq("fecha", today)
    .maybeSingle();

  if (existing) {
    return { reporteId: existing.id };
  }

  // Get folio's sucursal_id for the report
  const { data: folio } = await supabase
    .from("folios")
    .select("sucursal_id")
    .eq("id", folioId)
    .single();

  if (!folio) return { error: "Folio no encontrado" };

  // Create new report
  const { data: newReport, error } = await supabase
    .from("reportes")
    .insert({
      folio_id: folioId,
      creado_por: user.id,
      sucursal_id: folio.sucursal_id,
      fecha: today,
      estatus: "en_progreso",
    })
    .select("id")
    .single();

  if (error) {
    // Handle race condition: another team member created it first
    if (error.code === "23505") {
      const { data: justCreated } = await supabase
        .from("reportes")
        .select("id")
        .eq("folio_id", folioId)
        .eq("fecha", today)
        .single();
      return { reporteId: justCreated?.id };
    }
    return { error: "Error al crear reporte: " + error.message };
  }

  return { reporteId: newReport.id };
}
```

### Pattern 3: Dynamic Equipment Entries (Client-Side State + Server Actions)

**What:** Equipment entries are managed as a client-side array with individual server action calls for persistence.
**When to use:** The equipment section of the report form.

```typescript
// Source: React 19 patterns + existing codebase conventions
// File: src/app/tecnico/reporte/[reporteId]/equipment-section.tsx (conceptual)

"use client";

import { useState, useEffect, useTransition } from "react";
import { addEquipmentEntry, removeEquipmentEntry, updateEquipmentEntry }
  from "@/app/actions/reportes";
import type { ReporteEquipo, Equipo } from "@/types";

interface Props {
  reporteId: string;
  initialEntries: (ReporteEquipo & { equipos: Equipo })[];
  availableEquipment: Equipo[];
}

export function EquipmentSection({ reporteId, initialEntries, availableEquipment }: Props) {
  const [entries, setEntries] = useState(initialEntries);
  const [isPending, startTransition] = useTransition();

  const handleAddEntry = (equipoId: string) => {
    startTransition(async () => {
      const result = await addEquipmentEntry(reporteId, equipoId);
      if (result.data) {
        setEntries((prev) => [...prev, result.data]);
      }
    });
  };

  const handleRemoveEntry = (entryId: string) => {
    // Optimistic removal
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
    startTransition(async () => {
      const result = await removeEquipmentEntry(entryId);
      if (result.error) {
        // Revert on failure -- refetch
        setEntries(initialEntries);
      }
    });
  };

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <EquipmentEntryForm
          key={entry.id}
          entry={entry}
          onRemove={() => handleRemoveEntry(entry.id)}
        />
      ))}
      {/* Add equipment selector */}
    </div>
  );
}
```

### Pattern 4: Dynamic Materials Rows (Client-Side Array)

**What:** Materials table with add/remove rows, saved on report submit or section save.
**When to use:** The materials section of the report form.

```typescript
// Source: React useState pattern for dynamic form arrays
// File: src/app/tecnico/reporte/[reporteId]/materials-section.tsx (conceptual)

"use client";

import { useState, useTransition } from "react";
import { saveMaterials } from "@/app/actions/reportes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MaterialRow {
  id: string; // client-side ID (crypto.randomUUID())
  cantidad: string;
  unidad: string;
  descripcion: string;
}

interface Props {
  reporteId: string;
  initialMaterials: MaterialRow[];
}

export function MaterialsSection({ reporteId, initialMaterials }: Props) {
  const [rows, setRows] = useState<MaterialRow[]>(
    initialMaterials.length > 0
      ? initialMaterials
      : [{ id: crypto.randomUUID(), cantidad: "", unidad: "", descripcion: "" }]
  );
  const [isPending, startTransition] = useTransition();

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: crypto.randomUUID(), cantidad: "", unidad: "", descripcion: "" },
    ]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, field: keyof MaterialRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleSave = () => {
    startTransition(async () => {
      const validRows = rows.filter(
        (r) => r.cantidad && r.unidad && r.descripcion
      );
      await saveMaterials(reporteId, validRows);
    });
  };

  return (
    <div>
      {rows.map((row) => (
        <div key={row.id} className="flex items-start gap-2">
          <Input
            type="number"
            value={row.cantidad}
            onChange={(e) => updateRow(row.id, "cantidad", e.target.value)}
            placeholder="Cant."
            className="w-20"
          />
          <Input
            value={row.unidad}
            onChange={(e) => updateRow(row.id, "unidad", e.target.value)}
            placeholder="Unidad"
            className="w-24"
          />
          <Input
            value={row.descripcion}
            onChange={(e) => updateRow(row.id, "descripcion", e.target.value)}
            placeholder="Descripcion del material"
            className="flex-1"
          />
          <button onClick={() => removeRow(row.id)}>X</button>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={addRow}>
        + Agregar material
      </Button>
      <Button type="button" variant="primary" size="sm" onClick={handleSave} loading={isPending}>
        Guardar materiales
      </Button>
    </div>
  );
}
```

### Pattern 5: Add Equipment from Field (Inline Modal)

**What:** Technician adds new equipment without leaving the report flow. Equipment is created with `revisado: false` and `agregado_por: user.id`.
**When to use:** When the equipment needed is not in the branch's equipment list.

```typescript
// Source: Existing createEquipo pattern adapted for tech role
// File: src/app/actions/equipos.ts (add to existing file)

export async function createEquipoFromField(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  // Technicians and helpers can add equipment
  const role = user.app_metadata?.rol;
  if (role !== "tecnico" && role !== "ayudante") {
    return { error: "No autorizado" };
  }

  const rawData = {
    sucursal_id: formData.get("sucursal_id"),
    numero_etiqueta: formData.get("numero_etiqueta"),
    marca: formData.get("marca"),
    modelo: formData.get("modelo"),
    numero_serie: formData.get("numero_serie"),
    tipo_equipo: formData.get("tipo_equipo"),
  };

  // Validate with existing equipoSchema
  const result = equipoSchema.safeParse(rawData);
  if (!result.success) {
    const flattened = z.flattenError(result.error);
    return { fieldErrors: flattened.fieldErrors };
  }

  // Insert with tech-specific fields
  const { data: equipo, error } = await supabase
    .from("equipos")
    .insert({
      sucursal_id: result.data.sucursal_id,
      numero_etiqueta: result.data.numero_etiqueta,
      marca: result.data.marca || null,
      modelo: result.data.modelo || null,
      numero_serie: result.data.numero_serie || null,
      tipo_equipo: result.data.tipo_equipo || null,
      agregado_por: user.id,
      revisado: false, // Flagged for admin review
    })
    .select("id")
    .single();

  if (error) {
    return { error: "Error al agregar equipo: " + error.message };
  }

  return { success: true, message: "Equipo agregado", data: equipo };
}
```

### Pattern 6: Cuadrilla Shared Report with Realtime Notification

**What:** Multiple team members see and edit the same report. Use Supabase Realtime to notify when another member saves changes.
**When to use:** The report form component.

```typescript
// Source: Supabase Realtime docs + @supabase/supabase-js built-in
// File: src/app/tecnico/reporte/[reporteId]/report-form.tsx (partial)

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function ReportForm({ reporteId, ...props }) {
  const [showRefreshBanner, setShowRefreshBanner] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`report-${reporteId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "reportes",
          filter: `id=eq.${reporteId}`,
        },
        (payload) => {
          // Another team member updated the report
          setShowRefreshBanner(true);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reporte_equipos",
          filter: `reporte_id=eq.${reporteId}`,
        },
        () => {
          setShowRefreshBanner(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reporteId]);

  const handleRefresh = () => {
    setShowRefreshBanner(false);
    router.refresh(); // Re-runs Server Component, fetches fresh data
  };

  return (
    <div>
      {showRefreshBanner && (
        <div className="sticky top-14 z-20 mx-4 mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
          <p className="text-sm text-blue-800">
            Un companero actualizo el reporte.
          </p>
          <button
            onClick={handleRefresh}
            className="mt-1 text-sm font-medium text-blue-600 underline"
          >
            Actualizar datos
          </button>
        </div>
      )}
      {/* Report sections */}
    </div>
  );
}
```

### Pattern 7: Auto-Draft from Previous Day

**What:** When creating a new daily report for a multi-day folio, pre-populate the equipment list from the previous day's report.
**When to use:** In the getOrCreateTodayReport action.

```typescript
// Source: Application-specific logic
// In src/app/actions/reportes.ts

async function preFillFromPreviousReport(
  supabase: SupabaseClient,
  folioId: string,
  newReporteId: string,
  today: string
) {
  // Find the most recent previous report for this folio
  const { data: prevReport } = await supabase
    .from("reportes")
    .select("id")
    .eq("folio_id", folioId)
    .lt("fecha", today)
    .order("fecha", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!prevReport) return;

  // Copy equipment entries (without work details -- just the equipment selection)
  const { data: prevEntries } = await supabase
    .from("reporte_equipos")
    .select("equipo_id, tipo_trabajo")
    .eq("reporte_id", prevReport.id);

  if (prevEntries && prevEntries.length > 0) {
    const newEntries = prevEntries.map((entry) => ({
      reporte_id: newReporteId,
      equipo_id: entry.equipo_id,
      tipo_trabajo: entry.tipo_trabajo,
      // diagnostico, trabajo_realizado, observaciones left empty for today
    }));

    await supabase.from("reporte_equipos").insert(newEntries);
  }
}
```

### Anti-Patterns to Avoid

- **Single giant form submit:** Do NOT build the entire report as one `<form>` with a single submit button. Technicians may spend 30+ minutes filling in data. If the submit fails or they lose connection, all work is lost. Save sections independently.
- **Textarea for structured data:** Do NOT use a single textarea for diagnostico + trabajo realizado. Keep them as separate fields -- this matters for PDF generation later.
- **Polling for cuadrilla sync:** Do NOT use setInterval to poll for changes. Supabase Realtime is already available in the installed @supabase/supabase-js package.
- **Blocking UI on save:** Do NOT block the entire form while a section saves. Use `useTransition` for non-blocking saves with loading indicators per section.
- **Creating duplicate reports:** Do NOT allow multiple reports for the same folio on the same day. Use a unique constraint + get-or-create pattern.
- **Editing submitted reports:** Do NOT allow technicians to edit reports after final submission (status = "completado"). Only admin can edit finalized reports.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| One report per folio per day | Application-level check | DB unique constraint on `reportes(folio_id, fecha)` | Race conditions between cuadrilla members creating simultaneously |
| Report date | Manual date input | DB default `CURRENT_DATE` on insert | Prevents technicians from backdating reports |
| Equipment list for branch | Custom query logic | Supabase `.from("equipos").select("*").eq("sucursal_id", folioSucursalId)` | RLS already allows technicians to read all equipment |
| Realtime notifications | Custom WebSocket | `supabase.channel().on("postgres_changes", ...)` | Built into @supabase/supabase-js, no extra dependency |
| Optimistic UI updates | Manual state sync | React 19 `useTransition` + local state update | Handles pending state automatically |
| Auto-increment materials | Manual counter state | `crypto.randomUUID()` for client-side row IDs | Unique keys for React list rendering |

**Key insight:** The database layer already has all the tables, indexes, and RLS policies for technician reporting. Phase 3 only builds UI and server actions on top. The one critical gap is the missing unique constraint on `reportes(folio_id, fecha)` and the incomplete `folio_asignados` RLS policy.

## Common Pitfalls

### Pitfall 1: Missing Unique Constraint on reportes(folio_id, fecha)

**What goes wrong:** Two cuadrilla members open the folio at the same time, both create a report for today, resulting in duplicate reports.
**Why it happens:** The `reportes` table has no unique constraint on `(folio_id, fecha)`. The get-or-create pattern has a TOCTOU race condition without a DB constraint.
**How to avoid:** Add a unique constraint via migration SQL:
```sql
ALTER TABLE public.reportes
ADD CONSTRAINT unique_folio_fecha UNIQUE (folio_id, fecha);
```
Then handle the `23505` (unique_violation) error code in the server action by retrying the SELECT.
**Warning signs:** Duplicate report rows appearing in the reportes table for the same folio and date.

### Pitfall 2: Folio Asignados RLS Policy Too Restrictive for Cuadrilla

**What goes wrong:** Technician cannot see who else is assigned to their folio. The "shared report" UX shows no team member info.
**Why it happens:** The current `folio_asignados_tech_select` policy only allows `usuario_id = auth.uid()`. Technicians can see their own assignment but not their teammates' assignments.
**How to avoid:** Replace the existing policy or add a new one:
```sql
-- Drop the restrictive policy
DROP POLICY "folio_asignados_tech_select" ON public.folio_asignados;

-- Add a policy that lets techs see all assignments for their folios
CREATE POLICY "folio_asignados_tech_select"
  ON public.folio_asignados FOR SELECT
  TO authenticated
  USING (folio_id IN (SELECT private.get_my_folio_ids()));
```
This lets technicians see all team members for folios they are assigned to, without exposing assignments for other folios.
**Warning signs:** Empty cuadrilla member list on the report form, or Supabase returning no rows for the folio's team.

### Pitfall 3: Supabase Realtime Requires Publication Configuration

**What goes wrong:** Subscribing to `postgres_changes` returns no events. The channel connects but never fires callbacks.
**Why it happens:** Supabase Realtime requires tables to be added to the `supabase_realtime` publication. This is not done by default.
**How to avoid:** Add tables to the publication via SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.reportes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reporte_equipos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reporte_materiales;
```
Or enable via Supabase Dashboard: Database > Replication > supabase_realtime > enable the tables.
**Warning signs:** Channel subscription succeeds (`SUBSCRIBED` status) but no change events are received when data is modified.

### Pitfall 4: Form Data Loss on Navigation

**What goes wrong:** Technician is filling in a report, accidentally taps the back button or another tab, loses all unsaved work.
**Why it happens:** Client-side state (useState) is lost on navigation. Unlike admin forms that redirect after submit, the technician report form is a long-lived editing session.
**How to avoid:** Two strategies:
1. **Save frequently:** Each equipment entry saves individually when the technician moves to the next field or entry. Materials save on blur or explicit button press.
2. **Navigation guard:** Use `beforeunload` event to warn about unsaved changes:
```typescript
useEffect(() => {
  const handler = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
    }
  };
  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
}, [hasUnsavedChanges]);
```
**Warning signs:** Users complain about losing data when navigating away from the report form.

### Pitfall 5: Equipment Entry Without Equipment ID

**What goes wrong:** Technician adds a new equipment from the field but the equipment entry form tries to link to an equipo_id that doesn't exist yet.
**Why it happens:** Adding new equipment is a two-step process: (1) create the equipment record, (2) add it to the report. If these aren't sequenced properly, the FK constraint fails.
**How to avoid:** The "add equipment from field" flow must:
1. First, insert into `equipos` table (returns new equipo.id)
2. Then, add an entry to `reporte_equipos` using the new equipo.id
3. Wrap both in a single server action or handle sequentially
**Warning signs:** FK constraint violation error `23503` when adding equipment entries.

### Pitfall 6: Technician Role Check Differs from Admin

**What goes wrong:** Server actions reject technician requests because they check for `rol === "admin"`.
**Why it happens:** Copy-pasting admin server actions and forgetting to change the role check.
**How to avoid:** Technician actions must check for `rol === "tecnico" || rol === "ayudante"` AND verify the user is assigned to the folio via `folio_asignados`. The role check alone is not sufficient -- must also verify folio assignment.
**Warning signs:** "No autorizado" errors for legitimate technicians trying to submit reports.

### Pitfall 7: Mobile Keyboard Pushing Content Off Screen

**What goes wrong:** On mobile, opening the keyboard pushes the form content up, causing the current field to be obscured by the header or pushed behind the keyboard.
**Why it happens:** The technician layout has a fixed header (h-14) and fixed bottom tab bar (h-16). When the keyboard opens, the viewport shrinks but fixed elements remain.
**How to avoid:** Use `dvh` units (already used in layout: `min-h-dvh`) and ensure form inputs are scrollable. Consider hiding the bottom tab bar when inside the report form. Use `scrollIntoView` on input focus:
```typescript
const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  setTimeout(() => {
    e.target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 300); // Wait for keyboard animation
};
```
**Warning signs:** Users on smaller phones (e.g., iPhone SE) cannot see what they are typing.

## Code Examples

### Zod Validation Schema for Report Equipment Entry

```typescript
// File: src/lib/validations/reportes.ts
import { z } from "zod";

export const reporteEquipoSchema = z.object({
  equipo_id: z.string({ error: "Seleccione un equipo" })
    .uuid({ error: "ID de equipo invalido" }),
  tipo_trabajo: z.enum(["preventivo", "correctivo"], {
    error: "Seleccione tipo de trabajo",
  }),
  diagnostico: z.string()
    .max(2000, { error: "El diagnostico no puede exceder 2000 caracteres" })
    .optional()
    .or(z.literal("")),
  trabajo_realizado: z.string()
    .max(2000, { error: "El trabajo realizado no puede exceder 2000 caracteres" })
    .optional()
    .or(z.literal("")),
  observaciones: z.string()
    .max(2000, { error: "Las observaciones no pueden exceder 2000 caracteres" })
    .optional()
    .or(z.literal("")),
});

export const reporteMaterialSchema = z.object({
  cantidad: z.coerce.number({ error: "La cantidad es requerida" })
    .positive({ error: "La cantidad debe ser mayor a 0" }),
  unidad: z.string({ error: "La unidad es requerida" })
    .min(1, { error: "La unidad es requerida" })
    .max(50, { error: "La unidad no puede exceder 50 caracteres" }),
  descripcion: z.string({ error: "La descripcion es requerida" })
    .min(1, { error: "La descripcion es requerida" })
    .max(500, { error: "La descripcion no puede exceder 500 caracteres" }),
});

export const reporteStatusSchema = z.object({
  estatus: z.enum(["en_progreso", "en_espera", "completado"], {
    error: "Seleccione un estatus valido",
  }),
});

export type ReporteEquipoInput = z.infer<typeof reporteEquipoSchema>;
export type ReporteMaterialInput = z.infer<typeof reporteMaterialSchema>;
```

### Server Action: Save Equipment Entry (Upsert)

```typescript
// File: src/app/actions/reportes.ts (partial)

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { reporteEquipoSchema } from "@/lib/validations/reportes";
import { z } from "zod";
import type { ActionState } from "@/types/actions";

export async function saveEquipmentEntry(
  reporteId: string,
  entryId: string | null, // null = create, string = update
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  // Verify user is assigned to the report's folio
  const { data: reporte } = await supabase
    .from("reportes")
    .select("id, folio_id")
    .eq("id", reporteId)
    .single();

  if (!reporte) return { error: "Reporte no encontrado" };

  // Validate
  const rawData = {
    equipo_id: formData.get("equipo_id"),
    tipo_trabajo: formData.get("tipo_trabajo"),
    diagnostico: formData.get("diagnostico"),
    trabajo_realizado: formData.get("trabajo_realizado"),
    observaciones: formData.get("observaciones"),
  };

  const result = reporteEquipoSchema.safeParse(rawData);
  if (!result.success) {
    const flattened = z.flattenError(result.error);
    return { fieldErrors: flattened.fieldErrors };
  }

  if (entryId) {
    // Update existing entry
    const { error } = await supabase
      .from("reporte_equipos")
      .update({
        tipo_trabajo: result.data.tipo_trabajo,
        diagnostico: result.data.diagnostico || null,
        trabajo_realizado: result.data.trabajo_realizado || null,
        observaciones: result.data.observaciones || null,
      })
      .eq("id", entryId);

    if (error) return { error: "Error al actualizar: " + error.message };
  } else {
    // Insert new entry
    const { error } = await supabase
      .from("reporte_equipos")
      .insert({
        reporte_id: reporteId,
        equipo_id: result.data.equipo_id,
        tipo_trabajo: result.data.tipo_trabajo,
        diagnostico: result.data.diagnostico || null,
        trabajo_realizado: result.data.trabajo_realizado || null,
        observaciones: result.data.observaciones || null,
      });

    if (error) return { error: "Error al agregar: " + error.message };
  }

  revalidatePath(`/tecnico/reporte/${reporteId}`);
  return { success: true, message: "Guardado" };
}
```

### Server Action: Save Materials (Batch Replace)

```typescript
// File: src/app/actions/reportes.ts (partial)

export async function saveMaterials(
  reporteId: string,
  materials: { cantidad: number; unidad: string; descripcion: string }[]
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  // Validate all materials
  for (const mat of materials) {
    const result = reporteMaterialSchema.safeParse(mat);
    if (!result.success) {
      return { error: "Datos de material invalidos" };
    }
  }

  // Delete existing materials for this report, then insert new ones
  // (same delete-all + re-insert pattern used in folio_asignados)
  const { error: deleteError } = await supabase
    .from("reporte_materiales")
    .delete()
    .eq("reporte_id", reporteId);

  if (deleteError) {
    return { error: "Error al actualizar materiales: " + deleteError.message };
  }

  if (materials.length > 0) {
    const rows = materials.map((m) => ({
      reporte_id: reporteId,
      cantidad: m.cantidad,
      unidad: m.unidad,
      descripcion: m.descripcion,
    }));

    const { error: insertError } = await supabase
      .from("reporte_materiales")
      .insert(rows);

    if (insertError) {
      return { error: "Error al guardar materiales: " + insertError.message };
    }
  }

  revalidatePath(`/tecnico/reporte/${reporteId}`);
  return { success: true, message: "Materiales guardados" };
}
```

### Server Action: Update Report Status + Submit

```typescript
// File: src/app/actions/reportes.ts (partial)

export async function updateReportStatus(
  reporteId: string,
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  const estatus = formData.get("estatus") as string;
  if (!["en_progreso", "en_espera", "completado"].includes(estatus)) {
    return { error: "Estatus invalido" };
  }

  // Completado requires validation that entries exist
  if (estatus === "completado") {
    const { data: entries } = await supabase
      .from("reporte_equipos")
      .select("id")
      .eq("reporte_id", reporteId);

    if (!entries || entries.length === 0) {
      return {
        error: "No se puede completar un reporte sin entradas de equipo",
      };
    }
  }

  const { error } = await supabase
    .from("reportes")
    .update({ estatus })
    .eq("id", reporteId);

  if (error) {
    return { error: "Error al actualizar estatus: " + error.message };
  }

  // Also update the parent folio's status
  const { data: reporte } = await supabase
    .from("reportes")
    .select("folio_id")
    .eq("id", reporteId)
    .single();

  if (reporte) {
    const folioEstatus =
      estatus === "completado" ? "completado" :
      estatus === "en_espera" ? "en_espera" : "en_progreso";

    await supabase
      .from("folios")
      .update({ estatus: folioEstatus })
      .eq("id", reporte.folio_id);
  }

  revalidatePath(`/tecnico/reporte/${reporteId}`);
  revalidatePath("/tecnico");
  return { success: true, message: "Estatus actualizado" };
}
```

### Database Migration SQL

```sql
-- File: supabase/migration-03-reporting.sql
-- Run AFTER schema.sql and rls.sql

-- 1. Add unique constraint for one report per folio per day
ALTER TABLE public.reportes
ADD CONSTRAINT unique_folio_fecha UNIQUE (folio_id, fecha);

-- 2. Fix folio_asignados RLS: let techs see all team members for their folios
DROP POLICY IF EXISTS "folio_asignados_tech_select" ON public.folio_asignados;

CREATE POLICY "folio_asignados_tech_select"
  ON public.folio_asignados FOR SELECT
  TO authenticated
  USING (folio_id IN (SELECT private.get_my_folio_ids()));

-- 3. Enable Realtime for report tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.reportes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reporte_equipos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reporte_materiales;
```

### Mobile-First Toggle Component (Preventivo/Correctivo)

```typescript
// File: src/components/tecnico/work-type-toggle.tsx

"use client";

interface WorkTypeToggleProps {
  name: string;
  value: "preventivo" | "correctivo";
  onChange: (value: "preventivo" | "correctivo") => void;
}

export function WorkTypeToggle({ name, value, onChange }: WorkTypeToggleProps) {
  return (
    <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => onChange("preventivo")}
        className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          value === "preventivo"
            ? "bg-white text-brand-700 shadow-sm"
            : "text-gray-500"
        }`}
      >
        Preventivo
      </button>
      <button
        type="button"
        onClick={() => onChange("correctivo")}
        className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          value === "correctivo"
            ? "bg-white text-brand-700 shadow-sm"
            : "text-gray-500"
        }`}
      >
        Correctivo
      </button>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single form submit | Granular server actions per section | Next.js 14+ (2023) | Save-as-you-go prevents data loss |
| useFormState (react-dom) | useActionState (react) | React 19 (2024) | Import from "react" not "react-dom" |
| Polling for live updates | Supabase Realtime channels | Supabase 2.x (2023) | Built-in, no extra dependency |
| Complex CRDT/OT sync | Last-write-wins + refresh notification | 2024+ patterns | Good enough for small teams (2-3 people) |
| Multi-page wizard forms | Scrollable single-page with sections | Mobile UX 2024+ | Fewer page loads, better context retention |

**Deprecated/outdated:**
- `useFormState` from `react-dom`: Use `useActionState` from `react` (React 19)
- Supabase `from("table").on("INSERT", ...)`: Use `channel().on("postgres_changes", ...)` (Supabase 2.x)

## Open Questions

1. **Concurrent edit conflict granularity**
   - What we know: Last-write-wins is the simplest approach for small cuadrillas (2-3 people). Supabase Realtime can notify when changes occur.
   - What's unclear: Should equipment entries be locked to one person at a time, or can multiple people edit the same entry?
   - **Recommendation:** Use last-write-wins at the individual entry level. Each equipment entry and the materials section save independently. If two people edit the same equipment entry simultaneously, the last save wins. The Realtime notification prompts the other person to refresh. This is acceptable for V1 -- teams are small and concurrent editing of the same field is rare.

2. **Folio status synchronization**
   - What we know: When a report status is set to "completado", the parent folio should also be updated. But a folio may have multiple daily reports across multiple days.
   - What's unclear: If a technician marks day 2's report as "en_progreso" but day 1 was "completado", what should the folio status be?
   - **Recommendation:** The folio status should reflect the LATEST report's status. When updating a report status, also update the folio status to match. In V2 (multi-day linking), this can be made smarter.

3. **Bottom tab bar visibility during report editing**
   - What we know: The bottom tab bar takes up screen real estate. During report editing, every pixel matters on mobile.
   - What's unclear: Should the tab bar be hidden on the report editing page?
   - **Recommendation:** Hide the bottom tab bar when inside `/tecnico/reporte/*` routes. The report page should have its own back navigation (arrow button in header). Modify the `BottomTabBar` component to check pathname and hide when inside report routes.

4. **Auto-save frequency**
   - What we know: Individual equipment entries should save when the technician finishes editing them.
   - What's unclear: Should saves happen on blur, on a timer, or only on explicit button press?
   - **Recommendation:** Save on explicit button press per section ("Guardar" button for each equipment entry and materials section). This is simpler to implement, gives clear feedback, and avoids confusing auto-save behavior for non-tech-savvy users. A visual "saved" indicator should appear after each successful save.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `supabase/schema.sql`, `supabase/rls.sql` (verified table structures, RLS policies, FK constraints)
- Existing codebase: `src/app/actions/equipos.ts`, `src/app/actions/folios.ts` (established server action patterns)
- Existing codebase: `src/types/index.ts` (all report types already defined)
- Supabase JS Upsert docs: https://supabase.com/docs/reference/javascript/upsert
- Supabase Realtime Postgres Changes docs: https://supabase.com/docs/guides/realtime/subscribing-to-database-changes
- React 19 useActionState docs: https://react.dev/reference/react/useActionState

### Secondary (MEDIUM confidence)
- Next.js Forms guide: https://nextjs.org/docs/app/guides/forms
- Supabase Realtime with Next.js: https://supabase.com/docs/guides/realtime/realtime-with-nextjs
- Multi-step form UX best practices: https://www.smashingmagazine.com/2024/12/creating-effective-multistep-form-better-user-experience/
- Mobile form UX optimization: https://www.zuko.io/blog/8-tips-to-optimize-your-mobile-form-ux

### Tertiary (LOW confidence)
- Concurrent editing conflict resolution patterns: general web search (verified against Wikipedia/Medium articles, not library-specific docs)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using exact same stack as Phases 1 and 2, no new dependencies
- Architecture: HIGH - Patterns directly derived from existing codebase (server actions, useActionState, RLS) with mobile-specific adaptations verified against official docs
- Dynamic forms: HIGH - useState + useTransition pattern is standard React 19, verified against official docs
- Cuadrilla shared editing: MEDIUM - Supabase Realtime pattern verified against official docs, but the last-write-wins UX decision is a judgment call appropriate for V1
- Auto-draft pre-population: HIGH - Simple SQL query pattern, no complex logic
- RLS gap fix: HIGH - Verified by reading the actual RLS SQL file; the policy is definitively too restrictive
- Unique constraint gap: HIGH - Verified by reading schema.sql; no constraint exists on (folio_id, fecha)
- Mobile UX patterns: MEDIUM - Based on web search best practices, not verified against a specific library

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (stable stack, no anticipated breaking changes)
