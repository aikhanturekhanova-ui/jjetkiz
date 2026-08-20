import { MapPin, Phone, ShieldCheck, Star, Truck } from "lucide-react";
import { DriverNav } from "@/components/driver-nav";
import { useDelivery } from "@/lib/delivery/store";
import { DRIVER, driverStats } from "@/lib/delivery/driver";
import { fmtTenge, fmtKm } from "@/lib/delivery/format";
import { findSettlement } from "@/lib/delivery/settlements";

export function DriverProfilePage() {
  const { orders } = useDelivery();
  const stats = driverStats(orders);
  const lastTrip = orders
    .filter((o) => o.mine && o.status === "delivered")
    .sort((a, b) => (b.deliveredAt ?? 0) - (a.deliveredAt ?? 0))[0];

  return (
    <div className="container-site max-w-3xl py-10 sm:py-16">
      <p className="text-xs font-bold tracking-[0.2em] text-caspi uppercase">Водителям</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Профиль</h1>
      <DriverNav />

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_18rem]">
        <div className="rounded-2xl border bg-paper p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-ink text-2xl font-extrabold text-sand">
              {DRIVER.name.split(" ").map((w) => w[0]).join("")}
            </span>
            <div>
              <p className="text-xl font-extrabold tracking-tight">{DRIVER.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="size-4 text-amber-400" aria-hidden />
                {DRIVER.rating.toFixed(1)} · {stats.trips} рейсов
              </p>
            </div>
          </div>

          <dl className="mt-7 grid gap-4 text-sm sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Truck className="mt-0.5 size-4 shrink-0 text-caspi" aria-hidden />
              <div>
                <dt className="text-muted-foreground">Машина</dt>
                <dd className="mt-0.5 font-bold">{DRIVER.vehicle} · {DRIVER.plate}</dd>
                <dd className="text-muted-foreground">до {DRIVER.capacityKg} кг · {DRIVER.capacityKg / 250} м³</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-caspi" aria-hidden />
              <div>
                <dt className="text-muted-foreground">Телефон</dt>
                <dd className="mt-0.5 font-bold">{DRIVER.phone}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-caspi" aria-hidden />
              <div>
                <dt className="text-muted-foreground">Базовая точка</dt>
                <dd className="mt-0.5 font-bold">{findSettlement(DRIVER.homeId)?.name}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-caspi" aria-hidden />
              <div>
                <dt className="text-muted-foreground">Документы</dt>
                <dd className="mt-0.5 font-bold">Проверены · страховка груза активна</dd>
              </div>
            </div>
          </dl>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border bg-paper p-5 shadow-sm">
            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">За всё время</p>
            <p className="tnum mt-2 text-2xl font-extrabold tracking-tight">{fmtTenge(stats.totalSum)}</p>
            <p className="mt-1 text-xs text-muted-foreground">за {stats.trips} доставленных рейсов</p>
          </div>
          <div className="rounded-2xl border bg-paper p-5 shadow-sm">
            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Последний рейс</p>
            {lastTrip ? (
              <>
                <p className="mt-2 text-sm font-extrabold">
                  {lastTrip.number} · {findSettlement(lastTrip.fromId)?.name} → {findSettlement(lastTrip.toId)?.name}
                </p>
                <p className="tnum mt-1 text-sm text-muted-foreground">{fmtKm(lastTrip.km)} · {fmtTenge(lastTrip.price)}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Доставок ещё не было</p>
            )}
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm">
            <p className="font-extrabold text-emerald-800">Статус: на линии</p>
            <p className="mt-1 text-emerald-700">Заявки приходят сразу — уведомления включены.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}