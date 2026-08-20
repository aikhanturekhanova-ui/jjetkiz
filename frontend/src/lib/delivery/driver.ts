import type { OrderItem } from "./store";
import { findSettlement } from "./settlements";

export interface DriverPersona {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  capacityKg: number;
  rating: number;
  homeId: string;
}

export const DRIVER: DriverPersona = {
  id: "driver-demo",
  name: "Ерлан Сагиев",
  phone: "+7 701 220 44 88",
  vehicle: "Газель-фургон",
  plate: "12 KZ 487 A",
  capacityKg: 1500,
  rating: 4.9,
  homeId: "aktau",
};

export interface ScoreBreakdown {
  total: number;
  parts: Array<{ label: string; points: number; ok: boolean }>;
}

export function driverLocation(orders: OrderItem[]): string {
  const moving = orders.find((o) => o.mine && o.status === "in_progress");
  if (moving) return moving.toId;
  const accepted = orders.find((o) => o.mine && o.status === "accepted");
  if (accepted) return accepted.toId;
  return DRIVER.homeId;
}

export function hasReverseOffer(orders: OrderItem[], fromId: string, toId: string): boolean {
  return orders.some((o) => o.status === "offered" && o.fromId === toId && o.toId === fromId);
}

export function matchScore(order: OrderItem, orders: OrderItem[]): ScoreBreakdown {
  const parts: ScoreBreakdown["parts"] = [];

  const weightFit = order.weightKg <= DRIVER.capacityKg;
  parts.push({
    label: "Груз помещается в машину",
    points: weightFit ? 34 : Math.max(8, Math.round((34 * DRIVER.capacityKg) / order.weightKg)),
    ok: weightFit,
  });

  const startsHere = order.fromId === driverLocation(orders);
  parts.push({
    label: startsHere ? "Загрузка в текущей точке" : "Подача к месту загрузки",
    points: startsHere ? 18 : 10,
    ok: startsHere,
  });

  const from = findSettlement(order.fromId);
  const to = findSettlement(order.toId);
  const closeRoute = from && to ? order.km <= 260 : false;
  parts.push({
    label: "Короткий маршрут по региону",
    points: closeRoute ? 14 : 8,
    ok: closeRoute,
  });

  const perKm = order.price / Math.max(1, order.km);
  const goodPrice = perKm >= 400;
  parts.push({
    label: "Ставка выше средней по маршруту",
    points: goodPrice ? 12 : 8,
    ok: goodPrice,
  });

  const backhaul = hasReverseOffer(orders, order.fromId, order.toId);
  parts.push({
    label: "Обратный груз уже есть — поедешь не пустым",
    points: backhaul ? 14 : 6,
    ok: backhaul,
  });

  const urgent = order.priority === "high";
  parts.push({
    label: "Срочная заявка — премия за скорость",
    points: urgent ? 6 : 4,
    ok: urgent,
  });

  const total = Math.min(98, Math.max(55, parts.reduce((s, p) => s + p.points, 0)));
  return { total, parts };
}

export type WeatherLevel = "low" | "medium" | "high";

export interface WeatherRisk {
  level: WeatherLevel;
  title: string;
  note?: string;
  delayMin?: number;
}

const RISKS: Array<WeatherRisk> = [
  { level: "low", title: "Погода не мешает — ветра почти нет" },
  { level: "medium", title: "Сильный ветер на маршруте", note: "Порывы 17–20 м/с. Снизь скорость на открытых участках.", delayMin: 45 },
  { level: "high", title: "Штормовое предупреждение", note: "Ветер до 25 м/с и пылевые бури. Желательна альтернативная дорога.", delayMin: 90 },
];

export function weatherRisk(order: OrderItem): WeatherRisk {
  const h = Array.from(order.number).reduce((s, ch) => s + ch.charCodeAt(0), 0);
  return RISKS[h % RISKS.length];
}

export function backhaulCandidates(orders: OrderItem[], locationId: string): OrderItem[] {
  return orders.filter((o) => o.status === "offered" && o.fromId === locationId);
}

export function driverStats(orders: OrderItem[]) {
  const mine = orders.filter((o) => o.mine);
  const delivered = mine.filter((o) => o.status === "delivered");
  const deliveredToday = delivered.filter(
    (o) => o.deliveredAt && new Date(o.deliveredAt).getDate() === new Date().getDate()
  );
  return {
    todaySum: deliveredToday.reduce((s, o) => s + o.price, 0),
    totalSum: delivered.reduce((s, o) => s + o.price, 0),
    trips: delivered.length,
    active: mine.filter((o) => o.status === "accepted" || o.status === "in_progress"),
  };
}