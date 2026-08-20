import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Check,
  CheckCircle2,
  CircleCheck,
  MapPin,
  Package,
  Sparkles,
  Truck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTweenValue } from "@/hooks/use-tween";
import { useDelivery } from "@/lib/delivery/store";
import type { OrderItem } from "@/lib/delivery/store";
import { SETTLEMENTS } from "@/lib/delivery/settlements";
import { calcPrice, POPUTCHIK_DISCOUNT, VEHICLES, VEHICLE_LIST } from "@/lib/delivery/pricing";
import type { Priority, VehicleKind } from "@/lib/delivery/pricing";
import { fmtKm, fmtMinutes, fmtTenge, fmtWeight } from "@/lib/delivery/format";
import { useMode } from "@/lib/mode";
import { cn } from "@/lib/utils";

const STEP_LABELS = ["Маршрут", "Груз", "Подтверждение"] as const;

interface Draft {
  fromId: string;
  toId: string;
  fromAddress: string;
  toAddress: string;
  vehicle: VehicleKind;
  weightKg: string;
  volumeM3: string;
  fragile: boolean;
  perishable: boolean;
  description: string;
  priority: Priority;
  social: boolean;
}

const initialDraft: Draft = {
  fromId: "",
  toId: "",
  fromAddress: "",
  toAddress: "",
  vehicle: "pickup",
  weightKg: "",
  volumeM3: "",
  fragile: false,
  perishable: false,
  description: "",
  priority: "normal",
  social: false,
};

function routeHash(fromId: string, toId: string, vehicle: string): number {
  let h = 0;
  const s = `${fromId}:${toId}:${vehicle}`;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function PriceRow({ label, amount, tone }: { label: string; amount: number; tone: "base" | "plus" | "minus" }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
      <span className={tone === "minus" ? "text-success" : tone === "plus" ? "text-muted-foreground" : "font-semibold"}>
        {label}
      </span>
      <span
        className={cn(
          "tnum font-bold",
          tone === "minus" ? "text-success" : tone === "plus" ? "text-muted-foreground" : ""
        )}
      >
        {tone === "minus" ? `− ${fmtTenge(amount)}` : `+ ${fmtTenge(amount)}`}
      </span>
    </div>
  );
}

export function OrderNewPage() {
  const { createOrder, addSavings } = useDelivery();
  const { lite } = useMode();

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [poputchikChecking, setPoputchikChecking] = useState(false);
  const [poputchikAvailable, setPoputchikAvailable] = useState(false);
  const [poputchikApplied, setPoputchikApplied] = useState(false);
  const [created, setCreated] = useState<OrderItem | null>(null);
  const [touched, setTouched] = useState(false);

  const from = SETTLEMENTS.find((s) => s.id === draft.fromId);
  const to = SETTLEMENTS.find((s) => s.id === draft.toId);
  const routeSet = Boolean(from && to && draft.fromId !== draft.toId);

  const price = useMemo(
    () =>
      from && to && draft.fromId !== draft.toId
        ? calcPrice({
            from,
            to,
            vehicle: draft.vehicle,
            weightKg: Number(draft.weightKg) || 0,
            perishable: draft.perishable,
            fragile: draft.fragile,
            priority: draft.priority,
            social: draft.social,
            poputchik: poputchikApplied,
          })
        : null,
    [from, to, draft, poputchikApplied]
  );

  const weight = Number(draft.weightKg);
  const weightValid = Number.isFinite(weight) && weight > 0;
  const weightOverload = weightValid && weight > VEHICLES[draft.vehicle].maxKg;
  const totalShown = useTweenValue(price?.total ?? 0, 700);

  useEffect(() => {
    if (!routeSet) {
      setPoputchikChecking(false);
      setPoputchikAvailable(false);
      setPoputchikApplied(false);
      return;
    }
    setPoputchikChecking(true);
    setPoputchikApplied(false);
    const t = window.setTimeout(() => {
      setPoputchikAvailable(routeHash(draft.fromId, draft.toId, draft.vehicle) % 3 !== 0);
      setPoputchikChecking(false);
    }, 700);
    return () => window.clearTimeout(t);
  }, [draft.fromId, draft.toId, draft.vehicle, routeSet]);

  const stepValid = [routeSet, weightValid && !weightOverload, true][step];

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const handleCreate = () => {
    if (!from || !to || !weightValid) return;
    setTouched(true);
    const order = createOrder({
      fromId: draft.fromId,
      toId: draft.toId,
      fromAddress: draft.fromAddress || undefined,
      toAddress: draft.toAddress || undefined,
      vehicle: draft.vehicle,
      weightKg: weight,
      volumeM3: draft.volumeM3 ? Number(draft.volumeM3) : null,
      perishable: draft.perishable,
      fragile: draft.fragile,
      description: draft.description || undefined,
      priority: draft.priority,
      social: draft.social,
      poputchik: poputchikApplied,
    });
    setCreated(order);
    setStep(0);
    window.scrollTo({ top: 0 });
    toast("Заявка создана", {
      description: `Номер ${order.number} — сохрани его для отслеживания`,
      icon: <CircleCheck className="size-5 text-caspi" />,
    });
  };

  const applyPoputchik = () => {
    setPoputchikApplied(true);
    if (price) addSavings(Math.round(price.subtotal * POPUTCHIK_DISCOUNT));
    toast("Скидка применена", {
      description: "Попутный рейс добавлен к заявке",
      icon: <CircleCheck className="size-5 text-caspi" />,
    });
  };

  if (created) {
    return (
      <div className="container-site max-w-2xl py-12 sm:py-20">
        <div className="rounded-3xl border bg-paper p-8 text-center sm:p-12">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success/10 text-success">
            <CheckCircle2 className="size-8" aria-hidden />
          </span>
          <h1 className="mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl">Заявка создана</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Водитель обычно находится за 5–10 минут. Статусы обновляются автоматически — следи за заказом
            по номеру.
          </p>
          <p className="tnum mt-7 font-display text-3xl font-semibold tracking-tight text-caspi sm:text-4xl">
            {created.number}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full px-7 text-base">
              <Link to={`/track/${created.number}`}>Отследить заказ</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 rounded-full px-7 text-base"
              onClick={() => setCreated(null)}
            >
              Создать ещё одну
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-site max-w-3xl py-10 sm:py-16">
      <p className="text-xs font-bold tracking-[0.2em] text-caspi uppercase">Новая доставка</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Создаю заявку</h1>

      <ol className="mt-8 flex items-center gap-2" aria-label="Шаги создания заявки">
        {STEP_LABELS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                data-testid="stepper-label"
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                  done ? "border-caspi bg-caspi text-white" : current ? "border-caspi bg-paper text-caspi" : "border-line bg-paper text-line"
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-semibold sm:block",
                  current ? "text-foreground" : done ? "text-muted-foreground" : "text-line"
                )}
              >
                {label}
              </span>
              {i < STEP_LABELS.length - 1 && (
                <div className={cn("h-0.5 flex-1 rounded-full", done ? "bg-caspi" : "bg-line")} aria-hidden />
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-8 space-y-6">
        {step === 0 && (
          <section aria-label="Шаг 1: маршрут" className="rounded-2xl border bg-paper p-6 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-[1fr_auto_1fr]">
              <div>
                <Label htmlFor="from" className="text-sm font-bold">Откуда везём</Label>
                <Select value={draft.fromId} onValueChange={(v) => set("fromId", v)}>
                  <SelectTrigger id="from" className="mt-2 w-full">
                    <SelectValue placeholder="Выбери населённый пункт" />
                  </SelectTrigger>
                  <SelectContent>
                    {SETTLEMENTS.map((s) => (
                      <SelectItem key={s.id} value={s.id} disabled={s.id === draft.toId}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  className="mt-3"
                  placeholder="Адрес отправки (необязательно)"
                  value={draft.fromAddress}
                  onChange={(e) => set("fromAddress", e.target.value)}
                  aria-label="Адрес отправки"
                />
              </div>
              <div className="hidden items-end justify-center pb-2 sm:flex">
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, fromId: d.toId, toId: d.fromId }))}
                  disabled={!routeSet}
                  className="flex size-10 items-center justify-center rounded-full border bg-background text-caspi transition-colors hover:bg-muted disabled:opacity-40"
                  aria-label="Поменять направление местами"
                >
                  <ArrowLeft className="size-4" aria-hidden />
                  <ArrowRight className="-ml-1.5 size-4" aria-hidden />
                </button>
              </div>
              <div>
                <Label htmlFor="to" className="text-sm font-bold">Куда везём</Label>
                <Select value={draft.toId} onValueChange={(v) => set("toId", v)}>
                  <SelectTrigger id="to" className="mt-2 w-full">
                    <SelectValue placeholder="Выбери населённый пункт" />
                  </SelectTrigger>
                  <SelectContent>
                    {SETTLEMENTS.map((s) => (
                      <SelectItem key={s.id} value={s.id} disabled={s.id === draft.fromId}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  className="mt-3"
                  placeholder="Адрес доставки (необязательно)"
                  value={draft.toAddress}
                  onChange={(e) => set("toAddress", e.target.value)}
                  aria-label="Адрес доставки"
                />
              </div>
            </div>
            {routeSet && from && to ? (
              <p className="mt-5 flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm font-semibold">
                <MapPin className="size-4 shrink-0 text-caspi" aria-hidden />
                {from.name} → {to.name} · {fmtKm(price?.km ?? 0)} · ~{fmtMinutes(Math.round(((price?.km ?? 0) / 62) * 60))}
              </p>
            ) : (
              <p className="mt-5 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground" role="alert">
                {draft.fromId === draft.toId && draft.fromId
                  ? "Пункты отправки и доставки совпадают — выбери другой."
                  : "Выбери, откуда и куда поедет груз."}
              </p>
            )}
          </section>
        )}
        {step === 1 && (
          <section aria-label="Шаг 2: груз" className="rounded-2xl border bg-paper p-6 sm:p-8">
            <p className="text-sm font-bold">Машина</p>
            <div role="radiogroup" aria-label="Машина" className="mt-2 grid gap-3 sm:grid-cols-3">
              {VEHICLE_LIST.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={draft.vehicle === v.id}
                  onClick={() => set("vehicle", v.id)}
                  className={cn(
                    "rounded-xl border-2 p-4 text-left transition-colors",
                    draft.vehicle === v.id ? "border-caspi bg-caspi/5" : "border-line hover:border-muted-foreground/40"
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-caspi">
                      {v.id === "pickup" ? (
                        <Truck className="size-4.5" aria-hidden />
                      ) : v.id === "tent" ? (
                        <Boxes className="size-4.5" aria-hidden />
                      ) : (
                        <Zap className="size-4.5" aria-hidden />
                      )}
                    </span>
                    <span
                      className={cn("size-4 rounded-full border-2", draft.vehicle === v.id ? "border-caspi bg-caspi" : "border-line")}
                      aria-hidden
                    />
                  </span>
                  <span className="mt-3 block font-extrabold">{v.name}</span>
                  <span className="mt-0.5 block text-xs font-semibold text-muted-foreground">{v.hint}</span>
                  <span className="tnum mt-2 block text-sm font-bold text-caspi">от {fmtTenge(v.ratePerKm)}/км</span>
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="weight" className="text-sm font-bold">Вес груза, кг</Label>
                <Input
                  id="weight"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  placeholder="Например, 350"
                  className="mt-2"
                  value={draft.weightKg}
                  onChange={(e) => set("weightKg", e.target.value)}
                />
                {touched && !weightValid && (
                  <p className="mt-1.5 text-sm font-semibold text-destructive" role="alert">
                    Укажи вес груза — от этого зависит цена.
                  </p>
                )}
                {weightOverload && (
                  <p className="mt-1.5 text-sm font-semibold text-warning" role="alert">
                    Груз тяжелее {fmtWeight(VEHICLES[draft.vehicle].maxKg)} — для этой машины мало места.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="volume" className="text-sm font-bold">
                  Объём, м³ <span className="font-normal text-muted-foreground">(необязательно)</span>
                </Label>
                <Input
                  id="volume"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.1"
                  placeholder="Например, 1,5"
                  className="mt-2"
                  value={draft.volumeM3}
                  onChange={(e) => set("volumeM3", e.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border p-4 font-semibold has-[[data-state=checked]]:border-caspi">
                <Checkbox checked={draft.fragile} onCheckedChange={(v) => set("fragile", Boolean(v))} />
                <span>
                  Хрупкий груз
                  <span className="block text-xs font-normal text-muted-foreground">+10% к цене, аккуратная погрузка</span>
                </span>
              </label>
              <label className="flex items-center gap-3 rounded-xl border p-4 font-semibold has-[[data-state=checked]]:border-caspi">
                <Checkbox checked={draft.perishable} onCheckedChange={(v) => set("perishable", Boolean(v))} />
                <span>
                  Нужен холод <span className="font-normal text-muted-foreground">(рефрижератор)</span>
                  <span className="block text-xs font-normal text-muted-foreground">+18% к цене</span>
                </span>
              </label>
            </div>

            <div className="mt-6">
              <Label htmlFor="desc" className="text-sm font-bold">
                Что везём <span className="font-normal text-muted-foreground">(необязательно)</span>
              </Label>
              <Textarea
                id="desc"
                className="mt-2"
                rows={3}
                placeholder="Например: 5 паллет с запчастями, тяжёлое — снизу"
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>

            <div className="mt-6">
              <p className="text-sm font-bold">Скорость</p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  role="radio"
                  aria-checked={draft.priority === "normal"}
                  onClick={() => set("priority", "normal")}
                  className={cn(
                    "rounded-xl border-2 p-4 text-left transition-colors",
                    draft.priority === "normal" ? "border-caspi bg-caspi/5" : "border-line hover:border-muted-foreground/40"
                  )}
                >
                  <span className="block font-extrabold">Обычная</span>
                  <span className="mt-0.5 block text-xs font-semibold text-muted-foreground">Груз приедет в течение дня</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={draft.priority === "high"}
                  onClick={() => set("priority", "high")}
                  className={cn(
                    "rounded-xl border-2 p-4 text-left transition-colors",
                    draft.priority === "high" ? "border-caspi bg-caspi/5" : "border-line hover:border-muted-foreground/40"
                  )}
                >
                  <span className="block font-extrabold">Срочная</span>
                  <span className="mt-0.5 block text-xs font-semibold text-muted-foreground">
                    Приоритет +22% · машина быстрее
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-6">
              <label className="flex items-center gap-3 rounded-xl bg-muted p-4 font-semibold has-[[data-state=checked]]:border-caspi">
                <Checkbox checked={draft.social} onCheckedChange={(v) => set("social", Boolean(v))} />
                <span>
                  Гуманитарный или социальный груз
                  <span className="block text-xs font-normal text-muted-foreground">−25% к цене</span>
                </span>
              </label>
            </div>
          </section>
        )}
        {step === 2 && from && to && price && (
          <>
            <section aria-label="Шаг 3: подтверждение" className="rounded-2xl border bg-paper p-6 sm:p-8">
              <p className="text-sm font-bold text-muted-foreground">Маршрут</p>
              <p className="mt-1 text-lg font-extrabold tracking-tight">
                {from.name} → {to.name}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {fmtKm(price.km)} · ~{fmtMinutes(Math.round((price.km / 62) * 60))}
                {draft.fromAddress && ` · ${draft.fromAddress}`}
                {draft.toAddress && ` · ${draft.toAddress}`}
              </p>

              <div className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-caspi">
                    <Package className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-bold">{fmtWeight(weight)}</p>
                    <p className="text-xs text-muted-foreground">
                      {VEHICLES[draft.vehicle].name}
                      {draft.volumeM3 ? ` · ${draft.volumeM3.replace(".", ",")} м³` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-caspi">
                    <Zap className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-bold">
                      {draft.priority === "high" ? "Срочная" : "Обычная"}
                      {draft.social && " · соц. груз"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[draft.fragile && "хрупкое", draft.perishable && "нужен холод", draft.description && "описание груза"]
                        .filter(Boolean)
                        .join(" · ") || "Без особых условий"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section
              aria-label="Цена"
              className={cn("rounded-2xl border bg-paper p-6 sm:p-8", lite && "border-dashed")}
            >
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-bold text-muted-foreground">Расчёт цены</p>
                <p data-testid="price-live" className="tnum text-lg font-extrabold text-caspi">
                  {fmtTenge(Math.round(totalShown))}
                </p>
              </div>
              <div className="mt-4">
                <PriceRow label={`Базовая ставка · ${fmtKm(price.km)} × ${VEHICLES[draft.vehicle].ratePerKm} ₸`} amount={price.base} tone="base" />
                {price.extras.map((e) => (
                  <PriceRow key={e.label} label={e.label} amount={e.amount} tone="plus" />
                ))}
                {price.discounts.map((d) => (
                  <PriceRow key={d.label} label={d.label} amount={d.amount} tone="minus" />
                ))}
              </div>
              <div className="mt-3 flex items-baseline justify-between border-t pt-4">
                <span className="font-extrabold">Итого</span>
                <span className="tnum text-2xl font-extrabold tracking-tight">{fmtTenge(price.total)}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Цена фиксируется после создания заявки и не меняется в пути.
              </p>
            </section>

            <section aria-label="Попутный груз" className="rounded-2xl border border-caspi/30 bg-caspi/5 p-6 sm:p-7">
              {poputchikChecking ? (
                <div className="flex items-center gap-3">
                  <span className="size-5 animate-spin rounded-full border-2 border-caspi border-t-transparent" aria-hidden />
                  <p className="text-sm font-semibold text-muted-foreground">Проверяем попутные грузы на этом маршруте…</p>
                </div>
              ) : poputchikAvailable && !poputchikApplied ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-paper text-caspi">
                      <Sparkles className="size-5" aria-hidden />
                    </span>
                    <div>
                      <p className="font-extrabold">AI нашёл попутный груз</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        По маршруту {to.name} уже едет машина. Груз поедет с ней — минус{" "}
                        {Math.round(POPUTCHIK_DISCOUNT * 100)}% от суммы.
                      </p>
                    </div>
                  </div>
                  <Button className="shrink-0 rounded-full" onClick={applyPoputchik}>
                    Применить скидку
                  </Button>
                </div>
              ) : poputchikApplied ? (
                <div className="flex items-center gap-3">
                  <CircleCheck className="size-5 shrink-0 text-success" aria-hidden />
                  <p className="text-sm font-semibold">
                    Скидка применена — {fmtTenge(price.discounts.reduce((s, d) => s + (d.label.includes("Попутный") ? d.amount : 0), 0))} уже учтены в цене.
                  </p>
                </div>
              ) : (
                <p className="text-sm font-semibold text-muted-foreground">
                  Попутного груза на этот маршрут сейчас нет — поедет отдельная машина.
                </p>
              )}
            </section>
          </>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            className="h-12 rounded-full px-6 text-base font-bold"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Назад
          </Button>
          {step < 2 ? (
            <Button
              className="h-12 rounded-full px-7 text-base"
              disabled={!stepValid}
              onClick={() => setStep((s) => s + 1)}
            >
              {step === 0 ? "Дальше — груз и цена" : "Дальше — подтверждение"}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button className="h-12 rounded-full px-7 text-base" onClick={handleCreate} disabled={!stepValid}>
              Создать заявку
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}