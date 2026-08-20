export function fmtNum(n: number | null | undefined): string {
  return n == null ? "—" : Number(n).toLocaleString("ru-RU");
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDateFull(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("ru-RU");
}