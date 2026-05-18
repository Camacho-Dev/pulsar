import Link from "next/link";
import { Activity, Car, Map, Sparkles, Users, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.15),_transparent_50%)]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
            <Activity className="h-4 w-4 text-white" />
          </span>
          Pulsar
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
        >
          Entrar
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-6 pb-20 pt-8 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-violet-400">
          Movilidad predictiva
        </p>
        <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          La ciudad ya sabe
          <br />
          <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            a dónde vas
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-zinc-400">
          No pidas transporte. Sincronízate con el pulso urbano: mapa vivo,
          rutinas anticipadas y viajes con el ambiente que elijas.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/login?role=mover"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 px-6 py-3 text-sm font-medium text-white hover:opacity-90"
          >
            <Zap className="h-4 w-4" />
            Soy pasajero
          </Link>
          <Link
            href="/login?role=pilot"
            className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-6 py-3 text-sm font-medium text-cyan-300 hover:bg-cyan-500/20"
          >
            <Car className="h-4 w-4" />
            Soy conductor
          </Link>
        </div>

        <div className="mt-20 grid gap-4 text-left sm:grid-cols-2">
          {[
            {
              icon: Sparkles,
              title: "Anticipación",
              desc: "Pulsar detecta tus rutinas y propone movimiento antes de que lo pidas.",
            },
            {
              icon: Map,
              title: "Mapa vivo",
              desc: "Zonas que respiran: tráfico, eventos, flujo y seguridad en capas.",
            },
            {
              icon: Users,
              title: "Experiencia social",
              desc: "Silencio, música suave o modo negocios — tú eliges cómo viajar.",
            },
            {
              icon: Activity,
              title: "Flujo urbano",
              desc: "Micro-rutas inteligentes. La ciudad se adapta a ti.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass rounded-2xl p-5">
              <Icon className="mb-3 h-5 w-5 text-violet-400" />
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-zinc-500">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
