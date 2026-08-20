import type { ReactNode } from "react";
import { ArrowRight, Clock, MapPin, Package, Snowflake, Zap } from "lucide-react";
import { findSettlement } from "@/lib/delivery/settlements";
import { fmtKm, fmtTenge, fmtWeight } from "@/lib/delivery/format";
import type { OrderItem } from "@/lib/delivery/store";
import { useMode } from "@/lib/mode";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function OrderCard({ order, actions }: { order: OrderItem; actions?: ReactNode }) {
  const { lite } = useMode();
  const from = findSettlement(order.fromId);
  const to = findSettlement(order.toId);

  const badges = (
    <>
      {order.priority === "high" && (
        <Badge variant="warning" className="gap-1">
          <Zap className="size-3" /> Срочно
        </Badge>
      )}
      {order.perishable && (
        <Badge variant="info" className="gap-1">
          <Snowflake className="size-3" /> Холод
        </Badge>
      )}
      {order.fragile && <Badge variant="purple">Хрупкое</Badge>}
      {order.poputchik && <Badge variant="success">Попутный груз · −27%</Badge>}
    </>
  );

  if (lite) {
    return (
      <li className="border-b py-5 last:border-b-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-base font-bold leading-snug">
            {from?.name ?? "—"} <ArrowRight className="inline size-4 text-caspi" /> {to?.name ?? "—"}
          </p>
          <p className="tnum text-lg font-extrabold">{fmtTenge(order.price)}</p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {fmtWeight(order.weightKg)}
          {order.volumeM3 ? ` · ${order.volumeM3.toFixed(1).replace(".", ",")} м³` : ""} ·{" "}
          {order.vehicleName} · {fmtKm(order.km)}
        </p>
        {order.description && <p className="mt-1 text-sm">{order.description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-2">{badges}</div>
        {actions && <div className="mt-4">{actions}</div>}
      </li>
    );
  }

  return (
    <li data-testid="order-card" className="rounded-2xl border bg-paper p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-muted-foreground">{order.number}</p>
          <p className="mt-1 text-lg font-extrabold tracking-tight sm:text-xl">
            {from?.name ?? "—"} <ArrowRight className="inline size-5 text-caspi" /> {to?.name ?? "—"}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" /> {fmtKm(order.km)} · ~{Math.round(order.minutes / 60)} ч
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Package className="size-3.5" /> {fmtWeight(order.weightKg)}
              {order.volumeM3 ? ` · ${order.volumeM3.toFixed(1).replace(".", ",")} м³` : ""}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" /> {order.vehicleName}
            </span>
          </div>
          {order.description && <p className="mt-2.5 text-sm text-muted-foreground">{order.description}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2">{badges}</div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <p className="tnum text-2xl font-extrabold tracking-tight">{fmtTenge(order.price)}</p>
          <p className="text-xs text-muted-foreground">оплата после доставки</p>
        </div>
      </div>
      {actions && <div className="mt-5 border-t pt-4">{actions}</div>}
    </li>
  );
}

export function OrderList({ orders, actions }: { orders: OrderItem[]; actions?: (o: OrderItem) => ReactNode }) {
  const { lite } = useMode();
  return (
    <ul className={cn(lite && "divide-y divide-line border-b")}>
      {orders.map((o) => (
        <OrderCard key={o.number} order={o} actions={actions ? actions(o) : undefined} />
      ))}
    </ul>
  );
}