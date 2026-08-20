import { useEffect } from "react";
import { useTweenValue } from "@/hooks/use-tween";
import { useDelivery } from "@/lib/delivery/store";
import { fmtTenge } from "@/lib/delivery/format";
import { useMode } from "@/lib/mode";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

export function SavingsCounter({ className }: { className?: string }) {
  const { savings, simulateGrowth } = useDelivery();
  const { lite } = useMode();
  const reduceMotion = usePrefersReducedMotion();
  const shown = useTweenValue(savings, 1100);

  useEffect(() => {
    if (lite || reduceMotion) return;
    const t = window.setInterval(simulateGrowth, 3200);
    return () => window.clearInterval(t);
  }, [lite, reduceMotion, simulateGrowth]);

  if (lite) {
    return (
      <div className={cn("rounded-2xl border bg-paper p-6 sm:p-7", className)}>
        <p className="text-sm font-bold">Сэкономили компании Мангистау</p>
        <p className="tnum mt-2 text-3xl font-extrabold tracking-tight">{fmtTenge(shown)}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Попутные доставки и объединённые рейсы — с 2024 года
        </p>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "relative overflow-hidden rounded-3xl bg-ink p-7 text-sand shadow-xl shadow-ink/10 sm:p-9",
        className
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 400 300"
        className="pointer-events-none absolute -top-10 right-0 size-80 text-sand/10"
        fill="none"
        stroke="currentColor"
      >
        <path d="M60 300 C 90 220 150 200 200 140 S 320 90 380 40" />
        <path d="M40 300 C 70 240 130 215 180 160 S 300 110 360 60" />
        <path d="M20 300 C 50 260 110 230 160 180 S 280 130 340 80" />
      </svg>

      <div className="relative">
        <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-sand/60 uppercase">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-live rounded-full bg-caspi" />
            <span className="relative inline-flex size-2 rounded-full bg-caspi" />
          </span>
          Обновляется в реальном времени
        </p>

        <p className="mt-7 text-sm font-medium text-sand/70">Сэкономили компании Мангистау</p>

        <p data-testid="counter" className="tnum mt-2 font-display text-[clamp(2.4rem,6.5vw,4.4rem)] leading-none font-semibold tracking-tight">
          {fmtTenge(shown)}
        </p>

        <p className="mt-5 max-w-xs text-sm leading-relaxed text-sand/55">
          Попутные доставки и объединённые рейсы — с 2024 года. Каждый новый попутный маршрут
          добавляет сюда сумму.
        </p>
      </div>
    </aside>
  );
}