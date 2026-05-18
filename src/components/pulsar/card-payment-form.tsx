"use client";

import { useEffect, useState } from "react";
import { CreditCard, Trash2 } from "lucide-react";
import {
  type CardInfo,
  clearCardInfo,
  detectCardBrand,
  digitsOnly,
  formatCardDisplay,
  formatCardExpiry,
  formatCardNumberInput,
  getCardInfo,
  setCardInfo,
  validateCardForm,
} from "@/lib/payment-storage";
import { cn } from "@/lib/utils";

type Props = {
  onSaved?: (card: CardInfo) => void;
  onRemoved?: () => void;
  compact?: boolean;
};

export function CardPaymentForm({ onSaved, onRemoved, compact }: Props) {
  const [saved, setSaved] = useState<CardInfo | null>(null);
  const [editing, setEditing] = useState(false);
  const [number, setNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const digits = digitsOnly(number);
  const brand = detectCardBrand(digits);
  useEffect(() => {
    const card = getCardInfo();
    setSaved(card);
    if (card && !editing) {
      setHolder(card.holder);
      setExpMonth(card.expMonth);
      setExpYear(card.expYear);
      setNumber(
        "•••• •••• •••• " + card.last4
      );
    }
  }, [editing]);

  function resetForm() {
    setNumber("");
    setHolder("");
    setExpMonth("");
    setExpYear("");
    setCvv("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateCardForm({
      number,
      holder,
      expMonth,
      expYear,
      cvv,
    });
    if (err) {
      setError(err);
      return;
    }
    const d = digitsOnly(number);
    const info: CardInfo = {
      last4: d.slice(-4),
      holder: holder.trim(),
      brand: detectCardBrand(d),
      expMonth: expMonth.padStart(2, "0"),
      expYear: expYear.length === 2 ? `20${expYear}` : expYear,
    };
    setCardInfo(info);
    setSaved(info);
    setEditing(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
    onSaved?.(info);
    resetForm();
    setNumber("•••• •••• •••• " + info.last4);
    setHolder(info.holder);
    setExpMonth(info.expMonth);
    setExpYear(info.expYear);
  }

  function removeCard() {
    if (!window.confirm("Eliminar esta tarjeta?")) return;
    clearCardInfo();
    setSaved(null);
    setEditing(true);
    resetForm();
    onRemoved?.();
  }

  if (saved && !editing) {
    return (
      <div className="space-y-3">
        <CardPreview
          brand={saved.brand}
          last4={saved.last4}
          holder={saved.holder}
          expiry={formatCardExpiry(saved)}
        />
        <div className="flex items-center justify-between rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2.5">
          <div>
            <p className="text-sm font-medium text-zinc-100">
              {formatCardDisplay(saved)}
            </p>
            <p className="text-xs text-zinc-500">
              Vence {formatCardExpiry(saved)} · {saved.holder}
            </p>
          </div>
          <CreditCard className="h-5 w-5 text-violet-400" />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              resetForm();
              setNumber("");
            }}
            className="flex-1 rounded-xl border border-white/10 py-2 text-xs text-zinc-300 hover:bg-white/5"
          >
            Cambiar tarjeta
          </button>
          <button
            type="button"
            onClick={removeCard}
            className="rounded-xl border border-red-500/30 px-3 py-2 text-red-400 hover:bg-red-500/10"
            aria-label="Eliminar tarjeta"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!compact && (
        <CardPreview
          brand={brand}
          last4={digits.slice(-4) || "····"}
          holder={holder || "TU NOMBRE"}
          expiry={
            expMonth && expYear
              ? `${expMonth.padStart(2, "0")}/${expYear.slice(-2)}`
              : "MM/AA"
          }
          live
        />
      )}

      <label className="block text-xs text-zinc-500">
        Numero de tarjeta
        <input
          type="text"
          inputMode="numeric"
          autoComplete="cc-number"
          value={number.startsWith("•") ? "" : formatCardNumberInput(digits)}
          onChange={(e) => {
            setNumber(formatCardNumberInput(digitsOnly(e.target.value)));
            setError(null);
          }}
          placeholder="1234 5678 9012 3456"
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm tracking-widest text-white placeholder:text-zinc-600"
        />
      </label>

      <label className="block text-xs text-zinc-500">
        Titular
        <input
          type="text"
          autoComplete="cc-name"
          value={holder}
          onChange={(e) => setHolder(e.target.value.toUpperCase())}
          placeholder="COMO EN LA TARJETA"
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
        />
      </label>

      <div className="grid grid-cols-3 gap-2">
        <label className="block text-xs text-zinc-500">
          Mes
          <select
            value={expMonth}
            onChange={(e) => setExpMonth(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white"
          >
            <option value="">MM</option>
            {Array.from({ length: 12 }, (_, i) => {
              const m = String(i + 1).padStart(2, "0");
              return (
                <option key={m} value={m}>
                  {m}
                </option>
              );
            })}
          </select>
        </label>
        <label className="block text-xs text-zinc-500">
          Ano
          <select
            value={expYear}
            onChange={(e) => setExpYear(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white"
          >
            <option value="">AAAA</option>
            {Array.from({ length: 12 }, (_, i) => {
              const y = String(new Date().getFullYear() + i);
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
        </label>
        <label className="block text-xs text-zinc-500">
          CVV
          <input
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            maxLength={4}
            value={cvv}
            onChange={(e) =>
              setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="123"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
          />
        </label>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {success && (
        <p className="text-xs text-emerald-400">Tarjeta guardada correctamente</p>
      )}

      <button
        type="submit"
        className={cn(
          "w-full rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white hover:bg-violet-500",
          compact && "py-2 text-xs"
        )}
      >
        Guardar tarjeta
      </button>

      <p className="text-center text-[10px] text-zinc-600">
        Demo: no se envia a un procesador real. Solo guardamos ultimos 4 digitos.
      </p>
    </form>
  );
}

function CardPreview({
  brand,
  last4,
  holder,
  expiry,
  live,
}: {
  brand: string;
  last4: string;
  holder: string;
  expiry: string;
  live?: boolean;
}) {
  const display =
    last4.length >= 4
      ? `•••• •••• •••• ${last4.slice(-4)}`
      : "•••• •••• •••• ••••";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 via-violet-900 to-zinc-900 p-5 shadow-lg",
        live && "ring-1 ring-violet-400/30"
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-cyan-500/10" />
      <p className="text-xs font-medium uppercase tracking-widest text-violet-200/80">
        {brand}
      </p>
      <p className="mt-6 font-mono text-lg tracking-[0.2em] text-white">
        {display}
      </p>
      <div className="mt-6 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase text-zinc-400">Titular</p>
          <p className="truncate text-sm font-medium text-zinc-100">{holder}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase text-zinc-400">Vence</p>
          <p className="text-sm font-medium text-zinc-100">{expiry}</p>
        </div>
      </div>
    </div>
  );
}
