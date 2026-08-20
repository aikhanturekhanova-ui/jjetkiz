import { Link } from "react-router-dom";
import { PackageSearch, RefreshCw, Repeat, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DriverNav } from "@/components/driver-nav";
import { EmptyState } from "@/components/empty-state";
import { useDelivery } from "@/lib/delivery/store";
import { matchScore, weatherRisk, hasReverseOffer } from "@/lib/delivery/driver";
import { fmtTenge, fmtKm, fmtMinutes } from "@/lib/delivery/format";
import { findSettlement } from "@/lib/delivery/settlements";
import { cn } from "@/lib/utils";

export function DriverJobsPage() {
  const { orders, refreshOpen } = useDelivery();
  const open = orders.filter((o) => o.status === "offered");
  const scored = open
    .map((o) => ({ order: o, score: matchScore(o, orders) }))
    .sort((a, b) => b.score.total - a.score.total);

  return (
    <div className="container-site max-w-3xl py-10 sm:py-16">
      <p className="text-xs font-bold tracking-[0.2em] text-caspi uppercase">Водителям</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Заявки рядом</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        AI ранжирует по совместимости с твоей машиной, маршруту и обратному грузу.
      </p>
      <DriverNav />

      {scored.length > 0 ? (
        <ul className="mt-8 space-y-4">
          {scored.map(({ order, score }, i) => {
            const risk = weatherRisk(order);
            const backhaul = hasReverseOffer(orders, order.fromId, order.toId);
            return (
              <li
                key={order.number}
                className={cn(
                  "rounded-2xl border bg-paper p-5 shadow-sm sm:p-6",
                  i === 0 && "border-caspi/60 ring-2 ring-caspi/15"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {i === 0 && (
                        <span className="rounded-full bg-caspi px-2.5 py-0.5 text-[11px] font-extrabold tracking-wide text-white uppercase">
                          Best match
                        </span>
                      )}
                      {backhaul && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                          <Repeat className="size-3" aria-hidden /> обратный груз есть
                        </span>
                      )}
                      {order.priority === "high" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                          <Zap className="size-3" aria-hidden /> срочная
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-lg font-extrabold tracking-tight">
                      {findSettlement(order.fromId)?.name} → {findSettlement(order.toId)?.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {order.number} · {fmtKm(order.km)} · ~{fmtMinutes(order.minutes)} · {order.weightKg} кг ·{" "}
                      {order.vehicleName}
                    </p>
                    {order.description && <p className="mt-1 text-sm text-muted-foreground">{order.description}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">{risk.title}</p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="tnum text-xl font-extrabold tracking-tight">{fmtTenge(order.price)}</p>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-line">
                        <div
                          className={cn("h-full rounded-full", score.total >= 85 ? "bg-caspi" : score.total >= 70 ? "bg-ink" : "bg-muted-foreground")}
                          style={{ width: `${score.total}%` }}
                        />
                      </div>
                      <span className="tnum text-xs font-extrabold text-muted-foreground">{score.total}% матч</span>
                    </div>
                    <Button asChild size="sm" className="mt-1 rounded-full">
                      <Link to={`/driver/jobs/${order.number}`}>Открыть</Link>
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-8 rounded-2xl border bg-paper">
          <EmptyState
            icon={PackageSearch}
            title="Открытых заявок нет"
            description="Новые заявки появляются в течение дня. AI сразу посчитает матч под твою машину."
            actions={
              <Button className="rounded-full" onClick={refreshOpen}>
                <RefreshCw className="size-4" aria-hidden /> Проверить снова
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}