# HVAC Daily Report Generator — CLAUDE.md

## Infrastructure Status
- **Vercel**: Deployed at https://omleb-hvac.vercel.app — GitHub auto-deploy connected (repo: steelhere11/OMLEB)
- **Supabase**: Project created and connected — database, auth, and file storage operational
- Credentials configured in `.env.local`

---

## Product Vision

**Project name**: HVAC Daily Report Generator (final name pending)

**What is it?** A progressive web app (PWA) that allows HVAC technicians to generate daily maintenance reports quickly, professionally, and from their phone. Admins manage branches, equipment, clients, and work orders, and have full control over reports before exporting them as PDF.

**Who is it for?**
- **Field technicians**: non tech-savvy users who need a simple interface to report their daily work
- **Admins (us)**: management of branches, equipment, clients, work orders, and review/editing of reports

**Problem it solves**: Currently, technicians use a third-party photo stamping app (GPS/time/date overlay) and send updates via WhatsApp groups (photos, voice notes, messages). There is no formal daily report system. The contractor requires daily professional reports with activity descriptions, equipment worked on, and photographic evidence. Jobs can last multiple days and aren't always finished the same day, but daily documentation is required. This app replaces the entire WhatsApp + stamping app workflow.

**Business structure**: We are an HVAC subcontractor. Sometimes we work through a middleman company, sometimes directly with the contractor. The app must handle both — the only variable is which client the report is directed to.

**Language**: The entire user-facing system must be in **Spanish** — UI labels, form fields, messages, PDF output, everything the user sees. Code, comments, and this document are in English.

---

## Tech Stack

| Component | Technology | Purpose |
|---|---|---|
| Frontend | **Next.js** (App Router) | Admin + Technician PWA |
| Hosting | **Vercel** | Deployment and hosting |
| Database | **Supabase** (PostgreSQL) | Data: branches, equipment, work orders, reports |
| Authentication | **Supabase Auth** | Admin vs technician login |
| File Storage | **Supabase Storage** | Photos uploaded by technicians |
| PDF | **React-PDF** or **jsPDF** | Report PDF generation |
| Styling | **Tailwind CSS** | Fast and consistent styling |
| PWA | **next-pwa** or manual config | Installable mobile access |

---

## User Roles

### Administrator
- Creates and manages branches (name, number, address)
- Creates and manages equipment per branch (number/tag, brand, model, serial number, type)
- Creates and manages clients (name, logo)
- Creates work orders / ordenes de servicio (assigns to branch, client, team of users, description of reported problem)
- Creates technician/helper accounts (admin-managed, no self-signup)
- Views reports submitted by technicians
- **Can edit and overwrite any field** in a report
- Finalizes and approves reports
- Exports reports as branded PDF (company logo + client logo/name)
- Has full control — gives final approval on everything
- Receives in-app + email notifications when reports are submitted

### Technician
- Logs into the PWA from their phone (admin-created account)
- Views assigned work orders / ordenes de servicio
- Fills in daily report per equipment
- **Can add new equipment from the field** (admin reviews/cleans up later)
- Takes photos with in-app camera — auto-stamps visible metadata overlay (location, time, date)
- Can also upload photos from gallery
- Logs materials used
- Sets report status
- Digital signature from client's on-site branch manager (only required on "Completado" status)
- Submits report

---

## Cuadrillas (Crews/Teams)

Work is done in teams — typically one technician + one helper. Sometimes multiple technicians.

**V1 approach:** Admin assigns multiple users directly to an orden de servicio. All assigned users can view and contribute to **one shared daily report** per orden. No formal "cuadrilla" entity — just multi-assignment.

**V2+:** Add a reusable "cuadrilla" entity — saved groups that can be quickly assigned with one click.

---

## V1 — Core Prototype (Current Scope)

### Build Order (priority)
1. **Admin basics (lean)** — Functional CRUD, not polished. Data foundation needed first.
2. **Tech reporting (the product)** — Full mobile experience. This is what makes V1 usable.
3. **Admin review + PDF** — View, edit, finalize, export.

### Admin Side (web)
1. **Authentication** — login with admin role
2. **Client Management**
   - Create, edit clients
   - Fields: nombre, logo
3. **Branch Management**
   - Create, edit, delete branches
   - Fields: nombre, numero, direccion
4. **Equipment Management per Branch**
   - Create, edit, delete equipment within a branch
   - Fields: numero/etiqueta del equipo, marca, modelo, numero de serie, tipo de equipo
   - Review tech-added equipment (flagged for review)
5. **User Management**
   - Create technician/helper accounts (admin-created, no self-signup)
6. **Work Order / Orden de Servicio Management**
   - Create orden de servicio: assign to branch, client, team of users, description of reported problem
7. **Report Viewer**
   - View all reports submitted by technicians
   - Open any report and **edit/overwrite any field**
   - Finalize and approve report
8. **PDF Export**
   - Generate professional PDF with company logo + client logo/name
   - Includes all report data, embedded photos (with metadata), clear status indicator
9. **Notifications**
   - In-app notification when report is submitted
   - Email notification when report is submitted

### Technician Side (PWA, mobile-first)
1. **Authentication** — login with technician role
2. **View assigned ordenes de servicio** — list of pending work orders
3. **Fill in daily report**:
   - Equipment auto-loaded from branch; can add new equipment on-the-fly
   - Per equipment: work type (Preventivo / Correctivo toggle), diagnostico, trabajo realizado, observaciones
   - Photos attached per equipment or per report (via in-app camera with metadata overlay, or gallery upload)
4. **Materials used** — simple table: cantidad, unidad, descripcion (with "add row" button)
5. **Report status**:
   - **En Progreso** — daily closure, work continues tomorrow
   - **En Espera** — waiting for parts, authorization, etc.
   - **Completado** — job finished
6. **Digital signature** — only required when status is "Completado" (on-screen signature capture from client's on-site branch manager)
7. **Submit report**

---

## Version Roadmap

| Version | Feature | Description |
|---|---|---|
| **V1** | Core Prototype | Admin manages branches/equipment/clients/ordenes de servicio. Technician fills reports with in-app camera. PDF export. |
| **V2** | Multi-day Linking + Cuadrillas | Multi-day jobs connected. Daily reports auto-pull previous context. Reusable cuadrilla entity. Combined report export. |
| **V3** | GPS Stamping + Time Tracking | Arrival/departure slide buttons with auto-timestamp and GPS coordinates. Location data in reports and PDF. |
| **V4** | Offline Mode | Full offline capability for technicians. Local storage on device. Auto-sync when connection returns. |
| **V5** | Enhanced Admin Dashboard | Overview: open jobs, technician locations, pending reports. Admin creates custom checklists per job/equipment type. |

---

## Database Schema (Supabase)

All table and column names are in Spanish since they represent domain-specific data for a Spanish-language application.

### Main Tables

**users**
- id (uuid, PK)
- email
- nombre
- rol (admin | tecnico | ayudante)
- created_at

**clientes**
- id (uuid, PK)
- nombre
- logo_url (text — Supabase Storage URL, nullable)
- created_at
- updated_at

**sucursales**
- id (uuid, PK)
- nombre
- numero
- direccion
- created_at
- updated_at

**equipos**
- id (uuid, PK)
- sucursal_id (FK → sucursales)
- numero_etiqueta (e.g., "Equipo 2")
- marca
- modelo
- numero_serie
- tipo_equipo
- agregado_por (FK → users, nullable — tracks who added it)
- revisado (boolean, default false — flags tech-added equipment for admin review)
- created_at
- updated_at

**ordenes_servicio**
- id (uuid, PK)
- sucursal_id (FK → sucursales)
- cliente_id (FK → clientes)
- numero_orden (auto-generated, prefix ODS-)
- descripcion_problema
- estatus (abierto | en_progreso | completado | en_espera)
- created_at
- updated_at

**orden_asignados** (multi-assign: team members per orden)
- id (uuid, PK)
- orden_servicio_id (FK → ordenes_servicio)
- usuario_id (FK → users)
- created_at

**reportes**
- id (uuid, PK)
- orden_servicio_id (FK → ordenes_servicio)
- creado_por (FK → users — who created the report)
- sucursal_id (FK → sucursales)
- fecha
- estatus (en_progreso | en_espera | completado)
- firma_encargado (text/blob — only if completado)
- finalizado_por_admin (boolean)
- created_at
- updated_at

**reporte_equipos** (per-equipment details within a report)
- id (uuid, PK)
- reporte_id (FK → reportes)
- equipo_id (FK → equipos)
- tipo_trabajo (preventivo | correctivo)
- diagnostico (text)
- trabajo_realizado (text)
- observaciones (text)

**reporte_fotos**
- id (uuid, PK)
- reporte_id (FK → reportes)
- equipo_id (FK → equipos, nullable — can be general report photo)
- url (text — Supabase Storage URL)
- etiqueta (text — e.g., "antes", "despues", "dano", "placa", "progreso")
- metadata_gps (text — lat,lng burned into overlay)
- metadata_fecha (timestamp — burned into overlay)
- created_at

**reporte_materiales**
- id (uuid, PK)
- reporte_id (FK → reportes)
- cantidad (numeric)
- unidad (text)
- descripcion (text)

---

V1.5 — Guided Maintenance Workflows
Overview
Pre-loaded step-by-step maintenance workflows that guide technicians through preventive and corrective work on mini splits and mini chillers. Replaces free-text reporting with structured, evidence-driven workflows.
New Tables (run supabase/migration-workflows.sql AFTER schema.sql + rls.sql)
tipos_equipo — Admin-extensible equipment type catalog

slug (unique key: mini_split_interior, mini_split_exterior, mini_chiller, otro)
nombre (Spanish display name)
is_system (true = pre-seeded, cannot be deleted)
Admins can add new types; technicians see them in dropdowns
equipos.tipo_equipo_id (new FK) replaces the old free-text tipo_equipo column

plantillas_pasos — Pre-loaded preventive maintenance step templates

tipo_equipo_slug → matches tipos_equipo.slug
tipo_mantenimiento (preventivo | correctivo)
orden (step sequence: 1, 2, 3...)
nombre, procedimiento (Spanish text)
evidencia_requerida (jsonb array: [{etapa: "antes"|"durante"|"despues", descripcion: "..."}])
lecturas_requeridas (jsonb array: [{nombre, unidad, rango_min, rango_max}])
es_obligatorio (boolean)

fallas_correctivas — Pre-loaded corrective issue library

tipo_equipo_slug → matches tipos_equipo.slug
nombre, diagnostico (Spanish text)
evidencia_requerida (jsonb, same format as plantillas_pasos)
materiales_tipicos (jsonb string array)

reporte_pasos — Tracks technician completion of each step

reporte_equipo_id (FK → reporte_equipos)
plantilla_paso_id (FK → plantillas_pasos, set for preventive)
falla_correctiva_id (FK → fallas_correctivas, set for corrective)
completado (boolean)
notas (text)
lecturas (jsonb: {amperaje_compresor: 12.5, voltaje_l1l2: 220})
completed_at (timestamp)

valores_referencia — Reference values for real-time reading validation

nombre (unique key like "presion_succion_r410a")
unidad, rango_min, rango_max, notas

Modified existing table:

reporte_fotos: added reporte_paso_id (FK → reporte_pasos, nullable) to tie photos to specific steps
reporte_fotos: added 'durante' to etiqueta check constraint

Seed Data (run supabase/seed-workflows.sql AFTER migration-workflows.sql)

4 system equipment types (mini_split_interior, mini_split_exterior, mini_chiller, otro)
13 indoor mini split preventive steps
10 outdoor mini split preventive steps
13 mini chiller preventive steps
15 mini split corrective issues (split between interior and exterior)
12 mini chiller corrective issues
15 reference values for reading validation

TypeScript Types

New types in src/types/workflows.ts: TipoEquipo, PlantillaPaso, FallaCorrectiva, ReportePaso, ValorReferencia, EvidenciaRequerida, LecturaRequerida

Technician Workflow Change
Current flow: Select orden de servicio → select equipment → free-text fields → attach photos → submit
New flow: Select orden de servicio → select equipment → choose preventivo/correctivo:

Preventivo: App detects tipo_equipo from equipos table, loads matching plantillas_pasos in order. Each step = swipeable card with: step name, procedure, labeled camera buttons (📷 ANTES / 📷 DURANTE / 📷 DESPUÉS), numeric reading inputs with real-time range validation.
Correctivo: App shows picker with fallas_correctivas matching equipment type. Tech selects issue(s), app loads required evidence and materials list. Multiple issues selectable per equipment.

Admin Capabilities

Admin can add new equipment types via tipos_equipo (these appear in dropdowns)
Admin can manage workflow templates via plantillas_pasos and fallas_correctivas
Admin can update reference values for validation ranges
System-seeded types (is_system=true) cannot be deleted

Implementation Notes

The equipos table now has both tipo_equipo (old free text, kept for backward compat) and tipo_equipo_id (new FK). App code should use tipo_equipo_id. Drop tipo_equipo column when migration is complete.
Reading validation: compare technician inputs against valores_referencia ranges. Show yellow warning if outside range (don't block submission — techs know their equipment).
Photo evidence per step: reporte_fotos.reporte_paso_id links photos to specific workflow steps.
Steps with es_obligatorio=false can be skipped.
lecturas with unidad="texto" are free-text fields (model numbers, etc.), not numeric.
lecturas with unidad="Sí/No" should render as a toggle, not a text field.

---

## Code Conventions

- **File names**: kebab-case in English (e.g., `branch-form.tsx`, `report-list.tsx`)
- **Component names**: PascalCase in English (e.g., `BranchForm`, `ReportList`)
- **Variable/function names**: camelCase in English (e.g., `getBranches`, `submitReport`)
- **User-facing text (UI)**: All in **Spanish**
- **Database table and column names**: In **Spanish** (as defined above)
- **Components folder**: `/src/components/`
- **Pages folder**: `/src/app/` (Next.js App Router)
- **Utilities folder**: `/src/lib/`
- **Types folder**: `/src/types/`

---

## Folder Structure (proposed)
```
/
├── public/
│   ├── manifest.json          # PWA manifest
│   └── icons/                 # App icons
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing / login
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── clientes/
│   │   │   ├── sucursales/
│   │   │   ├── equipos/
│   │   │   ├── ordenes-servicio/
│   │   │   ├── usuarios/
│   │   │   └── reportes/
│   │   └── tecnico/
│   │       ├── layout.tsx
│   │       ├── ordenes-servicio/
│   │       └── reporte/
│   ├── components/
│   │   ├── ui/                # Buttons, inputs, modals, etc.
│   │   ├── admin/             # Admin-specific components
│   │   ├── tecnico/           # Technician-specific components
│   │   └── shared/            # Shared components (photo capture, signature pad)
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client
│   │   ├── pdf-generator.ts   # PDF generation logic
│   │   ├── photo-stamper.ts   # Photo metadata overlay logic
│   │   └── utils.ts           # General utilities
│   └── types/
│       └── index.ts           # TypeScript types
├── .env.local                 # Environment variables (Supabase keys)
├── CLAUDE.md                  # This file
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Design Decisions

- **Mobile-first**: The technician side is designed for phone screens first
- **Simple interface**: Technicians are not tech-savvy — large buttons, clear flows, minimal typing required
- **Dropdowns over free text**: Wherever possible, use selects and toggles instead of text fields
- **In-app camera with metadata overlay**: Replaces external stamping app — auto-burns GPS, time, date into photos
- **Gallery upload too**: Flexibility for photos already taken
- **Visible status**: Always clear what state a report is in (en progreso, en espera, completado)
- **Admin is king**: The administrator can overwrite any field at any time
- **One shared report per cuadrilla**: Team contributes to a single daily report per orden de servicio
- **Techs can add equipment on-site**: Unblocks field work; admin reviews later
- **Client flexibility**: Reports can be directed to any client (subcontractor or direct contractor relationship)

---

## Important Notes

- Logo and brand name will be added later — use placeholder for now
- The contractor's form (BBVA / Maricela Cornejo Hernandez "papeleta") is reference only — our PDF is our own independent professional design
- The main contractor has dozens of branches
- Jobs can last multiple days — V1 handles this with "En Progreso" status, V2 adds automatic linking
- Offline mode is critical but ships in V4, not V1
- Photo markup is desirable but not a blocker — if too complex, defer to a future version
- Timeline is ASAP — needs to be usable on real jobs within days
- V1 is "ready" when technicians can submit reports from their phone

---

## Reference: Contractor's Form (Papeleta)

The contractor (Maricela Cornejo Hernandez) uses a paper form called "FORMATO DE MANTENIMIENTO CORRECTIVO" for BBVA branch services. It captures: sucursal, domicilio, hora llegada/salida, equipment data, equipment needing corrective work (marca, modelo, capacidad, serie, inventario), problema reportado y comentarios, material empleado (cantidad, unidad, concepto), signatures, and a satisfaction survey. This form is REFERENCE ONLY — our system generates its own independent professional format.
