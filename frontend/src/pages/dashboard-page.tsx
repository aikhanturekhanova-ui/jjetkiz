import { useQuery } from "@tanstack/react-query";
import {
  Package,
  CheckCircle2,
  Loader2,
  Truck,
  Building2,
  Send,
  BrainCircuit,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { JsonView } from "@/components/json-view";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/apiClient";
import { axiosErrorHandler } from "@/lib/api";
import { useDelivery } from "@/lib/delivery/store";
import { fmtTenge } from "@/lib/delivery/format";

function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () =>
      Promise.all([
        apiClient.health(),
        apiClient.users(),
        apiClient.orders(),
        apiClient.drivers(),
        apiClient.customers(),
        apiClient.offers(),
        apiClient.aiInsights(),
      ]),
    retry: 1,
  });
}

export function DashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useDashboardData();
  const { orders } = useDelivery();

  const demo = (() => {
    const delivered = orders.filter((o) => o.status === "delivered");
    const active = orders.filter((o) => o.status === "in_progress" || o.status === "accepted");
    const ltl = orders.filter((o) => o.poputchik);
    const backhauls = orders.filter((o) => o.status === "offered" && o.backhaul);
    const cargoT = orders.reduce((s, o) => s + o.weightKg, 0) / 1000;
    const avgPrice = orders.length ? Math.round(orders.reduce((s, o) => s + o.price, 0) / orders.length) : 0;
    const avgTime = delivered.length
      ? Math.round(delivered.reduce((s, o) => s + o.minutes, 0) / delivered.length)
      : 0;
    return {
      total: orders.length,
      delivered: delivered.length,
      active: active.length,
      cargoT,
      avgPrice,
      avgTime,
      ltl: ltl.length,
      backhauls: backhauls.length,
    };
  })();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <AlertTriangle className="size-12 text-destructive" />
        <div className="max-w-md">
          <h1 className="text-xl font-bold">API недоступен</h1>
          <p className="mt-2 text-sm text-muted-foreground">{axiosErrorHandler(error)}</p>
        </div>
        <Button onClick={() => refetch()}>Повторить</Button>
      </div>
    );
  }

  const [health, apiUsers, apiOrders, drivers, customers, offers, insights] = data;
  const delivered = apiOrders.filter((o) => o.status === "delivered").length;
  const inProgress = apiOrders.filter(
    (o) => o.status === "in_progress" || o.status === "accepted"
  ).length;
  const onlineDrivers = drivers.filter((d) => d.current_status === "online").length;

  const stats = [
    { label: "Заказы", value: orders.length, icon: Package, color: "text-sky-400" },
    { label: "Доставлено", value: delivered, icon: CheckCircle2, color: "text-emerald-400" },
    { label: "В работе", value: inProgress, icon: Loader2, color: "text-amber-400" },
    { label: "Водители онлайн", value: `${onlineDrivers}/${drivers.length}`, icon: Truck, color: "text-emerald-400" },
    { label: "Клиенты", value: customers.length, icon: Building2, color: "text-sky-400" },
    { label: "Предложения", value: offers.length, icon: Send, color: "text-violet-400" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Дашборд"
        subtitle={
          health.status === "healthy"
            ? `API: healthy · ${apiUsers.length} пользователей · ${insights.total_recommendations} AI-рекомендаций`
            : "API: статус неизвестен"
        }
        actions={
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="animate-spin" /> : null}
            Обновить
          </Button>
        }
      />

      <div>
        <p className="mb-2 flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
          KPI из демо-стора <span className="rounded-full bg-muted px-2 py-0.5 normal-case">работает без API</span>
        </p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {[
            { label: "Заказы", value: demo.total },
            { label: "Доставлено", value: demo.delivered },
            { label: "В работе", value: demo.active },
            { label: "Груз, тонн", value: `${demo.cargoT.toFixed(1)} т` },
            { label: "Средняя цена", value: fmtTenge(demo.avgPrice) },
            { label: "Ср. время доставки", value: `~${demo.avgTime} мин` },
            { label: "LTL-заявки", value: demo.ltl },
            { label: "Backhaul-предложения", value: demo.backhauls },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="py-4">
                <div className="tnum text-2xl font-bold leading-none">{s.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 py-4">
              <Icon className={`size-8 shrink-0 ${color}`} />
              <div>
                <div className="text-2xl font-bold leading-none">{value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="size-4 text-primary" />
              AI-движок: разбивка по возможностям
            </CardTitle>
            <CardDescription>Рекомендации по событиям за последние N заказов</CardDescription>
          </CardHeader>
          <CardContent>
            <JsonView data={insights.capability_breakdown} defaultOpen={false} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="size-4 text-primary" />
              Последние рекомендации
            </CardTitle>
            <CardDescription>История AI-событий (pricing, consolidation, backhaul, weather, tracking)</CardDescription>
          </CardHeader>
          <CardContent>
            {insights.recent_recommendations.length > 0 ? (
              <JsonView data={insights.recent_recommendations} />
            ) : (
              <p className="text-sm text-muted-foreground">Рекомендаций пока нет — создайте заказ и запустите AI-события.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}