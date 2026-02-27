# Phase 2: Admin Data Management - Research

**Researched:** 2026-02-27
**Domain:** Next.js 16 Server Actions CRUD, Supabase Storage (logo uploads), Zod 4 form validation
**Confidence:** HIGH

## Summary

Phase 2 builds the admin CRUD pages for clients, branches, equipment, and folios (work orders). The architecture follows the patterns already established in Phase 1: Server Components for data fetching (list/detail pages), Client Components with `useActionState` for forms, and Server Actions in `src/app/actions/` for mutations. The existing codebase already has working examples of this exact pattern (user creation at `/admin/usuarios/nuevo` and user list at `/admin/usuarios`).

The key new capabilities in this phase are: (1) file uploads for client logos via Supabase Storage, (2) Zod 4 server-side form validation with Spanish error messages, (3) relational data management (equipment belongs to branches, folios reference both branches and clients), and (4) multi-select user assignment for folio cuadrillas. The database schema, types, and RLS policies are already in place from Phase 1 -- this phase only builds the UI and server actions.

**Primary recommendation:** Follow the existing `useActionState` + Server Actions pattern from Phase 1. Add Zod 4 as a direct dependency for server-side validation. Upload client logos directly to Supabase Storage from Server Actions with the admin client (service role bypasses RLS). Use `revalidatePath` after every mutation to refresh Server Component data. Build a simple checkbox-based multi-select for folio user assignment rather than a complex dropdown.

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | App Router, Server Components, Server Actions | Already installed; form handling, revalidation built-in |
| react | 19.2.3 | useActionState hook for form state | Already installed; pending state + error handling |
| @supabase/supabase-js | 2.97.0 | Database queries + Storage uploads | Already installed; CRUD + file storage |
| @supabase/ssr | 0.8.0 | Server-side Supabase client | Already installed; cookie-based auth |
| tailwindcss | 4.x | Styling | Already installed; CSS-first config |

### New Dependencies

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | 4.x | Server-side form validation | Every server action that accepts form data |

Zod 4.3.6 is already present in `node_modules` as a transitive dependency of `@serwist/next` and `eslint-config-next`, but it MUST be added as a direct dependency for the project to use it reliably.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zod 4 (server validation) | Manual validation | Zod provides type-safe schemas, Spanish error messages, and `.flattenError()` for form field mapping -- manual validation would duplicate this |
| Direct Supabase upload in Server Action | Signed upload URLs (client-side) | For small logos (<1MB), direct server action upload is simpler. Signed URLs needed later for larger photo uploads in Phase 4 |
| Checkbox multi-select | Fancy dropdown component | Cuadrilla assignment has few users (<20); checkboxes are simpler, more accessible, and work without JS |

**Installation:**
```bash
npm install zod
```

## Architecture Patterns

### File Organization for Phase 2

```
src/
├── app/
│   ├── actions/
│   │   ├── auth.ts              # Existing (Phase 1)
│   │   ├── clientes.ts          # NEW: Client CRUD actions
│   │   ├── sucursales.ts        # NEW: Branch CRUD actions
│   │   ├── equipos.ts           # NEW: Equipment CRUD actions
│   │   └── folios.ts            # NEW: Folio CRUD + assignment actions
│   └── admin/
│       ├── clientes/
│       │   ├── page.tsx          # Client list (Server Component)
│       │   ├── nuevo/
│       │   │   └── page.tsx      # Create client form (Client Component)
│       │   └── [id]/
│       │       └── editar/
│       │           └── page.tsx  # Edit client form (Client Component)
│       ├── sucursales/
│       │   ├── page.tsx          # Branch list (Server Component)
│       │   ├── nuevo/
│       │   │   └── page.tsx      # Create branch form
│       │   └── [id]/
│       │       └── editar/
│       │           └── page.tsx  # Edit branch form
│       ├── equipos/
│       │   ├── page.tsx          # Equipment list (Server Component, with branch filter)
│       │   └── [sucursalId]/     # Scoped to branch
│       │       ├── page.tsx      # Equipment for specific branch
│       │       ├── nuevo/
│       │       │   └── page.tsx  # Create equipment form
│       │       └── [id]/
│       │           └── editar/
│       │               └── page.tsx  # Edit equipment form
│       └── folios/
│           ├── page.tsx          # Folio list (Server Component)
│           ├── nuevo/
│           │   └── page.tsx      # Create folio form with user assignment
│           └── [id]/
│               └── editar/
│                   └── page.tsx  # Edit folio form
├── lib/
│   └── validations/
│       ├── clientes.ts           # NEW: Zod schemas for clients
│       ├── sucursales.ts         # NEW: Zod schemas for branches
│       ├── equipos.ts            # NEW: Zod schemas for equipment
│       └── folios.ts             # NEW: Zod schemas for folios
└── types/
    └── index.ts                  # Existing (already has all types)
```

### Pattern 1: Server Action with Zod Validation (CRUD Create/Update)

**What:** Every server action validates input with Zod, returns typed state for `useActionState`.
**When to use:** All form submissions (create, edit).

```typescript
// Source: Next.js official docs (forms guide) + Zod 4 docs
// File: src/app/actions/sucursales.ts

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sucursalSchema } from "@/lib/validations/sucursales";
import { z } from "zod";

export interface ActionState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
  message?: string;
}

export async function createSucursal(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  // 1. Verify admin role
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  // 2. Validate with Zod
  const rawData = {
    nombre: formData.get("nombre"),
    numero: formData.get("numero"),
    direccion: formData.get("direccion"),
  };

  const result = sucursalSchema.safeParse(rawData);
  if (!result.success) {
    const flattened = z.flattenError(result.error);
    return { fieldErrors: flattened.fieldErrors };
  }

  // 3. Insert into database
  const { error: dbError } = await supabase
    .from("sucursales")
    .insert(result.data);

  if (dbError) {
    return { error: "Error al crear la sucursal: " + dbError.message };
  }

  // 4. Revalidate and redirect
  revalidatePath("/admin/sucursales");
  redirect("/admin/sucursales");
}
```

### Pattern 2: Zod Schema with Spanish Error Messages (Zod 4)

**What:** Validation schemas with Spanish messages using Zod 4 `error` parameter.
**When to use:** Every validation schema.

```typescript
// Source: Zod 4 docs (zod.dev/v4/changelog, zod.dev/error-customization)
// File: src/lib/validations/sucursales.ts

import { z } from "zod";

export const sucursalSchema = z.object({
  nombre: z.string({ error: "El nombre es requerido" })
    .min(1, { error: "El nombre es requerido" })
    .max(200, { error: "El nombre no puede exceder 200 caracteres" }),
  numero: z.string({ error: "El numero es requerido" })
    .min(1, { error: "El numero es requerido" }),
  direccion: z.string({ error: "La direccion es requerida" })
    .min(1, { error: "La direccion es requerida" }),
});

export type SucursalInput = z.infer<typeof sucursalSchema>;
```

### Pattern 3: Client Form Component with useActionState

**What:** Client component that uses `useActionState` for form state, displays field-level errors.
**When to use:** Every create/edit form page.

```typescript
// Source: Next.js official docs (forms guide) + existing auth.ts pattern
// File: src/app/admin/sucursales/nuevo/page.tsx

"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createSucursal, type ActionState } from "@/app/actions/sucursales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NuevaSucursalPage() {
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    createSucursal,
    null
  );

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/admin/sucursales" className="...">Volver a sucursales</Link>
      <h1 className="...">Crear Sucursal</h1>

      <form action={formAction} className="space-y-5">
        <div>
          <Label htmlFor="nombre" required className="text-gray-300">Nombre</Label>
          <Input
            id="nombre"
            name="nombre"
            required
            error={state?.fieldErrors?.nombre?.[0]}
            className="mt-1.5 border-admin-border bg-admin-bg text-white"
          />
        </div>
        {/* ... more fields ... */}

        {state?.error && (
          <div className="rounded-lg border border-red-800 bg-red-900/30 px-4 py-3">
            <p className="text-sm text-red-400">{state.error}</p>
          </div>
        )}

        <Button type="submit" fullWidth size="lg" loading={isPending}>
          Crear Sucursal
        </Button>
      </form>
    </div>
  );
}
```

### Pattern 4: Server Component List Page (Data Fetching)

**What:** Server Component that fetches data directly from Supabase and renders a list/table.
**When to use:** Every list page (clientes, sucursales, equipos, folios).

```typescript
// Source: Existing pattern from src/app/admin/usuarios/page.tsx
// File: src/app/admin/sucursales/page.tsx

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Sucursal } from "@/types";

export default async function SucursalesPage() {
  const supabase = await createClient();
  const { data: sucursales } = await supabase
    .from("sucursales")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (sucursales as Sucursal[] | null) ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Sucursales</h1>
        <Link href="/admin/sucursales/nuevo" className="...">
          Crear Sucursal
        </Link>
      </div>
      {/* Table or empty state */}
    </div>
  );
}
```

### Pattern 5: Edit Form with Pre-populated Data (bind pattern)

**What:** Edit pages fetch existing data on the server side, pass to client form, use `bind` for the action.
**When to use:** Every edit form.

```typescript
// Source: Next.js official docs (forms guide, passing additional arguments)
// File: src/app/admin/sucursales/[id]/editar/page.tsx

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { EditSucursalForm } from "./edit-form";

export default async function EditarSucursalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: sucursal } = await supabase
    .from("sucursales")
    .select("*")
    .eq("id", id)
    .single();

  if (!sucursal) notFound();

  return <EditSucursalForm sucursal={sucursal} />;
}

// In the client component, bind the ID to the update action:
// const updateWithId = updateSucursal.bind(null, sucursal.id);
// <form action={updateWithId}>...</form>
```

### Pattern 6: File Upload for Client Logos (Supabase Storage)

**What:** Upload logos via server action using admin client (service role bypasses Storage RLS).
**When to use:** Client create/edit forms.

```typescript
// Source: Supabase Storage docs + Next.js server action body size config
// File: src/app/actions/clientes.ts

"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function createCliente(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  // ... auth check and name validation ...

  const admin = createAdminClient();
  let logoUrl: string | null = null;

  const logoFile = formData.get("logo") as File | null;
  if (logoFile && logoFile.size > 0) {
    // Validate file
    if (logoFile.size > 2 * 1024 * 1024) {
      return { error: "El logo no puede exceder 2MB" };
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(logoFile.type)) {
      return { error: "El logo debe ser JPG, PNG o WebP" };
    }

    // Upload to Supabase Storage
    const ext = logoFile.name.split(".").pop();
    const filePath = `logos/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from("clientes")
      .upload(filePath, logoFile, {
        contentType: logoFile.type,
        upsert: false,
      });

    if (uploadError) {
      return { error: "Error al subir el logo: " + uploadError.message };
    }

    // Get public URL
    const { data: urlData } = admin.storage
      .from("clientes")
      .getPublicUrl(filePath);
    logoUrl = urlData.publicUrl;
  }

  // Insert client with logo URL
  const { error: dbError } = await admin.from("clientes").insert({
    nombre: validatedData.nombre,
    logo_url: logoUrl,
  });

  // ...
}
```

### Pattern 7: Folio Creation with Multi-User Assignment

**What:** Create folio + insert into `folio_asignados` in a single server action.
**When to use:** Folio create/edit forms.

```typescript
// Source: Supabase docs + existing schema (folio_asignados table)
// File: src/app/actions/folios.ts (partial)

export async function createFolio(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  // ... auth check, validation ...

  const supabase = await createClient();

  // Get selected user IDs from form (checkboxes with name="usuarios")
  const userIds = formData.getAll("usuarios") as string[];
  if (userIds.length === 0) {
    return { error: "Debe asignar al menos un tecnico al folio" };
  }

  // Insert folio (numero_folio is auto-generated by DB trigger)
  const { data: folio, error: folioError } = await supabase
    .from("folios")
    .insert({
      sucursal_id: validatedData.sucursal_id,
      cliente_id: validatedData.cliente_id,
      descripcion_problema: validatedData.descripcion_problema,
    })
    .select("id")
    .single();

  if (folioError) {
    return { error: "Error al crear el folio: " + folioError.message };
  }

  // Assign users to folio
  const assignments = userIds.map((userId) => ({
    folio_id: folio.id,
    usuario_id: userId,
  }));

  const { error: assignError } = await supabase
    .from("folio_asignados")
    .insert(assignments);

  if (assignError) {
    return { error: "Folio creado pero error al asignar usuarios: " + assignError.message };
  }

  revalidatePath("/admin/folios");
  redirect("/admin/folios");
}
```

### Pattern 8: Delete with Confirmation

**What:** Delete action triggered via form with hidden input, confirmation via browser dialog.
**When to use:** Delete buttons on list pages or detail pages.

```typescript
// Client-side confirmation before form submission:
<form action={deleteAction}>
  <input type="hidden" name="id" value={item.id} />
  <Button
    type="submit"
    variant="danger"
    size="sm"
    onClick={(e) => {
      if (!confirm("Esta seguro de eliminar este registro?")) {
        e.preventDefault();
      }
    }}
  >
    Eliminar
  </Button>
</form>
```

### Anti-Patterns to Avoid

- **Client-side data fetching for lists:** Do NOT use `useEffect` + `useState` to fetch data in admin list pages. Use Server Components with direct Supabase queries -- they're simpler, faster, and SEO-friendly.
- **API routes for CRUD:** Do NOT create `/api/` routes for simple CRUD operations. Server Actions handle this directly.
- **Throwing errors in Server Actions:** Do NOT throw errors. Return them as part of the `ActionState` object. The `useActionState` hook expects return values, not thrown errors.
- **Using `.from("sucursales")` without type casting:** The Supabase JS client without generated types returns `any`. Always cast results: `(data as Sucursal[] | null) ?? []`.
- **Forgetting `revalidatePath` after mutations:** Server Components cache data. After any insert/update/delete, call `revalidatePath("/admin/[section]")` to refresh the list page.
- **Using `redirect()` inside try/catch:** `redirect()` throws internally. Call it AFTER all try/catch blocks, not inside them.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Manual if/else field checks | Zod 4 schemas with `safeParse` + `z.flattenError()` | Consistent, type-safe, Spanish messages, field-level errors mapped automatically |
| File upload to storage | Custom multer/formidable handler | Supabase Storage `.upload()` via admin client | Handles CDN, access control, public URLs automatically |
| Auto-incrementing folio numbers | Manual counter logic | DB trigger `generate_folio_number()` already exists | Atomic, race-condition-free, handles concurrent inserts |
| Updated timestamps | Manual `new Date()` in actions | DB trigger `set_updated_at()` already exists | Always accurate, no chance of forgetting |
| Auth verification in actions | Custom JWT parsing | `supabase.auth.getUser()` + `app_metadata.rol` check | Already established pattern in auth.ts |
| Form pending/loading state | Manual useState for loading | `useActionState` third return value `isPending` | Built into React 19, works with progressive enhancement |

**Key insight:** The database layer (Phase 1) already handles auto-generation of folio numbers, updated_at timestamps, and RLS enforcement. The server actions only need to: (1) verify admin role, (2) validate input with Zod, (3) call Supabase, (4) revalidate path. Do not duplicate database logic in application code.

## Common Pitfalls

### Pitfall 1: Server Action Body Size Limit for File Uploads

**What goes wrong:** Next.js limits server action request bodies to 1MB by default. Client logo uploads may exceed this.
**Why it happens:** File data is sent as part of the FormData body to the server action.
**How to avoid:** Configure `serverActions.bodySizeLimit` in `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};
```
**Warning signs:** Form submission silently fails or returns a generic error when uploading images over 1MB.

### Pitfall 2: Supabase Storage Bucket Must Exist Before Uploads

**What goes wrong:** Uploads fail with "Bucket not found" error.
**Why it happens:** Unlike database tables (created by schema.sql), storage buckets are NOT created by SQL migrations -- they must be created separately.
**How to avoid:** Include a SQL migration or setup instruction to create the `clientes` bucket:
```sql
-- Add to supabase/storage.sql (new file)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clientes',
  'clientes',
  true,
  2097152,  -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);
```
Or create via Supabase Dashboard: Storage > New Bucket > "clientes" > Make Public.
**Warning signs:** 404 or "Bucket not found" errors when uploading logos.

### Pitfall 3: Zod 4 API Differences from Zod 3

**What goes wrong:** Using Zod 3 patterns (`.flatten()`, `required_error`, `invalid_type_error`) that have changed in Zod 4.
**Why it happens:** Most tutorials and Claude's training data use Zod 3 patterns.
**How to avoid:**
- Use `z.flattenError(result.error)` NOT `result.error.flatten()`
- Use `{ error: "message" }` NOT `{ message: "..." }` or `{ required_error: "..." }`
- Import from `"zod"` directly (Zod 4 is ESM-first)
**Warning signs:** TypeScript errors about missing `.flatten()` method, or `error` vs `message` property mismatches.

### Pitfall 4: redirect() Inside try/catch

**What goes wrong:** `redirect()` call is caught by the catch block and the redirect never happens.
**Why it happens:** Next.js `redirect()` throws a special NEXT_REDIRECT error internally.
**How to avoid:** Always call `redirect()` after all try/catch blocks, at the top level of the function. The existing `auth.ts` already follows this pattern correctly.
**Warning signs:** Form submits successfully but user stays on the same page.

### Pitfall 5: Forgetting revalidatePath After Mutations

**What goes wrong:** After creating/updating/deleting a record, the list page shows stale data.
**Why it happens:** Next.js caches Server Component renders. Without revalidation, the cached version persists.
**How to avoid:** Call `revalidatePath("/admin/[section]")` before any `redirect()` in every mutation action.
**Warning signs:** Newly created items don't appear in lists until a hard refresh.

### Pitfall 6: Equipment Page Routing -- Branch-Scoped vs Global

**What goes wrong:** Equipment pages lack branch context, making it impossible to know which branch equipment belongs to.
**Why it happens:** Equipment is always scoped to a branch (`sucursal_id`), but the URL structure may not reflect this.
**How to avoid:** Two viable approaches:
1. **Branch-scoped routes:** `/admin/equipos/[sucursalId]` -- shows equipment for one branch. Requires navigating from branch detail.
2. **Global list with branch filter:** `/admin/equipos?sucursal=[id]` -- shows all equipment with a branch dropdown filter.
Recommendation: Use approach 1 (branch-scoped routes) with a "Ver equipos" link on each branch row in the sucursales list. Also provide a global `/admin/equipos` page that groups by branch.
**Warning signs:** Users confused about which branch they're adding equipment to.

### Pitfall 7: ON DELETE RESTRICT Prevents Deletion

**What goes wrong:** Deleting a branch fails because folios reference it.
**Why it happens:** Schema uses `ON DELETE RESTRICT` on `folios.sucursal_id` and `folios.cliente_id` -- this is by design to prevent data loss.
**How to avoid:** Show clear Spanish error messages when deletion fails due to foreign key constraints. Check for references before attempting delete, or catch the Postgres error code `23503` (foreign_key_violation).
**Warning signs:** Generic database error messages shown to admin instead of helpful "Esta sucursal tiene folios asignados y no puede ser eliminada."

## Code Examples

### Supabase Storage Setup SQL

```sql
-- File: supabase/storage.sql
-- Run AFTER schema.sql and rls.sql

-- Create public bucket for client logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clientes',
  'clientes',
  true,
  2097152,  -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- RLS policy: Admins can upload logos
-- (Service role key bypasses RLS, but this is a safety net)
CREATE POLICY "admin_upload_logos"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'clientes'
  AND ((SELECT auth.jwt()) -> 'app_metadata' ->> 'rol') = 'admin'
);

-- RLS policy: Anyone authenticated can view logos (public bucket handles this)
CREATE POLICY "authenticated_view_logos"
ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'clientes');
```

### Complete Zod Schema for Clientes

```typescript
// File: src/lib/validations/clientes.ts
import { z } from "zod";

export const clienteSchema = z.object({
  nombre: z.string({ error: "El nombre es requerido" })
    .min(1, { error: "El nombre es requerido" })
    .max(200, { error: "El nombre no puede exceder 200 caracteres" })
    .trim(),
});

export type ClienteInput = z.infer<typeof clienteSchema>;
```

### Complete Zod Schema for Equipos

```typescript
// File: src/lib/validations/equipos.ts
import { z } from "zod";

export const equipoSchema = z.object({
  sucursal_id: z.string({ error: "La sucursal es requerida" })
    .uuid({ error: "ID de sucursal invalido" }),
  numero_etiqueta: z.string({ error: "La etiqueta del equipo es requerida" })
    .min(1, { error: "La etiqueta del equipo es requerida" })
    .max(100, { error: "La etiqueta no puede exceder 100 caracteres" }),
  marca: z.string().max(100, { error: "La marca no puede exceder 100 caracteres" }).optional().or(z.literal("")),
  modelo: z.string().max(100, { error: "El modelo no puede exceder 100 caracteres" }).optional().or(z.literal("")),
  numero_serie: z.string().max(100, { error: "El numero de serie no puede exceder 100 caracteres" }).optional().or(z.literal("")),
  tipo_equipo: z.string().max(100, { error: "El tipo de equipo no puede exceder 100 caracteres" }).optional().or(z.literal("")),
});

export type EquipoInput = z.infer<typeof equipoSchema>;
```

### Complete Zod Schema for Folios

```typescript
// File: src/lib/validations/folios.ts
import { z } from "zod";

export const folioSchema = z.object({
  sucursal_id: z.string({ error: "La sucursal es requerida" })
    .uuid({ error: "ID de sucursal invalido" }),
  cliente_id: z.string({ error: "El cliente es requerido" })
    .uuid({ error: "ID de cliente invalido" }),
  descripcion_problema: z.string({ error: "La descripcion del problema es requerida" })
    .min(1, { error: "La descripcion del problema es requerida" })
    .max(2000, { error: "La descripcion no puede exceder 2000 caracteres" }),
});

export type FolioInput = z.infer<typeof folioSchema>;
```

### Shared ActionState Type

```typescript
// File: src/types/actions.ts (or add to src/types/index.ts)

export interface ActionState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
  message?: string;
}
```

### Select Component (New UI Component)

The existing UI library has Button, Input, and Label but is missing a Select component. A simple one is needed for branch/client dropdowns on forms:

```typescript
// File: src/components/ui/select.tsx
"use client";

import { type SelectHTMLAttributes, forwardRef, useId } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, className = "", id, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = error ? `${selectId}-error` : undefined;

    return (
      <div>
        <select
          ref={ref}
          id={selectId}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={[
            "block w-full rounded-lg border px-3 py-2.5 text-base",
            "min-h-[48px]",
            "transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-offset-1",
            error
              ? "border-red-500 focus:ring-red-400"
              : "border-gray-300 focus:ring-brand-400 focus:border-brand-500",
            className,
          ].filter(Boolean).join(" ")}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
export { Select };
```

### Textarea Component (New UI Component)

Needed for `descripcion_problema` on folios:

```typescript
// File: src/components/ui/textarea.tsx
"use client";

import { type TextareaHTMLAttributes, forwardRef, useId } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const errorId = error ? `${textareaId}-error` : undefined;

    return (
      <div>
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={[
            "block w-full rounded-lg border px-3 py-2.5 text-base",
            "min-h-[120px] resize-y",
            "placeholder:text-gray-400",
            "transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-offset-1",
            error
              ? "border-red-500 focus:ring-red-400"
              : "border-gray-300 focus:ring-brand-400 focus:border-brand-500",
            className,
          ].filter(Boolean).join(" ")}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
export { Textarea };
```

### Foreign Key Constraint Error Handling

```typescript
// Pattern for catching FK constraint violations on delete
export async function deleteSucursal(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  // ... auth check ...
  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("sucursales")
    .delete()
    .eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return {
        error: "No se puede eliminar esta sucursal porque tiene folios o equipos asociados. Elimine primero los registros relacionados.",
      };
    }
    return { error: "Error al eliminar: " + error.message };
  }

  revalidatePath("/admin/sucursales");
  return { success: true, message: "Sucursal eliminada exitosamente" };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useFormState` (react-dom) | `useActionState` (react) | React 19 (2024) | Import from `"react"` not `"react-dom"` |
| Zod 3 `.flatten()` | Zod 4 `z.flattenError()` | Zod 4 (2025) | Top-level function, not method on error |
| Zod 3 `{ message: "..." }` | Zod 4 `{ error: "..." }` | Zod 4 (2025) | Unified error parameter name |
| API routes for mutations | Server Actions | Next.js 14+ (2023) | No separate API layer needed |
| `middleware.ts` | `proxy.ts` | Next.js 16 (2025) | New naming convention for proxy middleware |
| Manual form state management | `useActionState` pending state | React 19 (2024) | Built-in pending boolean, no extra state |

**Deprecated/outdated:**
- `useFormState` from `react-dom`: Replaced by `useActionState` from `react`
- Zod 3 `.flatten()` method: Use `z.flattenError()` in Zod 4
- API routes for simple CRUD: Use Server Actions instead
- `getSession()` for auth checks: Use `getUser()` which validates with Supabase Auth server

## Open Questions

1. **Logo deletion on client edit**
   - What we know: When admin replaces a client logo, the old file should be deleted from Supabase Storage to avoid orphaned files.
   - What's unclear: Whether to delete immediately on replace, or run a periodic cleanup.
   - Recommendation: Delete old logo in the update action before uploading the new one. Use `admin.storage.from("clientes").remove([oldFilePath])`.

2. **Equipment page entry point**
   - What we know: Equipment is always scoped to a branch. Admin needs to manage equipment per branch.
   - What's unclear: Whether to have `/admin/equipos` as a global list or only access via branch detail.
   - Recommendation: Both -- `/admin/equipos` shows all equipment grouped by branch, each branch row in `/admin/sucursales` has a "Ver equipos" link to `/admin/equipos?sucursal=ID` or a branch-scoped route.

3. **Folio status management**
   - What we know: Folios have statuses (abierto, en_progreso, completado, en_espera). Schema defaults to "abierto".
   - What's unclear: Whether admin can change folio status in Phase 2, or if status changes only happen via report submission (Phase 3).
   - Recommendation: Allow admin to view but not change status in Phase 2. Status transitions should come from technician reporting in Phase 3.

## Sources

### Primary (HIGH confidence)
- Next.js 16.1.6 official docs: [Forms guide](https://nextjs.org/docs/app/guides/forms), [Updating Data](https://nextjs.org/docs/app/getting-started/updating-data), [serverActions config](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions)
- Zod 4 official docs: [Migration guide](https://zod.dev/v4/changelog), [Error formatting](https://zod.dev/error-formatting)
- Supabase Storage docs: [Buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals), [Access Control](https://supabase.com/docs/guides/storage/security/access-control), [Upload](https://supabase.com/docs/reference/javascript/storage-from-upload), [getPublicUrl](https://supabase.com/docs/reference/javascript/storage-from-getpublicurl)
- Existing codebase: `src/app/actions/auth.ts`, `src/app/admin/usuarios/`, `src/components/ui/` (established patterns)

### Secondary (MEDIUM confidence)
- [Supabase Storage creating buckets SQL](https://supabase.com/docs/guides/storage/buckets/creating-buckets) - bucket creation via SQL INSERT into storage.buckets
- [Next.js server action body size limit discussions](https://github.com/vercel/next.js/discussions/53989) - production reliability of bodySizeLimit config

### Tertiary (LOW confidence)
- None -- all findings verified with official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using exact same stack as Phase 1, only adding Zod 4 (which is already in node_modules)
- Architecture: HIGH - Patterns directly observed in existing codebase (auth.ts, usuarios pages) and verified against official Next.js 16 docs
- Pitfalls: HIGH - Body size limit, Zod 4 API changes, and redirect/revalidate issues are all well-documented in official sources
- Storage upload: HIGH - Supabase Storage API verified against official docs, admin client bypasses RLS for simplicity
- Zod 4 specifics: MEDIUM - API changes verified against zod.dev/v4/changelog, but some edge cases with Zod 4 + FormData coercion untested

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (stable stack, no anticipated breaking changes)
