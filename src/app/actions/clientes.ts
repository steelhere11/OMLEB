"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clienteSchema } from "@/lib/validations/clientes";
import { z } from "zod";
import type { ActionState } from "@/types/actions";

// ── Create Client ──────────────────────────────────────────────

export async function createCliente(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  // 1. Verify admin role
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  // 2. Validate with Zod
  const rawData = {
    nombre: formData.get("nombre"),
  };

  const result = clienteSchema.safeParse(rawData);
  if (!result.success) {
    const flattened = z.flattenError(result.error);
    return { fieldErrors: flattened.fieldErrors };
  }

  // 3. Handle logo upload
  const admin = createAdminClient();
  let logoUrl: string | null = null;

  const logoFile = formData.get("logo") as File | null;
  if (logoFile && logoFile.size > 0) {
    if (logoFile.size > 2 * 1024 * 1024) {
      return { error: "El logo no puede exceder 2MB" };
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(logoFile.type)) {
      return { error: "El logo debe ser JPG, PNG o WebP" };
    }

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

    const { data: urlData } = admin.storage
      .from("clientes")
      .getPublicUrl(filePath);
    logoUrl = urlData.publicUrl;
  }

  // 4. Insert into database
  const { error: dbError } = await admin.from("clientes").insert({
    nombre: result.data.nombre,
    logo_url: logoUrl,
  });

  if (dbError) {
    return { error: "Error al crear el cliente: " + dbError.message };
  }

  // 5. Revalidate and redirect (outside try/catch)
  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}

// ── Update Client ──────────────────────────────────────────────

export async function updateCliente(
  id: string,
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  // 1. Verify admin role
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  // 2. Validate with Zod
  const rawData = {
    nombre: formData.get("nombre"),
  };

  const result = clienteSchema.safeParse(rawData);
  if (!result.success) {
    const flattened = z.flattenError(result.error);
    return { fieldErrors: flattened.fieldErrors };
  }

  const admin = createAdminClient();

  // 3. Handle logo upload (replace old if new one provided)
  let logoUrl: string | undefined;

  const logoFile = formData.get("logo") as File | null;
  if (logoFile && logoFile.size > 0) {
    if (logoFile.size > 2 * 1024 * 1024) {
      return { error: "El logo no puede exceder 2MB" };
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(logoFile.type)) {
      return { error: "El logo debe ser JPG, PNG o WebP" };
    }

    // Delete old logo if exists
    const { data: currentCliente } = await admin
      .from("clientes")
      .select("logo_url")
      .eq("id", id)
      .single();

    if (currentCliente?.logo_url) {
      // Extract file path from the public URL
      const urlParts = currentCliente.logo_url.split("/clientes/");
      if (urlParts.length > 1) {
        const oldPath = urlParts[urlParts.length - 1];
        await admin.storage.from("clientes").remove([oldPath]);
      }
    }

    // Upload new logo
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

    const { data: urlData } = admin.storage
      .from("clientes")
      .getPublicUrl(filePath);
    logoUrl = urlData.publicUrl;
  }

  // 4. Update database
  const updateData: Record<string, string> = {
    nombre: result.data.nombre,
  };
  if (logoUrl !== undefined) {
    updateData.logo_url = logoUrl;
  }

  const { error: dbError } = await admin
    .from("clientes")
    .update(updateData)
    .eq("id", id);

  if (dbError) {
    return { error: "Error al actualizar el cliente: " + dbError.message };
  }

  // 5. Revalidate and redirect
  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}
