import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CircleCheck,
  MapPin,
  Package,
  PackageSearch,
  Phone,
  SearchX,
  Snowflake,
  Truck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { StatusStepper } from "@/components/status-stepper";
import { RegionMap } from "@/components/region-map";
import { useDelivery } from "@/lib/delivery/store";
import { findSettlement } from "@/lib/delivery/settlements";
import { fmtClock, fmtDay, fmtKm, fmtMinutes, fmtTenge, fmtWeight } from "@/lib/delivery/format";
import { useMode } from "@/lib/mode";
import { cn } from "@/lib/utils";

const STATUS_TEXT: Record<string, string> = {
  created: "Создана",
  matching: "Ищем водителя",
  offered: "Предложение отправлено",
  accepted: "Водитель назначен",
  in_progress: "В пути",
  delivered: "Доставлена",
  cancelled: "Отменена",
  expired: "Истекла",
};

const STATUS_EVENTS: Array<{ key: keyof import("@/lib/delivery/store").OrderItem["events"]; label: string }> = [
  { key: "created", label: "Заявка создана" },
  { key: "matching", label: "Начали поиск водителя" },
  { key: "offered", label: "Водителю отправлено предложение" },
  { key: "accepted", label: "Водитель назначен" },
  { key: "in_progress", label: "Груз в пути" },
  { key: "delivered", label: "Груз доставлен" },
];

function TrackSearch() {
  const navigate = useNavigate();
  const { orders } = useDelivery();
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const recent = orders.filter((o) => o.myOrder).slice(0, 3);

  const submit = () => {
    const v = value.trim().toUpperCase();
    if (!/^JKZ-\d{4}$/.test(v)) {
      setError(true);
      return;
    }
    setError(false);
    navigate(`/track/${v}`);
  };

  return (
    <div className="container-site max-w-2xl py-14 sm:py-24">
      <div className="flex flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-caspi">
          <PackageSearch className="size-7" aria-hidden />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight">Отследить заказ</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Введи номер заказа — он в подтверждении после создания заявки. Номер состоит из JKZ и
          четырёх цифр.
        </p>

        <form
          className="mt-7 flex w-full max-w-md flex-col gap-2.5 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            placeholder="JKZ-0839"
            className="h-12 flex-1 rounded-full px-5 text-center text-base font-bold uppercase tracking-widest sm:text-left"
            aria-label="Номер заказа"
            aria-invalid={error}
            inputMode="text"
            autoCapitalize="characters"
          />
          <Button type="submit" className="h-12 rounded-full px-6 text-base">
            Отследить
          </Button>
        </form>
        {error && (
          <p className="mt-3 text-sm font-semibold text-destructive" role="alert">
            Номер выглядит как JKZ и четыре цифры — например, JKZ-0839.
          </p>
        )}

        {recent.length > 0 && (
          <div className="mt-12 w-full text-left">
            <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
              Недавние заявки
            </p>
            <ul className="mt-3 divide-y divide-line border-b">
              {recent.map((o) => {
                const from = findSettlement(o.fromId);
                const to = findSettlement(o.toId);
                return (
                  <li key={o.number}>
                    <Link
                      to={`/track/${o.number}`}
                      className="flex items-center justify-between gap-3 py-3.5 transition-colors hover:bg-muted/60"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-extrabold">
                          {from?.name} <ArrowRight className="inline size-3.5 text-caspi" aria-hidden />{" "}
                          {to?.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {o.number} · {STATUS_TEXT[o.status]}
                        </span>
                      </span>
                      <span className="tnum shrink-0 text-sm font-extrabold">{fmtTenge(o.price)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function NotFound({ number }: { number: string }) {
  return (
    <div className="container-site max-w-2xl py-14 sm:py-24">
      <EmptyState
        icon={SearchX}
        title={`Заказ ${number} не найден`}
        description="Проверь номер — он указан в подтверждении после создания заявки. Если заявка создавалась не с этого устройства, найди номер в SMS или у отправителя."
        actions={
          <>
            <Button asChild className="h-12 rounded-full px-6 text-base">
              <Link to="/order/new">Создать заявку</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-full px-6 text-base">
              <Link to="/track">Отследить другой</Link>
            </Button>
          </>
        }
      />
    </div>
  );
}

export function TrackPage() {
  const { id } = useParams<{ id: string }>();
  const { orders } = useDelivery();
  const { lite } = useMode();

  const order = useMemo(() => {
    if (!id) return undefined;
    const normalized = id.trim().toUpperCase();
    return orders.find((o) => o.number === normalized);
  }, [id, orders]);

  const [, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 20_000);
    return () => window.clearInterval(t);
  }, []);

  if (!id) return <TrackSearch />;
  if (!order) return <NotFound number={id.trim().toUpperCase()} />;

  const from = findSettlement(order.fromId);
  const to = findSettlement(order.toId);

  const progress =
    order.status === "in_progress" && order.events.in_progress
      ? Math.min(1, (Date.now() - order.events.in_progress) / (order.minutes * 60_000))
      : order.status === "delivered"
        ? 1
        : undefined;

  const eta = order.events.in_progress
    ? order.events.in_progress + order.minutes * 60_000
    : undefined;

  const cancelled = order.status === "cancelled";

  return (
    <div className="container-site py-10 sm:py-14">
      <Link
        to="/track"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition-colors hover:text-caspi"
      >
        <ArrowLeft className="size-4" aria-hidden /> Все заказы
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Заказ {order.number}</h1>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-bold",
            order.status === "delivered"
              ? "bg-success/10 text-success"
              : cancelled
                ? "bg-destructive/10 text-destructive"
                : "bg-caspi/10 text-caspi"
          )}
        >
          {STATUS_TEXT[order.status]}
        </span>
        {!lite && !cancelled && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-live rounded-full bg-caspi" />
              <span className="relative inline-flex size-2 rounded-full bg-caspi" />
            </span>
            Обновляется в реальном времени
          </span>
        )}
      </div>

      {cancelled ? (
        <div className="mt-8 max-w-xl rounded-2xl border bg-paper p-6 sm:p-8">
          <p className="text-lg font-extrabold">Заявка отменена</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Отмена оформлена, платить ничего не нужно. Если отмена случилась после выезда водителя —
            вернём часть суммы в течение дня.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/order/new">Создать новую заявку</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              <section aria-label="Статус заказа" className="rounded-2xl border bg-paper p-6 sm:p-8">
                <StatusStepper order={order} />
              </section>

              {!lite && (
                <section aria-label="Маршрут на карте" className="overflow-hidden rounded-2xl border bg-paper">
                  <RegionMap
                    from={from}
                    to={to}
                    progress={progress}
                    className="rounded-none border-0"
                  />
                  {progress != null && (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-4">
                      <p className="text-sm font-bold">
                        {order.status === "delivered" ? "Доставлено" : "В пути"}
                        {progress != null && progress < 1 && ` · ${Math.round(progress * 100)}%`}
                      </p>
                      {eta && progress != null && progress < 1 && (
                        <p className="text-sm text-muted-foreground">
                          Прибытие ~{fmtClock(eta)} · через {fmtMinutes(Math.max(1, Math.round((eta - Date.now()) / 60_000)))}
                        </p>
                      )}
                    </div>
                  )}
                </section>
              )}

              <section aria-label="Хронология" className="rounded-2xl border bg-paper p-6 sm:p-8">
                <p className="text-sm font-bold text-muted-foreground">Хронология</p>
                <ul className="mt-4">
                  {STATUS_EVENTS.map((ev) => {
                    const ts = order.events[ev.key];
                    if (!ts) return null;
                    const isLast = ev.key === "delivered" || ev.key === "in_progress" || ev.key === "accepted" || ev.key === "offered";
                    return (
                      <li key={ev.key} data-testid="timeline-step" className="flex gap-3">
                        <span className="mt-1.5 flex flex-col items-center">
                          <span
                            className={cn(
                              "size-2.5 rounded-full",
                              isLast ? "bg-caspi" : "bg-line"
                            )}
                            aria-hidden
                          />
                          {ev.key !== "delivered" && <span className="mt-1 h-full w-px flex-1 bg-line" aria-hidden />}
                        </span>
                        <div className={cn("pb-5", ev.key === "delivered" && "pb-0")}>
                          <p className="text-sm font-bold">{ev.label}</p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {fmtDay(ts)}, {fmtClock(ts)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>

            <aside className="space-y-6">
              <section aria-label="Информация о грузе" className="rounded-2xl border bg-paper p-6">
                <p className="text-sm font-bold text-muted-foreground">Маршрут</p>
                <div className="mt-3 space-y-2.5">
                  <p className="flex items-start gap-2.5 text-sm font-bold">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-caspi" aria-hidden />
                    <span>
                      {from?.name}
                      {order.fromAddress && <span className="block text-xs font-medium text-muted-foreground">{order.fromAddress}</span>}
                    </span>
                  </p>
                  <p className="flex items-start gap-2.5 text-sm font-bold">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-caspi" aria-hidden />
                    <span>
                      {to?.name}
                      {order.toAddress && <span className="block text-xs font-medium text-muted-foreground">{order.toAddress}</span>}
                    </span>
                  </p>
                </div>

                <div className="mt-5 space-y-3 border-t pt-5">
                  <p className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Package className="size-4" aria-hidden /> Груз
                    </span>
                    <span className="font-bold">
                      {fmtWeight(order.weightKg)}
                      {order.volumeM3 ? ` · ${order.volumeM3.toFixed(1).replace(".", ",")} м³` : ""}
                    </span>
                  </p>
                  <p className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Truck className="size-4" aria-hidden /> Машина
                    </span>
                    <span className="font-bold">{order.vehicleName}</span>
                  </p>
                  <p className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="size-4" aria-hidden /> Дистанция
                    </span>
                    <span className="tnum font-bold">{fmtKm(order.km)} · ~{fmtMinutes(order.minutes)}</span>
                  </p>
                  <p className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Zap className="size-4" aria-hidden /> Цена
                    </span>
                    <span className="tnum text-base font-extrabold">{fmtTenge(order.price)}</span>
                  </p>
                </div>
              </section>

              {order.driverName && (
                <section aria-label="Водитель" className="rounded-2xl border bg-paper p-6">
                  <p className="text-sm font-bold text-muted-foreground">Водитель</p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-caspi text-base font-extrabold text-white">
                      {order.driverName[0]}
                    </span>
                    <div className="min-w-0">
                      <p className="font-extrabold">{order.driverName}</p>
                      {order.driverPlate && (
                        <p className="text-sm text-muted-foreground">{order.driverPlate}</p>
                      )}
                    </div>
                  </div>
                  {order.driverPhone && (
                    <a
                      href={`tel:${order.driverPhone.replace(/\s/g, "")}`}
                      className="mt-4 flex h-11 items-center justify-center gap-2 rounded-full border font-bold transition-colors hover:bg-muted"
                    >
                      <Phone className="size-4" aria-hidden /> {order.driverPhone}
                    </a>
                  )}
                  {order.perishable && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <Snowflake className="size-3.5 text-caspi" aria-hidden /> Температура в кузове
                      контролируется всю дорогу
                    </p>
                  )}
                </section>
              )}

              {!lite && (
                <section aria-label="Попутный груз" className="rounded-2xl border border-dashed bg-paper p-6">
                  {order.poputchik ? (
                    <p className="flex items-center gap-2.5 text-sm font-bold">
                      <CircleCheck className="size-4.5 shrink-0 text-success" aria-hidden />
                      Заявка едет попутным рейсом — скидка уже в цене.
                    </p>
                  ) : (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Слабое соединение? Включи лёгкий режим — статусы приходят без карты, как по SMS.
                    </p>
                  )}
                </section>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}