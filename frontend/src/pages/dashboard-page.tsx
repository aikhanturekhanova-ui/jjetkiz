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

  const [health, users, orders, drivers, customers, offers, insights] = data;
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const inProgress = orders.filter(
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
            ? `API: healthy · ${users.length} пользователей · ${insights.total_recommendations} AI-рекомендаций`
            : "API: статус неизвестен"
        }
        actions={
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="animate-spin" /> : null}
            Обновить
          </Button>
        }
      />

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