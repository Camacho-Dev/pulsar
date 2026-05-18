"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type Props = {
  initialName: string;
  saving?: boolean;
  onSave: (name: string) => Promise<void>;
};

export function AccountNameForm({ initialName, saving, onSave }: Props) {
  const [name, setName] = useState(initialName);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setMsg("El nombre no puede estar vacio");
      return;
    }
    setMsg(null);
    await onSave(trimmed);
    setMsg("Guardado");
    setTimeout(() => setMsg(null), 2000);
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-3">
      <label className="block text-xs text-zinc-500">
        Nombre visible
        <input
          type="text"
          value={name}
          disabled={saving}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
        />
      </label>
      <button
        type="submit"
        disabled={saving || name.trim() === initialName}
        className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white disabled:opacity-40"
      >
        {saving ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Guardando…
          </span>
        ) : (
          "Guardar nombre"
        )}
      </button>
      {msg && (
        <p
          className={`text-xs ${msg === "Guardado" ? "text-emerald-400" : "text-red-400"}`}
        >
          {msg}
        </p>
      )}
    </form>
  );
}
