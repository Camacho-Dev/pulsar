"use client";

import { useEffect, useState } from "react";
import { CreditCard, Plus, Wallet } from "lucide-react";
import type { PaymentMethod } from "@/components/pulsar/trip-checkout-sheet";
import { CardPaymentForm } from "@/components/pulsar/card-payment-form";
import { SettingsShell } from "@/components/pulsar/settings-shell";
import {
  addWalletFunds,
  formatCardDisplay,
  getCardInfo,
  getDefaultPayment,
  getWalletBalance,
  hasSavedCard,
  setDefaultPayment,
  setWalletBalance,
} from "@/lib/payment-storage";
import { formatFare } from "@/lib/trip-pricing";
import { cn } from "@/lib/utils";

const OPTIONS: {
  id: PaymentMethod;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "CARD",
    label: "Tarjeta",
    desc: "Debito o credito",
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
    desc: "Saldo demo",
    icon: <Wallet className="h-5 w-5" />,
  },
];

export default function PagoSettingsPage() {
  const [selected, setSelected] = useState<PaymentMethod>("CARD");
  const [wallet, setWallet] = useState(0);
  const [cardReady, setCardReady] = useState(false);

  useEffect(() => {
    setSelected(getDefaultPayment());
    setWallet(getWalletBalance());
    setCardReady(hasSavedCard());
  }, []);

  function select(id: PaymentMethod) {
    setSelected(id);
    setDefaultPayment(id);
  }

  const card = getCardInfo();

  return (
    <SettingsShell title="Metodo de pago">
      <p className="mb-4 text-xs text-zinc-500">
        Se preselecciona al pedir un viaje. Puedes cambiarlo en cada viaje.
      </p>

      <section className="glass mb-4 rounded-2xl p-4">
        <p className="text-sm font-medium text-zinc-200">Metodo predeterminado</p>
        <ul className="mt-3 space-y-2">
          {OPTIONS.map((opt) => {
            const cardDesc =
              opt.id === "CARD" && card
                ? formatCardDisplay(card)
                : opt.id === "CARD" && !cardReady
                  ? "Agrega una tarjeta abajo"
                  : opt.id === "WALLET"
                    ? `Saldo: ${formatFare(wallet)}`
                    : opt.desc;
            return (
              <li key={opt.id}>
                <button
                  type="button"
                  onClick={() => select(opt.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition",
                    selected === opt.id
                      ? "border-violet-500/50 bg-violet-500/15"
                      : "border-white/10 bg-white/5 hover:border-white/20",
                    opt.id === "CARD" && !cardReady && selected === "CARD" &&
                      "border-amber-500/40"
                  )}
                >
                  <span className="text-violet-300">{opt.icon}</span>
                  <span>
                    <span className="block text-sm font-medium text-zinc-100">
                      {opt.label}
                    </span>
                    <span className="text-xs text-zinc-500">{cardDesc}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {selected === "CARD" && !cardReady && (
          <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            Para pagar con tarjeta, completa el formulario de abajo.
          </p>
        )}
      </section>

      {(selected === "CARD" || cardReady) && (
        <section className="glass mb-4 rounded-2xl p-4">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
            <CreditCard className="h-4 w-4 text-violet-400" />
            Tarjeta de debito / credito
          </h2>
          <p className="mb-4 text-xs text-zinc-500">
            Numero, vencimiento y CVV. Solo guardamos los ultimos 4 digitos (demo).
          </p>
          <CardPaymentForm
            onSaved={() => setCardReady(true)}
            onRemoved={() => setCardReady(false)}
          />
        </section>
      )}

      <section className="glass rounded-2xl p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Wallet className="h-4 w-4 text-emerald-400" />
          Billetera Pulsar
        </h2>
        <p className="mt-2 text-2xl font-bold text-emerald-300">
          {formatFare(wallet)}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => {
              addWalletFunds(500);
              setWallet(getWalletBalance());
            }}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-600/80 py-2 text-xs font-medium text-white"
          >
            <Plus className="h-3 w-3" />
            + RD$500
          </button>
          <button
            type="button"
            onClick={() => {
              setWalletBalance(2500);
              setWallet(getWalletBalance());
            }}
            className="rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-400 hover:text-white"
          >
            Restablecer demo
          </button>
        </div>
        <p className="mt-2 text-[10px] text-zinc-600">
          Al pagar con billetera se descuenta el saldo al confirmar el viaje.
        </p>
      </section>
    </SettingsShell>
  );
}
