"use client";

import type { Ambiance } from "@prisma/client";
import { AMBIANCE_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type AmbiancePickerProps = {
  value: Ambiance;
  onChange: (a: Ambiance) => void;
};

export function AmbiancePicker({ value, onChange }: AmbiancePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {AMBIANCE_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "rounded-xl border p-3 text-left transition",
            value === opt.id
              ? "border-violet-500/60 bg-violet-500/15 shadow-lg shadow-violet-500/10"
              : "border-white/10 bg-white/5 hover:border-white/20"
          )}
        >
          <span className="text-lg">{opt.icon}</span>
          <p className="mt-1 text-sm font-medium">{opt.label}</p>
          <p className="text-[10px] text-zinc-500">{opt.desc}</p>
        </button>
      ))}
    </div>
  );
}
