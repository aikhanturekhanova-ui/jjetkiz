export interface Settlement {
  id: string;
  name: string;
  lat: number;
  lng: number;
  kind: "city" | "town" | "village";
}

export const SETTLEMENTS: Settlement[] = [
  { id: "aktau", name: "Актау", lat: 43.6535, lng: 51.1451, kind: "city" },
  { id: "munayly", name: "Мунайлы", lat: 43.7031, lng: 51.1117, kind: "town" },
  { id: "akshukyr", name: "Акшукыр", lat: 43.7316, lng: 51.3092, kind: "village" },
  { id: "kuryk", name: "Курык", lat: 43.1933, lng: 51.6475, kind: "town" },
  { id: "kenderli", name: "Кендерли", lat: 43.0867, lng: 51.1156, kind: "village" },
  { id: "zhanauzen", name: "Жанаозен", lat: 43.3424, lng: 52.8576, kind: "city" },
  { id: "zhetybai", name: "Жетыбай", lat: 43.3969, lng: 52.1156, kind: "village" },
  { id: "shetpe", name: "Шетпе", lat: 44.1439, lng: 52.1219, kind: "village" },
  { id: "fort", name: "Форт-Шевченко", lat: 44.5108, lng: 50.2633, kind: "town" },
  { id: "bautino", name: "Баутино", lat: 44.545, lng: 50.2464, kind: "village" },
  { id: "beineu", name: "Бейнеу", lat: 45.3194, lng: 55.1941, kind: "town" },
  { id: "dostyk", name: "Достык", lat: 43.2511, lng: 55.1011, kind: "village" },
];

export function findSettlement(id: string): Settlement | undefined {
  return SETTLEMENTS.find((s) => s.id === id);
}

function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

export function haversineKm(a: Settlement, b: Settlement): number {
  const R = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function roadKm(a: Settlement, b: Settlement): number {
  return Math.max(8, Math.round(haversineKm(a, b) * 1.22));
}

export function roadMinutes(a: Settlement, b: Settlement): number {
  return Math.round((roadKm(a, b) / 62) * 60);
}