# Phase 8: Arrival, Site Overview & Equipment Registration

## Context & Motivation

BBVA (our primary contractor) requires a three-layer evidence chain BEFORE any maintenance work begins. This evidence chain proves:
1. **Timely arrival** with proper PPE (helmet, boots, vest)
2. **Site context** — panoramic view of the HVAC installation area
3. **Equipment identity** — nameplate data and photos for each unit being serviced

Currently, the tech taps a folio → lands on the report form → jumps straight to equipment entries and maintenance steps. There is no structured arrival/site/equipment registration phase.

### What the research confirms

**AHRI Standards 210/240 and 340/360** define minimum nameplate data requirements for all HVAC equipment sold in the US. **UL 1995** (Heating and Cooling Equipment) mandates specific nameplate markings for UL listing. **AHRI 110** governs nameplate voltage standards.

Every commercial HVAC unit's nameplate/data plate universally contains:
- Manufacturer name/trademark (marca)
- Model number (encodes series, capacity, voltage/phase per manufacturer-specific nomenclature)
- Serial number (encodes manufacture date, plant, sequence)
- Refrigerant type designated per ASHRAE Standard 34 (R-410A, R-22, R-32, R-454B)
- Voltage rating (208V, 220V, 230V, 460V, etc.)
- Phase (single-phase or three-phase)
- Capacity (stated directly or encoded in model number — tons or BTU)

**Lennox** encodes voltage/phase as a letter suffix (A-Y), capacity in BTU thousands, and manufacture date in serial positions 3-5.  
**Carrier** encodes capacity as BTU thousands divisible by 6 for tonnage, date as week+year.  
**Trane** embeds capacity mid-model-number, date as first 4 digits (YYWW) in modern serials.  
**York/Johnson Controls** uses 4-letter prefix encoding plant+month+year+type.  
**Daikin** uses YYMM format in serials.

Field service industry best practice (SafetyCulture, BuildOps, OXmaint) uses "gated workflows" where safety/arrival/registration must be completed before maintenance checklists unlock.

### Ubicación en sitio

BBVA branches have standardized physical locations for HVAC equipment. These repeat across every branch:
- **ATM** — equipment serving the ATM vestibule
- **PATIO** — equipment in the patio/outdoor area
- **BÓVEDA** — equipment serving the vault
- **TREN DE CAJA** — equipment serving the teller line
- *(fifth location TBD — will be added later)*

This field is critical for the contractor — they need to know exactly which zone each unit serves.

---

## Architecture: Approach A — Pre-Workflow Gated Phases

The technician flow becomes a multi-phase gated process:

```
Tech taps folio
  └── Get/create today's report
        └── Report page loads
              │
              ├── PHASE 0: LLEGADA (Arrival)
              │   └── Required: 1 photo (tech in PPE at branch)
              │   └── Scope: per-report (every daily visit)
              │   └── Gate: blocks everything until done
              │
              ├── PHASE 1: PANORÁMICA DEL SITIO (Site Overview)
              │   └── Required: 1 photo (panoramic of HVAC area)
              │   └── Scope: per-folio (first visit only, optional on subsequent)
              │   └── Gate: blocks equipment registration until done
              │
              ├── PHASE 2: REGISTRO DE EQUIPOS (Equipment Registration)
              │   └── Per equipment in folio:
              │   │   ├── Required: 1 overall photo of unit
              │   │   ├── Required: 1 nameplate/placa photo
              │   │   └── Required: fill missing nameplate fields
              │   └── Gate: blocks maintenance until all equipment registered
              │
              └── PHASE 3: MANTENIMIENTO (existing workflow)
                  └── Equipment entries with preventive/corrective steps
                  └── Materials, status, signature (existing flow)
```

---

## Database Changes

### Migration: `supabase/migration-08-registration.sql`

#### 1. New columns on `equipos` table

```sql
ALTER TABLE public.equipos
  ADD COLUMN IF NOT EXISTS capacidad text,
  ADD COLUMN IF NOT EXISTS refrigerante text,
  ADD COLUMN IF NOT EXISTS voltaje text,
  ADD COLUMN IF NOT EXISTS fase text,
  ADD COLUMN IF NOT EXISTS ubicacion text;

COMMENT ON COLUMN public.equipos.capacidad IS 'Capacity: tonnage or BTU (e.g., "5 Ton", "60000 BTU")';
COMMENT ON COLUMN public.equipos.refrigerante IS 'Refrigerant type per ASHRAE 34 (e.g., R-410A, R-22, R-32)';
COMMENT ON COLUMN public.equipos.voltaje IS 'Nameplate voltage (e.g., "220V", "208/230V", "460V")';
COMMENT ON COLUMN public.equipos.fase IS 'Phase: monofasico or trifasico';
COMMENT ON COLUMN public.equipos.ubicacion IS 'Physical location within the branch (e.g., ATM, PATIO, BOVEDA, TREN DE CAJA)';
```

#### 2. New photo etiquetas

```sql
-- Add new etiquetas for arrival and site photos
ALTER TABLE public.reporte_fotos
  DROP CONSTRAINT IF EXISTS reporte_fotos_etiqueta_check;

ALTER TABLE public.reporte_fotos
  ADD CONSTRAINT reporte_fotos_etiqueta_check
  CHECK (etiqueta IN (
    'antes', 'durante', 'despues', 'dano', 'placa', 'progreso',
    'llegada',       -- arrival photo (tech in PPE)
    'sitio',         -- site overview panoramic
    'equipo_general' -- overall equipment photo for registration
  ));
```

Note: `placa` already exists — we reuse it for nameplate photos in registration phase.

#### 3. New columns on `reportes` table for gating state

```sql
ALTER TABLE public.reportes
  ADD COLUMN IF NOT EXISTS llegada_completada boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sitio_completado boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.reportes.llegada_completada IS 'True once arrival photo is captured for this report';
COMMENT ON COLUMN public.reportes.sitio_completado IS 'True once site overview photo is captured for this folio (checked across all reports for same folio)';
```

#### 4. Equipment registration tracking on `reporte_equipos`

```sql
ALTER TABLE public.reporte_equipos
  ADD COLUMN IF NOT EXISTS registro_completado boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.reporte_equipos.registro_completado IS 'True once equipment has overall photo + placa photo + nameplate data filled';
```

---

## TypeScript Type Changes

### `src/types/index.ts`

Update `Equipo` interface:
```typescript
export interface Equipo {
  id: string;
  sucursal_id: string;
  numero_etiqueta: string;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  tipo_equipo: string | null;
  tipo_equipo_id: string | null;
  agregado_por: string | null;
  revisado: boolean;
  // NEW: nameplate fields
  capacidad: string | null;
  refrigerante: string | null;
  voltaje: string | null;
  fase: string | null;
  ubicacion: string | null;
  created_at: string;
  updated_at: string;
}
```

Update `FotoEtiqueta`:
```typescript
export type FotoEtiqueta =
  | "antes" | "durante" | "despues" | "dano" | "placa" | "progreso"
  | "llegada" | "sitio" | "equipo_general";
```

Update `ReporteEquipo`:
```typescript
export interface ReporteEquipo {
  id: string;
  reporte_id: string;
  equipo_id: string;
  tipo_trabajo: TipoTrabajo;
  diagnostico: string | null;
  trabajo_realizado: string | null;
  observaciones: string | null;
  registro_completado: boolean; // NEW
}
```

Add `Reporte` fields:
```typescript
export interface Reporte {
  // ... existing fields ...
  llegada_completada: boolean;
  sitio_completado: boolean;
}
```

---

## Ubicación Constants

### `src/lib/constants/ubicaciones.ts`

```typescript
export const UBICACIONES_BBVA = [
  { value: "ATM", label: "ATM" },
  { value: "PATIO", label: "Patio" },
  { value: "BOVEDA", label: "Bóveda" },
  { value: "TREN_DE_CAJA", label: "Tren de Caja" },
  { value: "OTRO", label: "Otro (especificar)" },
] as const;

export type UbicacionValue = typeof UBICACIONES_BBVA[number]["value"];
```

The "OTRO" option allows the tech to type a custom location if the equipment doesn't fit the predefined zones. The fifth BBVA location will be added once confirmed.

---

## UI Implementation

### Report Page Restructure (`report-form.tsx`)

The report form becomes a phased container that shows/hides sections based on completion state:

```
┌─────────────────────────────────────────┐
│ Header (folio, sucursal, team, status)  │
├─────────────────────────────────────────┤
│ PHASE 0: LLEGADA                        │
│ ┌─────────────────────────────────────┐ │
│ │ 📷 Captura foto de llegada         │ │  ← camera button → photo preview
│ │ (Evidencia de EPP y hora de arribo) │ │
│ │ [✓ Completada / timestamp]         │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤ ← unlocked after arrival
│ PHASE 1: PANORÁMICA DEL SITIO           │
│ ┌─────────────────────────────────────┐ │
│ │ 📷 Captura foto panorámica del     │ │  ← camera button → photo preview
│ │     área de equipos HVAC           │ │
│ │ [✓ Ya capturada en visita anterior]│ │  ← if folio already has sitio photo
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤ ← unlocked after site
│ PHASE 2: REGISTRO DE EQUIPOS            │
│ ┌─────────────────────────────────────┐ │
│ │ Equipo 1: Mini Split Interior #001 │ │
│ │ ┌───┐ ┌───┐                        │ │
│ │ │ 📷│ │ 📷│  Foto general / placa  │ │  ← two photo slots
│ │ └───┘ └───┘                        │ │
│ │ Marca: [________]                  │ │  ← pre-filled if exists
│ │ Modelo: [________]                 │ │
│ │ Serie: [________]                  │ │
│ │ Capacidad: [________]              │ │
│ │ Refrigerante: [▼ R-410A ]         │ │  ← dropdown with common values
│ │ Voltaje: [▼ 220V ]                │ │  ← dropdown with common values
│ │ Fase: [◉ Mono ○ Tri]              │ │  ← radio toggle
│ │ Ubicación: [▼ ATM ]               │ │  ← dropdown from UBICACIONES
│ │ [✓ Registro completo]             │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Equipo 2: Mini Split Exterior #001 │ │
│ │ ... (same pattern)                 │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤ ← unlocked after all equipment registered
│ PHASE 3: MANTENIMIENTO                  │
│ (existing EquipmentSection + workflow)  │
│ ... steps, materials, status, signature │
└─────────────────────────────────────────┘
```

### New Components

#### 1. `arrival-section.tsx` (~120 LOC)
- Shows camera button for arrival photo with `etiqueta: 'llegada'`
- Photo has no `equipo_id` (report-level, not equipment-level)
- On capture: saves photo, updates `reportes.llegada_completada = true`
- Shows captured photo with timestamp
- Guidance text: "Foto del técnico con EPP completo (casco, botas, chaleco) al llegar a la sucursal"

#### 2. `site-overview-section.tsx` (~130 LOC)
- Checks if ANY report for this folio already has a `sitio` photo
- If yes: shows "Ya capturada" with thumbnail, allows adding another if desired
- If no: shows camera button for site photo with `etiqueta: 'sitio'`
- On capture: saves photo, updates `reportes.sitio_completado = true`
- Guidance text: "Foto panorámica del área donde están instalados los equipos de HVAC"

#### 3. `equipment-registration-section.tsx` (~250 LOC)
- Lists all equipment in the folio (from `folio_equipos`)
- Per equipment, shows:
  - Two photo slots: overall (`equipo_general`) and nameplate (`placa`)
  - Pre-filled form fields from `equipos` table (shows current values, highlights empty ones)
  - Form fields for missing data: marca, modelo, numero_serie, capacidad, refrigerante, voltaje, fase, ubicacion
  - "Registro completo" checkmark when both photos captured AND all required fields filled

#### 4. `equipment-registration-card.tsx` (~200 LOC)
- Individual equipment card within registration section
- Photo capture (reuses existing CameraCapture + PhotoSourcePicker)
- Form inputs with dropdowns for refrigerante, voltaje, fase, ubicacion
- Auto-save on blur/change (same pattern as current equipment entry forms)
- On save: updates `equipos` table directly AND sets `reporte_equipos.registro_completado = true`

#### 5. `phase-gate.tsx` (~60 LOC)
- Shared component that wraps content with lock/unlock logic
- Props: `isLocked`, `lockMessage`, `children`
- When locked: shows dimmed section with lock icon and message
- When unlocked: renders children normally

### Dropdown Options (for registration form)

```typescript
// Refrigerant options (most common in commercial HVAC in Mexico)
const REFRIGERANTES = [
  "R-410A",  // current standard
  "R-22",    // legacy (being phased out)
  "R-32",    // newer low-GWP
  "R-454B",  // next-gen replacement for R-410A
  "R-407C",  // common retrofit
  "Otro",
];

// Voltage options (per AHRI 110 standard ranges)
const VOLTAJES = [
  "127V",     // Mexico residential single-phase
  "220V",     // Mexico commercial
  "208V",     // common in some commercial
  "208/230V", // dual-rated
  "460V",     // industrial three-phase
  "Otro",
];

// Phase is a simple toggle: Monofásico / Trifásico
```

---

## Server Actions

### New actions in `src/app/actions/registration.ts`

```typescript
// 1. Complete arrival phase
export async function completeArrival(reporteId: string): Promise<void>
// Sets reportes.llegada_completada = true

// 2. Complete site overview phase
export async function completeSiteOverview(reporteId: string): Promise<void>
// Sets reportes.sitio_completado = true

// 3. Check if folio already has site photo (from any report)
export async function checkFolioSitePhoto(folioId: string): Promise<boolean>
// Queries reporte_fotos with etiqueta='sitio' joined through reportes on folio_id

// 4. Save equipment registration data
export async function saveEquipmentRegistration(
  equipoId: string,
  reporteEquipoId: string,
  data: {
    marca?: string;
    modelo?: string;
    numero_serie?: string;
    capacidad?: string;
    refrigerante?: string;
    voltaje?: string;
    fase?: string;
    ubicacion?: string;
  }
): Promise<void>
// Updates equipos table with non-null fields
// Checks if registration is complete (both photos + required fields)
// If complete, sets reporte_equipos.registro_completado = true

// 5. Check all equipment registration status
export async function checkRegistrationComplete(reporteId: string): Promise<boolean>
// Returns true if ALL reporte_equipos for this report have registro_completado = true
```

### Modifications to existing actions

- `getOrCreateTodayReport` → also returns `llegada_completada`, `sitio_completado`
- Photo upload action → handle new etiquetas (`llegada`, `sitio`, `equipo_general`)

---

## Data Flow: Equipment Registration → equipos table

This is the "admin creates skeleton, tech fills details" pattern:

1. **Admin creates equipment** with whatever they know (maybe just `numero_etiqueta` and `tipo_equipo_id`)
2. **Admin creates folio** and links equipment via `folio_equipos`
3. **Tech arrives at branch**, opens report
4. **Tech goes through registration phase** — for each equipment:
   - Takes overall photo → saved as `reporte_fotos` with `etiqueta='equipo_general'`, `equipo_id` set
   - Takes nameplate photo → saved as `reporte_fotos` with `etiqueta='placa'`, `equipo_id` set
   - Fills in nameplate data → **writes directly to `equipos` table** (marca, modelo, serie, capacidad, refrigerante, voltaje, fase, ubicacion)
5. **On subsequent visits** (same folio, new daily report):
   - Registration phase shows pre-filled data from `equipos` table
   - Photos from registration are already in the system
   - Tech can update/correct any field if needed
   - If all fields already filled from previous visit, registration phase auto-completes

### What "complete" means for registration

An equipment's registration is complete when ALL of these are true:
- At least 1 photo with `etiqueta='equipo_general'` exists for this equipment in any report for this folio
- At least 1 photo with `etiqueta='placa'` exists for this equipment in any report for this folio
- `equipos.marca` is not null/empty
- `equipos.modelo` is not null/empty
- `equipos.numero_serie` is not null/empty
- `equipos.capacidad` is not null/empty
- `equipos.refrigerante` is not null/empty
- `equipos.voltaje` is not null/empty
- `equipos.fase` is not null/empty
- `equipos.ubicacion` is not null/empty

---

## Impact on Existing Workflow Steps

### Step 2 (Inspección visual general) — CHANGES

Currently, Step 2 for both interior and exterior mini splits asks the tech to:
- "Fotografiar la placa de datos (modelo, serie, capacidad, refrigerante)"
- Record lecturas: Modelo (texto), Serie (texto), Capacidad (BTU), Tipo refrigerante (texto)

**After Phase 8:** This data is captured in the registration phase BEFORE Step 1 begins. Step 2's instructions should be simplified:
- Remove the placa photo requirement from Step 2 evidence (already captured in registration)
- Remove Modelo/Serie/Capacidad/Refrigerante from Step 2 lecturas (already in `equipos` table)
- Keep the visual inspection instructions (carcasa, daños, montaje, etc.)

This will require a **seed data update** (`seed-workflows.sql`) to modify Step 2 for both `mini_split_interior` and `mini_split_exterior`.

---

## Impact on PDF

### New sections in PDF report

The PDF should include the pre-maintenance evidence at the top, after the header:

```
┌─────────────────────────────────────────┐
│ HEADER (logo, folio, branch, date)      │
├─────────────────────────────────────────┤
│ EVIDENCIA DE LLEGADA                    │
│ ┌─────┐                                │
│ │ foto│  Hora: 08:15  GPS: 19.48,-99.02│
│ └─────┘                                │
├─────────────────────────────────────────┤
│ PANORÁMICA DEL SITIO                    │
│ ┌─────┐                                │
│ │ foto│                                 │
│ └─────┘                                │
├─────────────────────────────────────────┤
│ REGISTRO DE EQUIPOS                     │
│                                         │
│ ▸ Mini Split Interior #001 — ATM        │
│   ┌─────┐ ┌─────┐                      │
│   │gen. │ │placa│                        │
│   └─────┘ └─────┘                      │
│   Marca: Lennox  Modelo: HS26-060-1P   │
│   Serie: 5621M99989  Cap: 5 Ton        │
│   Refrig: R-410A  Voltaje: 220V        │
│   Fase: Monofásico  Ubic: ATM          │
│                                         │
│ ▸ Mini Split Exterior #001 — ATM        │
│   ... (same pattern)                    │
├─────────────────────────────────────────┤
│ MANTENIMIENTO (existing step blocks)    │
│ ...                                     │
└─────────────────────────────────────────┘
```

---

## Impact on Admin Side

### Admin Equipment Form

The admin equipment creation/edit form should include the new fields (capacidad, refrigerante, voltaje, fase, ubicacion) as optional inputs. Admin may fill them if known, or leave empty for tech to fill.

### Admin Report Detail

The admin report detail view should show the arrival photo, site overview, and equipment registration data in the same sequence as the PDF.

---

## Implementation Order

### Plan 08-01: Database + Types + Constants (~30 min)
1. Write `migration-08-registration.sql`
2. Update `src/types/index.ts` (Equipo, FotoEtiqueta, ReporteEquipo, Reporte)
3. Create `src/lib/constants/ubicaciones.ts`
4. Create `src/lib/constants/nameplate-options.ts` (refrigerantes, voltajes)
5. Update `schema.sql` comments to reflect new columns

### Plan 08-02: Server Actions (~30 min)
1. Create `src/app/actions/registration.ts` (5 new actions)
2. Update photo upload action to handle new etiquetas
3. Update `getOrCreateTodayReport` to return new fields
4. Add Zod schemas for registration data validation

### Plan 08-03: Registration UI Components (~60 min)
1. Create `phase-gate.tsx` (shared lock/unlock wrapper)
2. Create `arrival-section.tsx` (arrival photo capture)
3. Create `site-overview-section.tsx` (site panoramic capture)
4. Create `equipment-registration-card.tsx` (per-equipment registration)
5. Create `equipment-registration-section.tsx` (container for all equipment cards)

### Plan 08-04: Report Form Integration + Gating (~45 min)
1. Restructure `report-form.tsx` to phased layout
2. Wire arrival → site → registration → maintenance gating
3. Update `page.tsx` data fetching to include new fields
4. Update existing EquipmentSection to respect registration gate
5. Test complete flow: locked phases → unlock sequence

### Plan 08-05: Workflow Seed Update + PDF + Admin (~45 min)
1. Update `seed-workflows.sql` Step 2 for both mini_split types (remove duplicate placa/nameplate capture)
2. Add arrival/site/registration sections to PDF (`report-document.tsx`)
3. Update admin report detail view
4. Update admin equipment form with new fields

---

## Verification Criteria

When Phase 8 is complete, ALL of the following must be true:

1. ✅ Tech opens a report and sees the arrival phase first — cannot access anything below until arrival photo is taken
2. ✅ After arrival photo, site overview phase unlocks — if this folio already has a site photo from a previous report, it auto-completes
3. ✅ After site overview, equipment registration phase shows all equipment in the folio with photo slots and nameplate fields
4. ✅ Empty fields from `equipos` table are highlighted; pre-filled fields show existing data
5. ✅ Tech can take overall and placa photos per equipment using existing camera infrastructure
6. ✅ When tech fills nameplate data, it writes back to `equipos` table immediately (so future reports see the data)
7. ✅ After ALL equipment registered (photos + data), maintenance phase unlocks with existing workflow
8. ✅ Step 2 of preventive workflows no longer duplicates nameplate data capture
9. ✅ PDF includes arrival photo, site photo, and equipment registration block before maintenance steps
10. ✅ Admin can see and edit new equipment fields (capacidad, refrigerante, voltaje, fase, ubicacion)
11. ✅ Ubicación dropdown shows ATM, PATIO, BÓVEDA, TREN DE CAJA, OTRO options

---

## File Impact Summary

### New files (~7)
- `supabase/migration-08-registration.sql`
- `src/lib/constants/ubicaciones.ts`
- `src/lib/constants/nameplate-options.ts`
- `src/app/actions/registration.ts`
- `src/app/tecnico/reporte/[reporteId]/arrival-section.tsx`
- `src/app/tecnico/reporte/[reporteId]/site-overview-section.tsx`
- `src/app/tecnico/reporte/[reporteId]/equipment-registration-section.tsx`
- `src/app/tecnico/reporte/[reporteId]/equipment-registration-card.tsx`
- `src/components/shared/phase-gate.tsx`

### Modified files (~10)
- `src/types/index.ts` — new fields on Equipo, ReporteEquipo, Reporte, FotoEtiqueta
- `src/app/tecnico/reporte/[reporteId]/page.tsx` — additional data fetching
- `src/app/tecnico/reporte/[reporteId]/report-form.tsx` — phased layout with gating
- `src/app/actions/reportes.ts` — update getOrCreateTodayReport
- `src/app/actions/fotos.ts` — handle new etiquetas
- `src/components/pdf/report-document.tsx` — new pre-maintenance sections
- `src/app/admin/reportes/[reporteId]/page.tsx` — show registration data
- `src/app/admin/equipos/` — add new fields to equipment form
- `supabase/seed-workflows.sql` — simplify Step 2 for both equipment types
- `CLAUDE.md` — document new columns and migration

### Estimated total LOC added: ~900-1,100
### Estimated total plans: 5 (see Implementation Order above)
