"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const CRITERIA = [
  { key: "punctuality", label: "Puntualidad" },
  { key: "smoothness", label: "Suavidad" },
  { key: "safety", label: "Seguridad" },
  { key: "cleanliness", label: "Limpieza" },
  { key: "ambiance", label: "Ambiente" },
  { key: "conversation", label: "Conversacion" },
] as const;

type Scores = Record<(typeof CRITERIA)[number]["key"], number>;

type Props = {
  movementId: string;
  onRated: () => void;
};

export function TripRatingForm({ movementId, onRated }: Props) {
  const [scores, setScores] = useState<Scores>({
    punctuality: 5,
    smoothness: 5,
    safety: 5,
    cleanliness: 5,
    ambiance: 5,
    conversation: 5,
  });
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setScore(key: keyof Scores, value: number) {
    setScores((s) => ({ ...s, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/movement/${movementId}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...scores, comment: comment.trim() || undefined }),
    });
    setSaving(false);
    if (res.ok) onRated();
    else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo enviar la calificacion");
    }
  }

  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="mt-3 space-y-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3"
    >
      <p className="text-xs font-medium text-violet-300">Califica al conductor</p>
      {CRITERIA.map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between gap-2">
          <span className="text-xs text-zinc-400">{label}</span>
          <StarRow
            value={scores[key]}
            onChange={(v) => setScore(key, v)}
          />
        </div>
      ))}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comentario opcional"
        rows={2}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white placeholder:text-zinc-600"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-violet-600 py-2 text-xs font-medium text-white disabled:opacity-40"
      >
        {saving ? "Enviando…" : "Enviar calificacion"}
      </button>
    </form>
  );
}

function StarRow({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="p-0.5"
          aria-label={`${n} estrellas`}
        >
          <Star
            className={cn(
              "h-4 w-4",
              n <= value
                ? "fill-amber-400 text-amber-400"
                : "text-zinc-600"
            )}
          />
        </button>
      ))}
    </div>
  );
}
