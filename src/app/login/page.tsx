"use client";

import { Suspense, useActionState, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Activity, Car, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { loginAction } from "./actions";

type Role = "mover" | "pilot";

const ACCOUNTS: Record<Role, { email: string }> = {
  mover: { email: "mover@pulsar.app" },
  pilot: { email: "pilot@pulsar.app" },
};

const URL_ERRORS: Record<string, string> = {
  MissingCSRF:
    "La sesión de seguridad expiró. Recarga la página e intenta de nuevo.",
  CredentialsSignin: "Credenciales inválidas",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get("role") === "pilot" ? "pilot" : "mover") as Role;

  const [role, setRole] = useState<Role>(initialRole);
  const [email, setEmail] = useState(ACCOUNTS[initialRole].email);
  const [password, setPassword] = useState("pulsar123");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(loginAction, null);

  useEffect(() => {
    setEmail(ACCOUNTS[role].email);
  }, [role]);

  useEffect(() => {
    const code = searchParams.get("error");
    if (!code) return;

    setUrlError(URL_ERRORS[code] ?? "No se pudo iniciar sesión");
    const roleParam = searchParams.get("role");
    const qs = roleParam ? `?role=${roleParam}` : "";
    router.replace(`/login${qs}`, { scroll: false });
  }, [searchParams, router]);

  const error = state?.error ?? urlError;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="glass w-full max-w-md rounded-2xl p-8">
        <Link href="/" className="mb-6 flex items-center gap-2 font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
            <Activity className="h-4 w-4" />
          </span>
          Pulsar
        </Link>
        <h1 className="text-xl font-semibold">Entra al pulso</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Elige cómo quieres usar Pulsar
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRole("mover")}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition",
              role === "mover"
                ? "border-violet-500/60 bg-violet-500/15 text-white"
                : "border-white/10 text-zinc-400 hover:border-white/20"
            )}
          >
            <User className="h-6 w-6" />
            Pasajero
          </button>
          <button
            type="button"
            onClick={() => setRole("pilot")}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition",
              role === "pilot"
                ? "border-cyan-500/60 bg-cyan-500/15 text-white"
                : "border-white/10 text-zinc-400 hover:border-white/20"
            )}
          >
            <Car className="h-6 w-6" />
            Conductor
          </button>
        </div>

        <p className="mt-3 rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-center text-xs text-zinc-400">
          <span className="text-zinc-300">Cuenta demo:</span>{" "}
          {ACCOUNTS[role].email} · contraseña{" "}
          <span className="font-mono text-zinc-300">pulsar123</span>
        </p>
        <p className="mt-2 text-center text-[11px] text-zinc-600">
          Pasajero y conductor usan cuentas distintas. Elige el rol antes de
          entrar.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <input type="hidden" name="role" value={role} />
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-violet-500/50"
            placeholder="Email"
            required
          />
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-violet-500/50"
            placeholder="Contraseña"
            required
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium disabled:opacity-50",
              role === "pilot"
                ? "bg-gradient-to-r from-cyan-600 to-violet-600 text-white"
                : "bg-gradient-to-r from-violet-600 to-cyan-600 text-white"
            )}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {role === "pilot" ? "Iniciar como conductor" : "Iniciar como pasajero"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-zinc-500">
          Cargando…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
