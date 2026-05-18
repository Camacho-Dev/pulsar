"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function loginAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "mover");

  if (!email || !password) {
    return { error: "Completa email y contraseña" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: role === "pilot" ? "/pilot" : "/lobby",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Credenciales inválidas" };
      }
      return { error: "No se pudo iniciar sesión. Recarga la página e intenta de nuevo." };
    }
    throw error;
  }

  return null;
}
