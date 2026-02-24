"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ── Login ───────────────────────────────────────────────────────

export interface AuthState {
  error?: string;
  success?: boolean;
  message?: string;
}

export async function login(
  _prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Correo y contrasena son requeridos" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Correo o contrasena incorrectos" };
  }

  const role = data.user.app_metadata?.rol as string | undefined;

  // redirect() throws internally -- must be called outside try/catch
  if (role === "admin") {
    redirect("/admin");
  }

  redirect("/tecnico");
}

// ── Logout ──────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ── Create Technician Account (admin only) ──────────────────────

export async function createTechnicianAccount(
  _prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const nombre = formData.get("nombre") as string;
  const rol = formData.get("rol") as string;

  if (!email || !password || !nombre || !rol) {
    return { error: "Todos los campos son requeridos" };
  }

  if (rol !== "tecnico" && rol !== "ayudante") {
    return { error: "Rol debe ser tecnico o ayudante" };
  }

  // Verify the caller is an admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  // Use admin client (service role) to create user
  const adminClient = createAdminClient();

  const { data: newUser, error: createError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email confirmation
      app_metadata: { rol },
      user_metadata: { nombre },
    });

  if (createError) {
    return { error: createError.message };
  }

  // Insert into public.users table
  const { error: insertError } = await adminClient.from("users").insert({
    id: newUser.user.id,
    email,
    nombre,
    rol,
  });

  if (insertError) {
    return { error: `Usuario creado pero error al guardar perfil: ${insertError.message}` };
  }

  return { success: true, message: "Cuenta creada exitosamente" };
}
