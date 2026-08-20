import type { Settlement } from "./settlements";
import { roadKm } from "./settlements";

export type VehicleKind = "pickup" | "tent" | "fridge";
export type Priority = "normal" | "high";

export interface VehicleSpec {
  id: VehicleKind;
  name: string;
  hint: string;
  desc: string;
  maxKg: number;
  maxM3: number;
  ratePerKm: number;
  minPrice: number;
}

export const VEHICLES: Record<VehicleKind, VehicleSpec> = {
  pickup: {
    id: "pickup",
    name: "Пикап",
    hint: "до 1,5 т · 3 м³",
    desc: "Мелкие партии и срочные отправки",
    maxKg: 1500,
    maxM3: 3,
    ratePerKm: 190,
    minPrice: 8000,
  },
  tent: {
    id: "tent",
    name: "Фура-тент",
    hint: "до 20 т · 82 м³",
    desc: "Оптовые и межгородские перевозки",
    maxKg: 20000,
    maxM3: 82,
    ratePerKm: 340,
    minPrice: 45000,
  },
  fridge: {
    id: "fridge",
    name: "Рефрижератор",
    hint: "до 15 т · 70 м³",
    desc: "Рыба, мясо, продукты — с холодом",
    maxKg: 15000,
    maxM3: 70,
    ratePerKm: 520,
    minPrice: 60000,
  },
};

export const VEHICLE_LIST: VehicleSpec[] = [VEHICLES.pickup, VEHICLES.tent, VEHICLES.fridge];

export const POPUTCHIK_DISCOUNT = 0.27;
export const SOCIAL_DISCOUNT = 0.25;

export interface PriceInput {
  from: Settlement;
  to: Settlement;
  vehicle: VehicleKind;
  weightKg: number;
  perishable: boolean;
  fragile: boolean;
  priority: Priority;
  social: boolean;
  poputchik: boolean;
}

export interface PriceRow {
  label: string;
  amount: number;
}

export interface PriceBreakdown {
  km: number;
  base: number;
  extras: PriceRow[];
  subtotal: number;
  discounts: PriceRow[];
  total: number;
  savings: number;
}

const round100 = (n: number) => Math.round(n / 100) * 100;

export function calcPrice(input: PriceInput): PriceBreakdown {
  const spec = VEHICLES[input.vehicle];
  const km = roadKm(input.from, input.to);

  const base = Math.max(spec.minPrice, km * spec.ratePerKm);

  const extras: PriceRow[] = [];
  if (input.perishable) extras.push({ label: "Охлаждение / заморозка", amount: Math.round(base * 0.18) });
  if (input.fragile) extras.push({ label: "Хрупкий груз", amount: Math.round(base * 0.1) });
  if (input.priority === "high") extras.push({ label: "Срочная доставка", amount: Math.round(base * 0.22) });

  const subtotal = base + extras.reduce((s, e) => s + e.amount, 0);

  const discounts: PriceRow[] = [];
  if (input.social) discounts.push({ label: "Гуманитарный груз", amount: Math.round(base * SOCIAL_DISCOUNT) });
  if (input.poputchik) discounts.push({ label: "Попутный груз (AI)", amount: Math.round(subtotal * POPUTCHIK_DISCOUNT) });

  const discountSum = discounts.reduce((s, d) => s + d.amount, 0);
  const total = Math.max(2000, round100(subtotal - discountSum));
  const savings = discounts.filter((d) => d.label.includes("Попутный")).reduce((s, d) => s + d.amount, 0);

  return { km, base: round100(base), extras: extras.map((e) => ({ ...e, amount: round100(e.amount) })), subtotal: round100(subtotal), discounts: discounts.map((d) => ({ ...d, amount: round100(d.amount) })), total, savings: round100(savings) };
}