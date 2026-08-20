import { Check } from "lucide-react";
import type { OrderItem } from "@/lib/delivery/store";
import { fmtClock } from "@/lib/delivery/format";
import { useMode } from "@/lib/mode";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "created", label: "Создана" },
  { key: "matching", label: "Ищем водителя" },
  { key: "driver", label: "Водитель назначен" },
  { key: "in_progress", label: "В пути" },
  { key: "delivered", label: "Доставлена" },
] as const;

const STATUS_INDEX: Record<string, number> = {
  created: 0,
  matching: 1,
  offered: 2,
  accepted: 2,
  in_progress: 3,
  delivered: 4,
  cancelled: -1,
  expired: -1,
};

export function StatusStepper({ order }: { order: OrderItem }) {
  const { lite } = useMode();
  const active = STATUS_INDEX[order.status] ?? 0;
  const isDelivered = order.status === "delivered";

  if (lite) {
    return (
      <ol className="space-y-0">
        {STEPS.map((step, i) => {
          const done = isDelivered || i < active;
          const current = i === active && !isDelivered;
          const ts = step.key === "driver" ? order.events.offered ?? order.events.accepted : order.events[step.key as keyof typeof order.events];
          return (
            <li key={step.key} className="flex gap-3">
              <span
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                  done
                    ? "border-caspi bg-caspi text-white"
                    : current
                      ? "border-caspi bg-paper text-caspi"
                      : "border-line bg-paper text-line"
                )}
                aria-hidden
              >
                {done ? <Check className="size-3.5" /> : current ? "•" : ""}
              </span>
              <div className={cn("border-b py-3.5 pl-4", i === STEPS.length - 1 && "border-b-0")}>
                <p className={cn("font-semibold", !done && !current && "text-muted-foreground")}>
                  {step.label}
                  {current && <span className="ml-2 text-sm font-normal text-caspi">сейчас</span>}
                </p>
                {ts && <p className="mt-0.5 text-sm text-muted-foreground">{fmtClock(ts)}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol data-testid="status-stepper" className="flex w-full items-start">
      {STEPS.map((step, i) => {
        const done = isDelivered || i < active;
        const current = i === active && !isDelivered;
        return (
          <li key={step.key} className={cn("flex flex-col items-center", i > 0 && "flex-1")}>
            <div className="flex w-full items-center">
              {i > 0 && (
                <div
                  className={cn("h-0.5 flex-1 rounded-full", i <= active || isDelivered ? "bg-caspi" : "bg-line")}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
                  done
                    ? "border-caspi bg-caspi text-white"
                    : current
                      ? "border-caspi bg-paper text-caspi"
                      : "border-line bg-paper text-line"
                )}
                aria-current={current ? "step" : undefined}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={cn("h-0.5 flex-1 rounded-full", i < active || isDelivered ? "bg-caspi" : "bg-line")}
                  aria-hidden
                />
              )}
            </div>
            <p
              className={cn(
                "mt-2.5 px-1 text-center text-xs font-semibold sm:text-[13px]",
                current ? "text-foreground" : done ? "text-muted-foreground" : "text-line"
              )}
            >
              {step.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}