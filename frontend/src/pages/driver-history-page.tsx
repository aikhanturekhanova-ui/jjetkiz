import { CircleCheck, History } from "lucide-react";
import { DriverNav } from "@/components/driver-nav";
import { EmptyState } from "@/components/empty-state";
import { useDelivery } from "@/lib/delivery/store";
import { driverStats } from "@/lib/delivery/driver";
import { fmtTenge, fmtKm } from "@/lib/delivery/format";
import { findSettlement } from "@/lib/delivery/settlements";

export function DriverHistoryPage() {
  const { orders } = useDelivery();
  const stats = driverStats(orders);
  const delivered = orders
    .filter((o) => o.mine && o.status === "delivered")
    .sort((a, b) => (b.deliveredAt ?? 0) - (a.deliveredAt ?? 0));

  return (
    <div className="container-site max-w-3xl py-10 sm:py-16">
      <p className="text-xs font-bold tracking-[0.2em] text-caspi uppercase">Водителям</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">История рейсов</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {stats.trips} доставок · {fmtTenge(stats.totalSum)} заработано за всё время.
      </p>
      <DriverNav />

      {delivered.length > 0 ? (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:max-w-md">
            <div className="rounded-2xl border bg-paper p-5 shadow-sm">
              <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Всего рейсов</p>
              <p className="tnum mt-2 text-2xl font-extrabold tracking-tight">{stats.trips}</p>
            </div>
            <div className="rounded-2xl border bg-paper p-5 shadow-sm">
              <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Заработано</p>
              <p className="tnum mt-2 text-2xl font-extrabold tracking-tight">{fmtTenge(stats.totalSum)}</p>
            </div>
          </div>

          <ul className="mt-6 space-y-4">
            {delivered.map((o) => (
              <li key={o.number} className="rounded-2xl border bg-paper p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-extrabold tracking-tight">
                      {o.number} · {findSettlement(o.fromId)?.name} → {findSettlement(o.toId)?.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {o.weightKg} кг · {fmtKm(o.km)} ·{" "}
                      {o.deliveredAt
                        ? new Date(o.deliveredAt).toLocaleString("ru-RU", {
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="tnum text-lg font-extrabold tracking-tight">{fmtTenge(o.price)}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-success">
                      <CircleCheck className="size-3.5" aria-hidden /> доставлено
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mt-8 rounded-2xl border bg-paper">
          <EmptyState
            icon={History}
            title="Доставок пока нет"
            description="Завершённые рейсы появятся здесь с суммой на балансе — история копится автоматически."
          />
        </div>
      )}
    </div>
  );
}