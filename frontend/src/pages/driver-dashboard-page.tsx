import { Link } from "react-router-dom";
import { CircleCheck, Navigation, PackageSearch, Repeat, Star, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DriverNav } from "@/components/driver-nav";
import { useDelivery } from "@/lib/delivery/store";
import { DRIVER, driverLocation, driverStats, matchScore, backhaulCandidates, weatherRisk } from "@/lib/delivery/driver";
import { fmtTenge, fmtKm, fmtMinutes } from "@/lib/delivery/format";
import { findSettlement } from "@/lib/delivery/settlements";

export function DriverDashboardPage() {
  const { orders } = useDelivery();
  const stats = driverStats(orders);
  const locationId = driverLocation(orders);
  const location = findSettlement(locationId);
  const open = orders.filter((o) => o.status === "offered");
  const scored = open
    .map((o) => ({ order: o, score: matchScore(o, orders) }))
    .sort((a, b) => b.score.total - a.score.total);
  const best = scored[0];
  const backhauls = backhaulCandidates(orders, locationId);
  const activeTrip = stats.active[0];
  const risk = activeTrip ? weatherRisk(activeTrip) : null;

  return (
    <div className="container-site max-w-4xl py-10 sm:py-16">
      <p className="text-xs font-bold tracking-[0.2em] text-caspi uppercase">Водителям</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Привет, {DRIVER.name.split(" ")[0]}!</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ты сейчас в {location?.name ?? "Актау"}. Работа на сегодня: {stats.active.length > 0 ? "рейс в пути" : "заявки ждут тебя"}.
      </p>
      <DriverNav />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-paper p-5 shadow-sm">
          <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Заработано сегодня</p>
          <p className="tnum mt-2 text-2xl font-extrabold tracking-tight">{fmtTenge(stats.todaySum)}</p>
          <p className="mt-1 text-xs text-muted-foreground">за {stats.trips} рейсов всего</p>
        </div>
        <div className="rounded-2xl border bg-paper p-5 shadow-sm">
          <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Открытых заявок</p>
          <p className="tnum mt-2 text-2xl font-extrabold tracking-tight">{open.length}</p>
          {best && (
            <Link to={`/driver/jobs/${best.order.number}`} className="mt-1 text-xs font-bold text-caspi hover:underline">
              Лучший матч {best.score.total}%
            </Link>
          )}
        </div>
        <div className="rounded-2xl border bg-paper p-5 shadow-sm">
          <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Обратных грузов</p>
          <p className="tnum mt-2 text-2xl font-extrabold tracking-tight">{backhauls.length}</p>
          <Link to="/driver/backhaul" className="mt-1 text-xs font-bold text-caspi hover:underline">
            {backhauls.length > 0 ? "Не поедешь пустым" : "AI ищет обратный груз"}
          </Link>
        </div>
        <div className="rounded-2xl border bg-paper p-5 shadow-sm">
          <p className="flex items-center gap-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
            <Star className="size-3.5 text-amber-400" aria-hidden /> Рейтинг
          </p>
          <p className="tnum mt-2 text-2xl font-extrabold tracking-tight">{DRIVER.rating.toFixed(1)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{DRIVER.vehicle} · {DRIVER.plate}</p>
        </div>
      </div>

      {activeTrip ? (
        <Link
          to="/driver/active-trip"
          className="mt-6 block rounded-2xl border border-caspi/40 bg-paper p-6 shadow-sm transition-colors hover:border-caspi sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-caspi uppercase">Активный рейс</p>
              <p className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">
                {findSettlement(activeTrip.fromId)?.name} → {findSettlement(activeTrip.toId)?.name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {fmtKm(activeTrip.km)} · ~{fmtMinutes(activeTrip.minutes)} · {fmtTenge(activeTrip.price)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {risk && (
                <span
                  className={
                    risk.level === "low"
                      ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
                      : "rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700"
                  }
                >
                  {risk.title}
                </span>
              )}
              <Button className="rounded-full">Открыть рейс →</Button>
            </div>
          </div>
        </Link>
      ) : (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-paper p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Truck className="size-6" aria-hidden />
            </span>
            <div>
              <p className="font-extrabold">Машина свободна</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Возьми заявку — {best ? `лучший матч ${best.order.number} (${best.score.total}%)` : "новые появляются в течение дня"}.
              </p>
            </div>
          </div>
          <Button asChild className="rounded-full">
            <Link to="/driver/jobs">
              <PackageSearch className="size-4" aria-hidden /> Смотреть заявки
            </Link>
          </Button>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-paper p-6 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-bold">
            <Repeat className="size-4 text-caspi" aria-hidden /> Обратный груз
          </p>
          {backhauls.length > 0 ? (
            <ul className="mt-3 divide-y divide-line">
              {backhauls.slice(0, 3).map((o) => (
                <li key={o.number} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {findSettlement(o.fromId)?.name} → {findSettlement(o.toId)?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fmtTenge(o.price)} · {o.weightKg} кг
                    </p>
                  </div>
                  <Link to="/driver/backhaul" className="shrink-0 text-sm font-bold text-caspi hover:underline">
                    Смотреть
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              AI ищет попутный груз на обратную дорогу — загляни после доставки.
            </p>
          )}
        </div>

        <div className="rounded-2xl border bg-paper p-6 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-bold">
            <CircleCheck className="size-4 text-caspi" aria-hidden /> Последние доставки
          </p>
          {stats.trips > 0 ? (
            <ul className="mt-3 divide-y divide-line">
              {orders
                .filter((o) => o.mine && o.status === "delivered")
                .slice(0, 3)
                .map((o) => (
                  <li key={o.number} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        {o.number} · {findSettlement(o.fromId)?.name} → {findSettlement(o.toId)?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {o.deliveredAt ? new Date(o.deliveredAt).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                      </p>
                    </div>
                    <p className="tnum shrink-0 text-sm font-extrabold">{fmtTenge(o.price)}</p>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              После первой доставки здесь появится история и заработок.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-dashed bg-paper p-4 text-sm text-muted-foreground">
        <Navigation className="size-4 shrink-0 text-caspi" aria-hidden />
        GPS-трек: без интернета координаты копятся на устройстве и уходят на сервер при связи — статус не теряется.
      </div>
    </div>
  );
}