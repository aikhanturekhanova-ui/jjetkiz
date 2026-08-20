import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CircleCheck, PackageSearch, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DriverNav } from "@/components/driver-nav";
import { EmptyState } from "@/components/empty-state";
import { useDelivery } from "@/lib/delivery/store";
import { DRIVER, matchScore, weatherRisk, hasReverseOffer } from "@/lib/delivery/driver";
import { fmtTenge, fmtKm, fmtMinutes } from "@/lib/delivery/format";
import { findSettlement } from "@/lib/delivery/settlements";
import { cn } from "@/lib/utils";

export function DriverJobPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orders, acceptOrder } = useDelivery();

  const order = useMemo(() => orders.find((o) => o.number === id?.toUpperCase()), [orders, id]);
  const score = useMemo(() => (order ? matchScore(order, orders) : null), [order, orders]);
  const risk = order ? weatherRisk(order) : null;

  if (!order || order.status !== "offered") {
    return (
      <div className="container-site max-w-3xl py-10 sm:py-16">
        <DriverNav />
        <div className="mt-8 rounded-2xl border bg-paper">
          <EmptyState
            icon={PackageSearch}
            title="Заявка недоступна"
            description="Её уже взял другой водитель, или номер не найден. Открой список актуальных заявок."
            actions={
              <Button asChild className="rounded-full">
                <Link to="/driver/jobs">К заявкам</Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const job = order;

  function handleAccept() {
    acceptOrder(job.number);
    toast("Предложение отправлено", {
      description: "Клиент подтвердил — заявка перешла тебе. Езжай за грузом.",
      icon: <CircleCheck className="size-5 text-caspi" />,
    });
    navigate("/driver/active-trip");
  }

  return (
    <div className="container-site max-w-3xl py-10 sm:py-16">
      <p className="text-xs font-bold tracking-[0.2em] text-caspi uppercase">Водителям</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {findSettlement(order.fromId)?.name} → {findSettlement(order.toId)?.name}
      </h1>
      <DriverNav />

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-5">
          <section aria-label="Груз" className="rounded-2xl border bg-paper p-6 shadow-sm">
            <p className="text-sm font-bold text-muted-foreground">Груз</p>
            <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Описание</dt>
                <dd className="mt-0.5 font-bold">{order.description ?? "Без описания"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Вес</dt>
                <dd className="tnum mt-0.5 font-bold">{order.weightKg} кг</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Объём</dt>
                <dd className="tnum mt-0.5 font-bold">{order.volumeM3 ? `${order.volumeM3} м³` : "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Машина</dt>
                <dd className="mt-0.5 font-bold">{order.vehicleName}</dd>
              </div>
            </dl>
          </section>

          <section aria-label="Маршрут и цена" className="rounded-2xl border bg-paper p-6 shadow-sm">
            <p className="text-sm font-bold text-muted-foreground">Маршрут и цена</p>
            <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Расстояние</dt>
                <dd className="tnum mt-0.5 font-bold">{fmtKm(order.km)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Время в пути</dt>
                <dd className="tnum mt-0.5 font-bold">~{fmtMinutes(order.minutes)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Ставка</dt>
                <dd className="tnum mt-0.5 font-extrabold text-caspi">{fmtTenge(order.price)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">За километр</dt>
                <dd className="tnum mt-0.5 font-bold">
                  {fmtTenge(Math.round(order.price / Math.max(1, order.km)))}/км
                </dd>
              </div>
            </dl>
          </section>

          {risk && risk.level !== "low" && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-extrabold text-amber-800">⚠ {risk.title}</p>
              {risk.note && <p className="mt-1 text-sm text-amber-700">{risk.note}</p>}
              {risk.delayMin && (
                <p className="mt-1 text-sm font-bold text-amber-800">+{risk.delayMin} мин к времени в пути</p>
              )}
            </div>
          )}
        </div>

        <aside className="h-fit space-y-4">
          <div className="rounded-2xl border bg-paper p-6 shadow-sm">
            <p className="text-sm font-bold text-muted-foreground">Совместимость с твоей машиной</p>
            <p className="tnum mt-2 text-3xl font-extrabold tracking-tight text-caspi">{score!.total}%</p>
            <ul className="mt-4 space-y-2.5">
              {score!.parts.map((p) => (
                <li key={p.label} className="flex items-start justify-between gap-3 text-sm">
                  <span className="leading-snug text-muted-foreground">{p.label}</span>
                  <span className={cn("tnum shrink-0 font-extrabold", p.ok ? "text-success" : "text-muted-foreground")}>
                    {p.ok ? "+" : ""}{p.points}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {hasReverseOffer(orders, order.fromId, order.toId) && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm">
              <p className="font-extrabold text-emerald-800">Обратный груз уже ждёт</p>
              <p className="mt-1 text-emerald-700">
                Не поедешь пустым: AI нашёл попутную заявку на обратную дорогу.
              </p>
              <Link to="/driver/backhaul" className="mt-2 inline-block font-bold text-emerald-800 underline underline-offset-4">
                Посмотреть обратный груз
              </Link>
            </div>
          )}

          <div className="rounded-2xl border bg-paper p-5 text-sm shadow-sm">
            <p className="text-muted-foreground">Твоя машина</p>
            <p className="mt-1 font-extrabold">{DRIVER.vehicle}</p>
            <p className="text-muted-foreground">{DRIVER.plate} · до {DRIVER.capacityKg} кг</p>
          </div>

          <Button className="h-12 w-full rounded-full text-base" onClick={handleAccept}>
            <Truck className="size-4" aria-hidden /> Принять и ехать
          </Button>
          <Link
            to="/driver/jobs"
            className="flex items-center justify-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden /> К списку заявок
          </Link>
        </aside>
      </div>
    </div>
  );
}