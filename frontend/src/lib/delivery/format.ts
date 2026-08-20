const nf = new Intl.NumberFormat("ru-RU");

export function fmtTenge(n: number): string {
  return `${nf.format(Math.round(n))} ₸`;
}

export function fmtTengeLong(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(2).replace(".", ",").replace(/0+$/, "").replace(/,$/, "")} млн ₸`;
  }
  if (n >= 1000) {
    return `${Math.round(n / 1000)} тыс. ₸`;
  }
  return fmtTenge(n);
}

export function fmtKm(n: number): string {
  return `${nf.format(Math.round(n))} км`;
}

export function fmtMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}

export function fmtWeight(kg: number): string {
  if (kg >= 1000) {
    const t = kg / 1000;
    return `${t.toFixed(1).replace(".", ",").replace(",0", "")} т`;
  }
  return `${Math.round(kg)} кг`;
}

export function fmtClock(ts: number): string {
  return new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function fmtDay(ts: number): string {
  const now = new Date();
  const d = new Date(ts);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.floor((startOfDay - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86_400_000);
  if (diffDays === 0) return "сегодня";
  if (diffDays === 1) return "вчера";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}