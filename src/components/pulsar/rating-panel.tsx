"use client";

import { useState } from "react";

type Props = {
  movementId: string;
  onDone: () => void;
};

const DIMS = [
  { key: "punctuality", label: "Puntualidad" },
  { key: "smoothness", label: "Conducción" },
  { key: "safety", label: "Seguridad" },
  { key: "cleanliness", label: "Limpieza" },
  { key: "ambiance", label: "Ambiente" },
  { key: "conversation", label: "Conversación" },
] as const;

export function RatingPanel({ movementId, onDone }: Props) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const body: Record<string, number> = {};
    for (const d of DIMS) body[d.key] = scores[d.key] ?? 5;

    const res = await fetch(`/api/movement/${movementId}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) onDone();
  }

  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="font-medium">¿Cómo fue tu viaje?</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Tu opinión ayuda a mejorar la experiencia del conductor
      </p>
      <div className="mt-4 space-y-3">
        {DIMS.map((d) => (
          <label key={d.key} className="block text-sm">
            <span className="flex justify-between text-zinc-400">
              <span>{d.label}</span>
              <span className="text-violet-400">{scores[d.key] ?? 5}/5</span>
            </span>
            <input
              type="range"
              min={1}
              max={5}
              value={scores[d.key] ?? 5}
              onChange={(e) =>
                setScores((s) => ({ ...s, [d.key]: parseInt(e.target.value) }))
              }
              className="mt-1 w-full accent-violet-500"
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={submit}
        className="mt-4 w-full rounded-xl bg-violet-600 py-2 text-sm font-medium disabled:opacity-50"
      >
        Enviar
      </button>
    </div>
  );
}
