import { Link } from "react-router-dom";
import { CircleCheck, Repeat } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DriverNav } from "@/components/driver-nav";
import { EmptyState } from "@/components/empty-state";
import { useDelivery } from "@/lib/delivery/store";
import { backhaulCandidates, driverLocation, matchScore, DRIVER } from "@/lib/delivery/driver";
import { fmtTenge, fmtKm, fmtMinutes } from "@/lib/delivery/format";
import { findSettlement } from "@/lib/delivery/settlements";

export function DriverBackhaulPage() {
  const { orders, acceptOrder } = useDelivery();
  const locationId = driverLocation(orders);
  const location = findSettlement(locationId);
  const candidates = backhaulCandidates(orders, locationId)
    .map((o) => ({ order: o, score: matchScore(o, orders).total }))
    .sort((a, b) => b.score - a.score);

  function handleAccept(number: string, price: number) {
    acceptOrder(number);
    toast("Обратный груз взят", {
      description: `${fmtTenge(price)} за обратную дорогу — рейс не будет пустым.`,
      icon: <CircleCheck className="size-5 text-caspi" />,
    });
  }

  return (
    <div className="container-site max-w-3xl py-10 sm:py-16">
      <p className="text-xs font-bold tracking-[0.2em] text-caspi uppercase">Водителям</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Обратный груз</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ты сейчас в {location?.name ?? "Актау"}. AI ищет попутный груз, чтобы ты возвращался с деньгами,
        а не порожняком.
      </p>
      <DriverNav />

      {candidates.length > 0 ? (
        <ul className="mt-8 space-y-4">
          {candidates.map(({ order, score }) => (
            <li key={order.number} className="rounded-2xl border bg-paper p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                      <Repeat className="size-3" aria-hidden /> {score}% матч
                    </span>
                    {order.priority === "high" && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                        срочная
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-lg font-extrabold tracking-tight">
                    {findSettlement(order.fromId)?.name} → {findSettlement(order.toId)?.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.number} · {order.weightKg} кг · {fmtKm(order.km)} · ~{fmtMinutes(order.minutes)} ·{" "}
                    {order.vehicleName}
                  </p>
                  {order.description && <p className="mt-1 text-sm text-muted-foreground">{order.description}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <p className="tnum text-xl font-extrabold tracking-tight">{fmtTenge(order.price)}</p>
                  <Button size="sm" className="rounded-full" onClick={() => handleAccept(order.number, order.price)}>
                    Взять обратный груз
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-2xl border bg-paper">
          <EmptyState
            icon={Repeat}
            title="AI пока не нашёл обратный груз"
            description="Обычно попутная заявка появляется после доставки или в течение часа. Проверь позже — и не забудь про свои открытые заявки."
            actions={
              <Button asChild className="rounded-full">
                <Link to="/driver/jobs">Смотреть заявки</Link>
              </Button>
            }
          />
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-dashed bg-paper p-5 text-sm leading-relaxed text-muted-foreground">
        Почему это важно: маршрут {DRIVER.homeId === locationId ? "Актау → Актау" : `${location?.name} → Актау`} без груза
        — это потерянные часы и топливо. Обратный груз покрывает дорогу и добавляет до 15% к доходу за рейс.
      </div>
    </div>
  );
}