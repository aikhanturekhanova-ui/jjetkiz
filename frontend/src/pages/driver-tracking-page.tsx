import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DriverNav } from "@/components/driver-nav";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { useDelivery } from "@/lib/delivery/store";
import { driverLocation, weatherRisk } from "@/lib/delivery/driver";
import { fmtKm, fmtMinutes, fmtClock } from "@/lib/delivery/format";
import { findSettlement } from "@/lib/delivery/settlements";

export function DriverTrackingPage() {
  const { orders } = useDelivery();
  const [, setTick] = useState(0);
  const locationId = driverLocation(orders);

  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 20_000);
    return () => window.clearInterval(t);
  }, []);

  const active = orders.filter((o) => o.mine && (o.status === "accepted" || o.status === "in_progress"));

  return (
    <div className="container-site max-w-3xl py-10 sm:py-16">
      <p className="text-xs font-bold tracking-[0.2em] text-caspi uppercase">Водителям</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Трекинг рейсов</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Отправитель видит то же самое: твоё местоположение и статус в реальном времени.
      </p>
      <DriverNav />

      <div className="mt-8 flex items-center gap-2 rounded-2xl border bg-paper p-4 text-sm shadow-sm">
        <MapPin className="size-4 shrink-0 text-caspi" aria-hidden />
        <p>
          Сейчас ты: <span className="font-bold">{findSettlement(locationId)?.name ?? "Актау"}</span>. Трек
          передаётся каждую минуту; без сети — копится локально и синхронизируется при связи.
        </p>
      </div>

      {active.length > 0 ? (
        <ul className="mt-6 space-y-4">
          {active.map((o) => {
            const risk = weatherRisk(o);
            const started = o.events.in_progress;
            const progress = started ? Math.min(1, (Date.now() - started) / (o.minutes * 60_000)) : 0;
            const eta = started ? started + o.minutes * 60_000 : undefined;
            return (
              <li key={o.number} className="rounded-2xl border bg-paper p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-extrabold tracking-tight">
                      {o.number} · {findSettlement(o.fromId)?.name} → {findSettlement(o.toId)?.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {fmtKm(o.km)} · ~{fmtMinutes(o.minutes)}
                      {eta && <> · прибытие ~{fmtClock(eta)}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {risk.level !== "low" && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                        ветер
                      </span>
                    )}
                    <StatusBadge status={o.status} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-caspi transition-[width] duration-700"
                      style={{ width: `${Math.max(4, Math.round(progress * 100))}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-muted-foreground">
                    <span>Загрузка</span>
                    <span>{started ? `${Math.round(progress * 100)}% пути` : "ждёт начала"}</span>
                    <span>Выгрузка</span>
                  </div>
                </div>
                <Link to="/driver/active-trip" className="mt-4 inline-block text-sm font-bold text-caspi hover:underline">
                  Открыть рейс →
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-6 rounded-2xl border bg-paper">
          <EmptyState
            icon={MapPin}
            title="Активных рейсов нет"
            description="Когда возьмёшь заявку, её трек появится здесь и будет виден отправителю."
            actions={
              <Button asChild className="rounded-full">
                <Link to="/driver/jobs">Смотреть заявки</Link>
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}