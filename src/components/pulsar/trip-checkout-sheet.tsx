"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Ambiance, TransportMode } from "@prisma/client";
import { CreditCard, Loader2, Wallet, X } from "lucide-react";
import { AmbiancePicker } from "@/components/pulsar/ambiance-picker";
import { estimateTripFare, formatFare } from "@/lib/trip-pricing";
import { carServiceLabel, type CarServiceTier } from "@/lib/car-services";
import { TRANSPORT_LABELS } from "@/lib/copy";
import { CardPaymentForm } from "@/components/pulsar/card-payment-form";
import { getDefaultPayment } from "@/lib/default-payment";
import {
  formatCardDisplay,
  getCardInfo,
  getWalletBalance,
  hasSavedCard,
} from "@/lib/payment-storage";
import { cn } from "@/lib/utils";

export type PaymentMethod = "CARD" | "CASH" | "WALLET";

const PAYMENT_OPTIONS: {
  id: PaymentMethod;
  label: string;
  desc: string;
  icon: ReactNode;
}[] = [
  {
    id: "CARD",
    label: "Tarjeta",
    desc: "Visa, Mastercard, debito",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    id: "CASH",
    label: "Efectivo",
    desc: "Pagas al conductor",
    icon: <span className="text-lg">💵</span>,
  },
  {
    id: "WALLET",
    label: "Billetera Pulsar",
    desc: "Saldo demo disponible",
    icon: <Wallet className="h-5 w-5" />,
  },
];

export type TripCheckoutTarget = {
  fromAddress: string;
  toAddress: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  title?: string;
};

type Props = {
  open: boolean;
  target: TripCheckoutTarget | null;
  transportMode: TransportMode;
  carService?: CarServiceTier | null;
  defaultAmbiance: Ambiance;
  submitting?: boolean;
  submitError?: string | null;
  onClose: () => void;
  onConfirm: (payload: {
    ambiance: Ambiance;
    paymentMethod: PaymentMethod;
    fare: number;
    distanceKm: number;
    durationMin: number;
  }) => void;
};

export function TripCheckoutSheet({
  open,
  target,
  transportMode,
  carService,
  defaultAmbiance,
  submitting,
  submitError,
  onClose,
  onConfirm,
}: Props) {
  const [step, setStep] = useState<"payment" | "ambiance">("payment");
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [durationMin, setDurationMin] = useState(0);
  const [fare, setFare] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CARD");
  const [ambiance, setAmbiance] = useState<Ambiance>(defaultAmbiance);
  const [cardSaved, setCardSaved] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep("payment");
      setQuoteError(null);
      return;
    }
    setAmbiance(defaultAmbiance);
    setPaymentMethod(getDefaultPayment());
    setCardSaved(hasSavedCard());
    setStep("payment");
  }, [open, defaultAmbiance]);

  useEffect(() => {
    if (!open || !target) return;

    let cancelled = false;
    setLoadingQuote(true);
    setQuoteError(null);

    const params = new URLSearchParams({
      fromLat: String(target.fromLat),
      fromLng: String(target.fromLng),
      toLat: String(target.toLat),
      toLng: String(target.toLng),
    });

    fetch(`/api/maps/directions?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((route) => {
        if (cancelled) return;
        if (!route) {
          setQuoteError("No pudimos calcular la ruta. Intenta de nuevo.");
          return;
        }
        const km = route.distanceKm ?? 0;
        const min = route.durationMin ?? 0;
        setDistanceKm(km);
        setDurationMin(min);
        setFare(
          estimateTripFare(
            km,
            min,
            transportMode,
            transportMode === "CAR" ? carService : null
          )
        );
      })
      .catch(() => {
        if (!cancelled) setQuoteError("Error al obtener el precio.");
      })
      .finally(() => {
        if (!cancelled) setLoadingQuote(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, target, transportMode, carService]);

  if (!open || !target) return null;

  function handlePaymentConfirm() {
    if (loadingQuote || quoteError || fare <= 0) return;
    if (paymentMethod === "WALLET" && getWalletBalance() < fare) {
      setQuoteError("Saldo insuficiente. Recarga en Ajustes → Metodo de pago.");
      return;
    }
    if (paymentMethod === "CARD" && !hasSavedCard()) {
      setQuoteError("Agrega una tarjeta para continuar.");
      return;
    }
    setQuoteError(null);
    setStep("ambiance");
  }

  function handleFinalConfirm() {
    onConfirm({
      ambiance,
      paymentMethod,
      fare,
      distanceKm,
      durationMin,
    });
  }

  const payLabel =
    PAYMENT_OPTIONS.find((p) => p.id === paymentMethod)?.label ?? paymentMethod;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="glass max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/10 p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="checkout-title" className="text-lg font-semibold text-white">
              {step === "payment" ? "Confirmar viaje" : "Ambiente del viaje"}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              {step === "payment"
                ? "Revisa precio y forma de pago"
                : "Ultimo paso antes de buscar conductor"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1 text-zinc-500 hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
          {target.title && (
            <p className="mb-2 font-medium text-violet-300">{target.title}</p>
          )}
          <p className="text-xs text-zinc-500">Origen</p>
          <p className="truncate text-zinc-200">{target.fromAddress}</p>
          <p className="mt-2 text-xs text-zinc-500">Destino</p>
          <p className="truncate text-zinc-200">{target.toAddress}</p>
          <p className="mt-2 text-xs text-cyan-400">
            {TRANSPORT_LABELS[transportMode] ?? transportMode}
            {transportMode === "CAR" && carService && (
              <> · {carServiceLabel(carService)}</>
            )}
          </p>
        </div>

        {step === "payment" ? (
          <>
            <div className="mb-4 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
              {loadingQuote ? (
                <p className="flex items-center gap-2 text-sm text-zinc-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculando precio…
                </p>
              ) : quoteError ? (
                <p className="text-sm text-red-400">{quoteError}</p>
              ) : (
                <>
                  <p className="text-xs text-zinc-500">Precio estimado</p>
                  <p className="text-3xl font-bold text-white">{formatFare(fare)}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    ~{durationMin} min · {distanceKm.toFixed(1)} km
                  </p>
                </>
              )}
            </div>

            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
              Metodo de pago
            </p>
            <div className="mb-5 space-y-2" role="radiogroup" aria-label="Metodo de pago">
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={paymentMethod === opt.id}
                  onClick={() => setPaymentMethod(opt.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
                    paymentMethod === opt.id
                      ? "border-violet-500/50 bg-violet-500/15"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  )}
                >
                  <span className="text-violet-300">{opt.icon}</span>
                  <span>
                    <span className="block text-sm font-medium text-zinc-200">
                      {opt.label}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {opt.id === "WALLET"
                        ? `Saldo: ${formatFare(getWalletBalance())}`
                        : opt.id === "CARD" && getCardInfo()
                          ? formatCardDisplay(getCardInfo()!)
                          : opt.desc}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            {paymentMethod === "WALLET" && getWalletBalance() < fare && fare > 0 && (
              <p className="mb-3 text-xs text-amber-400">
                Saldo insuficiente para este viaje.
              </p>
            )}

            {paymentMethod === "CARD" && !cardSaved && (
              <div className="mb-4 rounded-xl border border-violet-500/30 bg-violet-500/5 p-3">
                <p className="mb-3 text-xs text-zinc-400">
                  Agrega tu tarjeta para pagar este viaje.
                </p>
                <CardPaymentForm
                  compact
                  onSaved={() => {
                    setCardSaved(true);
                    setQuoteError(null);
                  }}
                />
              </div>
            )}

            {paymentMethod === "CARD" && cardSaved && getCardInfo() && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs">
                <CreditCard className="h-4 w-4 text-violet-400" />
                <span className="text-zinc-300">
                  Cobraremos a {formatCardDisplay(getCardInfo()!)}
                </span>
              </div>
            )}

            <button
              type="button"
              disabled={
                loadingQuote ||
                !!quoteError ||
                fare <= 0 ||
                submitting ||
                (paymentMethod === "CARD" && !cardSaved)
              }
              onClick={handlePaymentConfirm}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              Continuar
            </button>
          </>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs">
              <span className="text-zinc-500">{payLabel}</span>
              <span className="font-medium text-white">{formatFare(fare)}</span>
            </div>

            {submitError && (
              <div className="mb-3 space-y-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2">
                <p className="text-xs text-red-300">{submitError}</p>
                {submitError.includes("activo") ||
                submitError.includes("movimiento") ? null : (
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch("/api/movement/cancel-active", {
                        method: "POST",
                      });
                      window.location.reload();
                    }}
                    className="text-xs font-medium text-violet-300 underline hover:text-violet-200"
                  >
                    Cancelar viajes pendientes y recargar
                  </button>
                )}
              </div>
            )}
            <p className="mb-2 text-xs text-zinc-500">
              Como quieres el viaje? El conductor vera esta preferencia.
            </p>
            <AmbiancePicker value={ambiance} onChange={setAmbiance} />

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setStep("payment")}
                disabled={submitting}
                className="flex-1 rounded-xl border border-white/15 py-3 text-sm text-zinc-300 hover:bg-white/5 disabled:opacity-40"
              >
                Atras
              </button>
              <button
                type="button"
                onClick={handleFinalConfirm}
                disabled={submitting}
                className="flex-[2] rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Buscando conductor…
                  </span>
                ) : (
                  "Confirmar y pedir viaje"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
