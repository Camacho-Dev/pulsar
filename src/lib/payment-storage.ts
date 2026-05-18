import type { PaymentMethod } from "@/components/pulsar/trip-checkout-sheet";

const METHOD_KEY = "pulsar_default_payment";
const WALLET_KEY = "pulsar_wallet_balance";
const CARD_KEY = "pulsar_card_info";

export type CardInfo = {
  last4: string;
  holder: string;
  brand: string;
  expMonth: string;
  expYear: string;
};

const DEFAULT_WALLET = 2500;

export function getDefaultPayment(): PaymentMethod {
  if (typeof window === "undefined") return "CARD";
  const v = localStorage.getItem(METHOD_KEY);
  if (v === "CARD" || v === "CASH" || v === "WALLET") return v;
  return "CARD";
}

export function setDefaultPayment(method: PaymentMethod) {
  localStorage.setItem(METHOD_KEY, method);
}

export function getWalletBalance(): number {
  if (typeof window === "undefined") return DEFAULT_WALLET;
  const raw = localStorage.getItem(WALLET_KEY);
  if (raw == null) return DEFAULT_WALLET;
  const n = Number(raw);
  return Number.isFinite(n) ? n : DEFAULT_WALLET;
}

export function setWalletBalance(amount: number) {
  localStorage.setItem(WALLET_KEY, String(Math.max(0, Math.round(amount))));
}

export function addWalletFunds(amount: number) {
  setWalletBalance(getWalletBalance() + amount);
}

export function getCardInfo(): CardInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CARD_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CardInfo;
    if (parsed.last4 && parsed.holder && parsed.expMonth && parsed.expYear) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function setCardInfo(info: CardInfo) {
  localStorage.setItem(CARD_KEY, JSON.stringify(info));
}

export function clearCardInfo() {
  localStorage.removeItem(CARD_KEY);
}

export function hasSavedCard(): boolean {
  return getCardInfo() != null;
}

export function formatCardDisplay(card: CardInfo): string {
  return `${card.brand} ···· ${card.last4}`;
}

export function formatCardExpiry(card: CardInfo): string {
  return `${card.expMonth}/${card.expYear.slice(-2)}`;
}

export function deductWallet(amount: number): boolean {
  const bal = getWalletBalance();
  if (bal < amount) return false;
  setWalletBalance(bal - amount);
  return true;
}

/** Solo digitos del numero completo (demo: no se persiste el PAN) */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCardNumberInput(digits: string): string {
  const d = digits.slice(0, 16);
  return d.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function detectCardBrand(digits: string): string {
  if (digits.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  return "Tarjeta";
}

export function luhnCheck(digits: string): boolean {
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i]!, 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function validateCardForm(input: {
  number: string;
  holder: string;
  expMonth: string;
  expYear: string;
  cvv: string;
}): string | null {
  const digits = digitsOnly(input.number);
  if (digits.length < 15) return "Numero de tarjeta incompleto";
  if (!luhnCheck(digits)) return "Numero de tarjeta invalido";
  if (!input.holder.trim()) return "Ingresa el titular";
  if (!input.expMonth || !input.expYear) return "Ingresa la fecha de vencimiento";
  const month = parseInt(input.expMonth, 10);
  if (month < 1 || month > 12) return "Mes invalido";
  const year = parseInt(input.expYear, 10);
  const now = new Date();
  const endOfMonth = new Date(year, month, 0);
  if (endOfMonth < new Date(now.getFullYear(), now.getMonth(), 1)) {
    return "Tarjeta vencida";
  }
  if (input.cvv.length < 3) return "CVV invalido";
  return null;
}
