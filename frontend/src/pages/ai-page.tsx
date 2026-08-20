import { useState, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Calculator, PackagePlus, Repeat2, CloudSun, Zap, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { JsonView } from "@/components/json-view";
import { apiClient } from "@/lib/apiClient";
import { axiosErrorHandler } from "@/lib/api";
import type { AiHealth } from "@/lib/types";

function OrderIdInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        placeholder="UUID заказа"
        className="font-mono"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function AiResult({ title, data }: { title: string; data: unknown }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-primary">{title}</div>
      <JsonView data={data} />
    </div>
  );
}

function Panel({
  title,
  description,
  children,
  onRun,
  pending,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onRun: () => void;
  pending: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        <Button onClick={onRun} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Zap />}
          {pending ? "AI считает..." : "Запустить"}
        </Button>
      </CardContent>
    </Card>
  );
}

function PricingTab() {
  const [orderId, setOrderId] = useState("");
  const [result, setResult] = useState<{ title: string; data: unknown } | null>(null);

  const recalculate = useMutation({
    mutationFn: apiClient.aiPriceRecalculate,
    onSuccess: (data) => setResult({ title: "🔄 Пересчёт цен ожидающих заказов", data }),
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });
  const recommend = useMutation({
    mutationFn: (id: string) => apiClient.aiPriceRecommend(id),
    onSuccess: (data) => setResult({ title: `💰 Рекомендуемая цена для ${orderId.slice(0, 8)}…`, data }),
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });
  const analyze = useMutation({
    mutationFn: (id: string) => apiClient.aiPriceAnalyze(id),
    onSuccess: (data) => setResult({ title: `📈 Анализ ценообразования ${orderId.slice(0, 8)}…`, data }),
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel
        title="Рекомендация цены"
        description="AI считает базовую цену, наценки за срочность, погоду, удалённость"
        pending={recommend.isPending}
        onRun={() => orderId && recommend.mutate(orderId)}
      >
        <OrderIdInput id="price-order" label="Заказ (order_id)" value={orderId} onChange={setOrderId} />
      </Panel>
      <Panel
        title="Анализ цены"
        description="Разбор составляющих цены выбранного заказа"
        pending={analyze.isPending}
        onRun={() => orderId && analyze.mutate(orderId)}
      >
        <OrderIdInput id="price-analyze" label="Заказ (order_id)" value={orderId} onChange={setOrderId} />
      </Panel>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Пересчитать все ожидающие заказы</CardTitle>
          <CardDescription>AI пересматривает цены заказов в статусе created/matching</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => recalculate.mutate()} disabled={recalculate.isPending}>
            {recalculate.isPending ? <Loader2 className="animate-spin" /> : <Calculator />}
            {recalculate.isPending ? "Считаем..." : "Пересчитать все"}
          </Button>
        </CardContent>
      </Card>
      {result && <div className="lg:col-span-2"><AiResult {...result} /></div>}
    </div>
  );
}

function ConsolidationTab() {
  const [orderId, setOrderId] = useState("");
  const [result, setResult] = useState<{ title: string; data: unknown } | null>(null);

  const analyze = useMutation({
    mutationFn: (id: string) => apiClient.aiConsolidationAnalyze(id),
    onSuccess: (data) => setResult({ title: "🧩 Анализ консолидации", data }),
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });
  const create = useMutation({
    mutationFn: (id: string) => apiClient.aiConsolidationCreate(id),
    onSuccess: (data) => setResult({ title: "🧩 Создание LTL-группы", data }),
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel
        title="Анализ консолидации"
        description="Проверка: выгодно ли объединить заказ в LTL-группу"
        pending={analyze.isPending}
        onRun={() => orderId && analyze.mutate(orderId)}
      >
        <OrderIdInput id="cons-order" label="Заказ (order_id)" value={orderId} onChange={setOrderId} />
      </Panel>
      <Panel
        title="Создать LTL-группу"
        description="Если анализ вернул CREATE_LTL_GROUP — группа будет создана"
        pending={create.isPending}
        onRun={() => orderId && create.mutate(orderId)}
      >
        <OrderIdInput id="cons-create" label="Заказ (order_id)" value={orderId} onChange={setOrderId} />
      </Panel>
      {result && <div className="lg:col-span-2"><AiResult {...result} /></div>}
    </div>
  );
}

function BackhaulTab() {
  const [driverId, setDriverId] = useState("");
  const [result, setResult] = useState<{ title: string; data: unknown } | null>(null);

  const find = useMutation({
    mutationFn: (id: string) => apiClient.aiBackhaulFind(id),
    onSuccess: (data) => setResult({ title: `🔁 Обратные рейсы для водителя ${driverId.slice(0, 8)}…`, data }),
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel
        title="Поиск обратных рейсов"
        description="AI подбирает попутные грузы после доставки, чтобы водитель не ехал пустым"
        pending={find.isPending}
        onRun={() => driverId && find.mutate(driverId)}
      >
        <div className="space-y-2">
          <Label>Водитель (driver_id)</Label>
          <Input
            placeholder="UUID водителя"
            className="font-mono"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
          />
        </div>
      </Panel>
      {result && <div className="lg:col-span-2"><AiResult {...result} /></div>}
    </div>
  );
}

function WeatherTab() {
  const [orderId, setOrderId] = useState("");
  const [result, setResult] = useState<{ title: string; data: unknown } | null>(null);

  const assess = useMutation({
    mutationFn: apiClient.weatherAnalyze,
    onSuccess: (data) => setResult({ title: "🌤 Оценка погодных рисков сети", data }),
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });
  const eta = useMutation({
    mutationFn: (id: string) => apiClient.aiWeatherEta(id),
    onSuccess: (data) => setResult({ title: "🌤 ETA с учётом погоды", data }),
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel
        title="Риски сети"
        description="Оценка всех активных заказов на предмет пылевых бурь и ветра"
        pending={assess.isPending}
        onRun={() => assess.mutate()}
      >
        <p className="text-sm text-muted-foreground">Без параметров — анализируются все активные заказы.</p>
      </Panel>
      <Panel
        title="ETA с учётом погоды"
        description="Пересчёт времени доставки конкретного заказа с погодными рисками"
        pending={eta.isPending}
        onRun={() => orderId && eta.mutate(orderId)}
      >
        <OrderIdInput id="weather-order" label="Заказ (order_id)" value={orderId} onChange={setOrderId} />
      </Panel>
      {result && <div className="lg:col-span-2"><AiResult {...result} /></div>}
    </div>
  );
}

export function AiPage() {
  const { data: health } = useQuery({
    queryKey: ["ai-health"],
    queryFn: apiClient.aiHealth,
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI-рекомендации"
        subtitle="AI Logistics Engine: ценообразование, консолидация, обратные рейсы, погодные риски"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="size-4 text-primary" />
            Статус движка
            {(health as AiHealth | undefined)?.status && (
              <Badge variant={(health as AiHealth).status === "operational" ? "success" : "warning"}>
                {(health as AiHealth).status}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <JsonView data={health ?? "Загрузка..."} defaultOpen={false} />
        </CardContent>
      </Card>

      <Tabs defaultValue="pricing">
        <TabsList className="w-full justify-start sm:w-fit">
          <TabsTrigger value="pricing"><Calculator /> Цены</TabsTrigger>
          <TabsTrigger value="consolidation"><PackagePlus /> Консолидация</TabsTrigger>
          <TabsTrigger value="backhaul"><Repeat2 /> Обратные рейсы</TabsTrigger>
          <TabsTrigger value="weather"><CloudSun /> Погода</TabsTrigger>
        </TabsList>
        <TabsContent value="pricing"><PricingTab /></TabsContent>
        <TabsContent value="consolidation"><ConsolidationTab /></TabsContent>
        <TabsContent value="backhaul"><BackhaulTab /></TabsContent>
        <TabsContent value="weather"><WeatherTab /></TabsContent>
      </Tabs>
    </div>
  );
}