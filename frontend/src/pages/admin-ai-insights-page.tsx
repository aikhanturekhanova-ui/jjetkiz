import { useMemo } from "react";
import { BrainCircuit, TrendingUp, Wallet, Zap } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useDelivery } from "@/lib/delivery/store";
import { fmtTenge } from "@/lib/delivery/format";
import { findSettlement } from "@/lib/delivery/settlements";

const CARGO_KEYWORDS: Array<{ word: string; label: string }> = [
  { word: "строй", label: "Стройматериалы" },
  { word: "запчаст", label: "Запчасти и оборудование" },
  { word: "продукт", label: "Продукты" },
  { word: "мебель", label: "Мебель и техника" },
  { word: "оборудован", label: "Оборудование" },
];

export function AdminAiInsightsPage() {
  const { orders, savings } = useDelivery();

  const insights = useMemo(() => {
    const active = orders.filter((o) => o.status === "in_progress" || o.status === "accepted");
    const delivered = orders.filter((o) => o.status === "delivered");
    const ltl = orders.filter((o) => o.poputchik);
    const backhaulOffers = orders.filter((o) => o.status === "offered" && o.backhaul);

    const byRoute = new Map<string, number>();
    for (const o of orders) {
      const key = `${o.fromId}→${o.toId}`;
      byRoute.set(key, (byRoute.get(key) ?? 0) + 1);
    }
    const mostActive = Array.from(byRoute.entries()).sort((a, b) => b[1] - a[1])[0];

    const byCargo = new Map<string, number>();
    for (const o of orders) {
      const desc = o.description ?? "";
      const hit = CARGO_KEYWORDS.find((k) => desc.toLowerCase().includes(k.word));
      const label = hit?.label ?? "Другое";
      byCargo.set(label, (byCargo.get(label) ?? 0) + 1);
    }
    const topCargo = Array.from(byCargo.entries()).sort((a, b) => b[1] - a[1])[0];

    const reverseRoutes = new Map<string, number>();
    for (const o of orders) {
      const key = `${o.fromId}→${o.toId}`;
      const reverse = `${o.toId}→${o.fromId}`;
      if (byRoute.has(reverse)) {
        reverseRoutes.set(key, (byRoute.get(reverse) ?? 0) - (reverseRoutes.get(reverse) ?? 0));
      }
    }
    const emptyRuns = Array.from(byRoute.entries())
      .filter(([key]) => !byRoute.has(key.split("→").reverse().join("→")))
      .sort((a, b) => b[1] - a[1]);
    const worstEmpty = emptyRuns[0];

    const avgPrice = orders.length ? Math.round(orders.reduce((s, o) => s + o.price, 0) / orders.length) : 0;
    const avgTime = delivered.length
      ? Math.round(delivered.reduce((s, o) => s + o.minutes, 0) / delivered.length)
      : 0;
    const ltlSavings = ltl.reduce((s, o) => s + o.savings, 0);

    return {
      mostActive: mostActive
        ? {
            key: mostActive[0],
            count: mostActive[1],
            from: findSettlement(mostActive[0].split("→")[0])?.name,
            to: findSettlement(mostActive[0].split("→")[1])?.name,
          }
        : null,
      topCargo: topCargo ? { label: topCargo[0], count: topCargo[1] } : null,
      worstEmpty: worstEmpty
        ? {
            key: worstEmpty[0],
            count: worstEmpty[1],
            from: findSettlement(worstEmpty[0].split("→")[0])?.name,
            to: findSettlement(worstEmpty[0].split("→")[1])?.name,
          }
        : null,
      ltlCount: ltl.length,
      ltlSavings,
      backhaulCount: backhaulOffers.length,
      avgPrice,
      avgTime,
      totalSavings: savings,
      active: active.length,
    };
  }, [orders, savings]);

  const cards = [
    {
      icon: TrendingUp,
      title: "Самый активный маршрут",
      value: insights.mostActive ? `${insights.mostActive.from} → ${insights.mostActive.to}` : "—",
      hint: insights.mostActive ? `${insights.mostActive.count} заявок в сторе` : "пока нет данных",
    },
    {
      icon: Zap,
      title: "Самый востребованный груз",
      value: insights.topCargo?.label ?? "—",
      hint: insights.topCargo ? `${insights.topCargo.count} заявок` : "пока нет данных",
    },
    {
      icon: TrendingUp,
      title: "Маршрут с пустым обратным прогоном",
      value: insights.worstEmpty ? `${insights.worstEmpty.from} → ${insights.worstEmpty.to}` : "—",
      hint: insights.worstEmpty
        ? `${insights.worstEmpty.count} рейсов без обратного груза — кандидаты на backhaul`
        : "все маршруты имеют обратную загрузку",
    },
    {
      icon: Wallet,
      title: "Потенциальная экономия",
      value: fmtTenge(insights.totalSavings),
      hint: "из попутных загрузок и объединённых рейсов",
    },
  ];

  return (
    <div>
      <PageHeader
        title="AI-инсайты"
        subtitle="Показатели посчитаны из реальных данных демо-стора: заявки, маршруты, попутные грузы"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="flex-row items-start justify-between gap-2">
              <CardTitle className="text-sm">{c.title}</CardTitle>
              <c.icon className="size-4 shrink-0 text-caspi" aria-hidden />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-extrabold tracking-tight">{c.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">LTL / объединённые рейсы</CardTitle>
            <CardDescription>Попутные загрузки, выбранные клиентами ради скидки</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-extrabold tracking-tight">
              {insights.ltlCount} заявок · экономия {fmtTenge(insights.ltlSavings)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Backhaul матчи</CardTitle>
            <CardDescription>Открытые обратные грузы, которые AI предлагает водителям</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-extrabold tracking-tight">{insights.backhaulCount} предложений</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Средняя цена заявки</p>
            <p className="tnum mt-1 text-lg font-extrabold">{fmtTenge(insights.avgPrice)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Среднее время доставки</p>
            <p className="tnum mt-1 text-lg font-extrabold">~{insights.avgTime} мин</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Заявок в работе сейчас</p>
            <p className="tnum mt-1 text-lg font-extrabold">{insights.active}</p>
          </CardContent>
        </Card>
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <BrainCircuit className="size-4" aria-hidden />
        AI не выдумывает цифры: каждая метрика считается из заказов, маршрутов и попутных грузов в текущем сторе.
      </p>
    </div>
  );
}