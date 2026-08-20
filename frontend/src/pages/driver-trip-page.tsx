import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CircleCheck, Navigation, Pause, Play, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DriverNav } from "@/components/driver-nav";
import { EmptyState } from "@/components/empty-state";
import { StatusStepper } from "@/components/status-stepper";
import { RegionMap } from "@/components/region-map";
import { useDelivery } from "@/lib/delivery/store";
import { driverLocation, weatherRisk } from "@/lib/delivery/driver";
import { fmtTenge, fmtKm, fmtMinutes, fmtClock } from "@/lib/delivery/format";
import { findSettlement } from "@/lib/delivery/settlements";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

export function DriverTripPage() {
  const { orders, startOrder, deliverTrip } = useDelivery();
  const [, setTick] = useState(0);
  const reduced = usePrefersReducedMotion();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 20_000);
    return () => window.clearInterval(t);
  }, []);

  const locationId = driverLocation(orders);
  const active = orders.find(
    (o) => o.mine && (o.status === "accepted" || o.status === "in_progress")
  );

  if (!active) {
    return (
      <div className="container-site max-w-3xl py-10 sm:py-16">
        <p className="text-xs font-bold tracking-[0.2em] text-caspi uppercase">Водителям</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Активный рейс</h1>
        <DriverNav />
        <div className="mt-8 rounded-2xl border bg-paper">
          <EmptyState
            icon={Navigation}
            title="Сейчас ты свободен"
            description={`Ты в ${findSettlement(locationId)?.name ?? "Актау"}. Возьми заявку — и она сразу станет активным рейсом.`}
            actions={
              <Button asChild className="rounded-full">
                <Link to="/driver/jobs">Смотреть заявки</Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const risk = weatherRisk(active);
  const started = active.events.in_progress;
  const progress = started
    ? Math.min(1, (Date.now() - started) / (active.minutes * 60_000))
    : 0;
  const eta = started ? started + active.minutes * 60_000 : undefined;

  const handleStart = () => {
    startOrder(active.number);
    toast("Рейс начат", {
      description: "Отправитель и получатель видят, что ты в пути.",
      icon: <CircleCheck className="size-5 text-caspi" />,
    });
  };

  const handleDeliver = () => {
    deliverTrip(active.number);
    toast("Груз доставлен", {
      description: "Деньги на балансе. AI уже ищет обратный груз, чтобы ты не ехал пустым.",
      icon: <CircleCheck className="size-5 text-success" />,
    });
  };

  return (
    <div className="container-site max-w-3xl py-10 sm:py-16">
      <p className="text-xs font-bold tracking-[0.2em] text-caspi uppercase">Водителям</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Активный рейс</h1>
      <DriverNav />

      <section className="mt-8 rounded-2xl border bg-ink p-6 text-sand shadow-xl shadow-ink/10 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-[0.18em] text-sand/60 uppercase">
              {paused ? "На паузе" : started ? "Груз в пути" : "Едем за грузом"}
            </p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {findSettlement(active.fromId)?.name} → {findSettlement(active.toId)?.name}
            </p>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-sand/70">
              <span className="tnum font-bold">{fmtTenge(active.price)}</span>
              <span className="tnum">{fmtKm(active.km)}</span>
              <span className="tnum">~{fmtMinutes(active.minutes)}</span>
            </p>
          </div>
          {eta && started && (
            <div className="rounded-2xl bg-sand/10 px-5 py-3 text-right">
              <p className="text-[11px] font-bold tracking-wider text-sand/60 uppercase">Прибытие</p>
              <p className="tnum mt-1 text-2xl font-extrabold">{fmtClock(eta)}</p>
              <p className="tnum text-xs text-sand/60">
                через {fmtMinutes(Math.max(1, Math.round((eta - Date.now()) / 60_000)))}
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {risk.level === "low" ? (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
              Риск по погоде: низкий
            </span>
          ) : (
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">
              {risk.title}
              {risk.delayMin ? ` · +${risk.delayMin} мин` : ""}
            </span>
          )}
          {active.backhaul && (
            <span className="rounded-full bg-caspi/20 px-3 py-1 text-xs font-bold text-caspi">
              обратный груз уже найден
            </span>
          )}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl">
          <RegionMap
            from={findSettlement(active.fromId)}
            to={findSettlement(active.toId)}
            progress={reduced ? progress : progress}
            className="border-0"
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {!started ? (
            <Button className="h-12 rounded-full bg-caspi px-7 text-base text-white hover:bg-caspi/90" onClick={handleStart}>
              <Play className="size-4" aria-hidden /> Взять в работу
            </Button>
          ) : (
            <>
              <Button className="h-12 rounded-full bg-caspi px-7 text-base text-white hover:bg-caspi/90" onClick={handleDeliver}>
                <CircleCheck className="size-4" aria-hidden /> Груз доставлен
              </Button>
              <Button
                variant="secondary"
                className="h-12 rounded-full bg-sand/10 px-7 text-base text-sand hover:bg-sand/20"
                onClick={() => {
                  setPaused((p) => !p);
                  toast(paused ? "Едем дальше" : "Рейс на паузе", {
                    description: paused
                      ? "Снова в пути — статус обновился у отправителя."
                      : "Остановка видна отправителю. Таймер не идёт.",
                  });
                }}
              >
                {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
                {paused ? "Едем дальше" : "Пауза"}
              </Button>
            </>
          )}
        </div>
      </section>

      <div className="mt-6 rounded-2xl border bg-paper p-6 shadow-sm sm:p-8">
        <StatusStepper order={active} />
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-dashed bg-paper p-5 text-sm text-muted-foreground">
        <Truck className="mt-0.5 size-5 shrink-0 text-caspi" aria-hidden />
        <p>
          GPS-координаты пишутся локально каждую минуту. Нет сети в степи — данные копятся в очереди и
          уходят на сервер, когда интернет вернётся. Отправитель видит статус, а не теряет тебя из виду.
        </p>
      </div>
    </div>
  );
}