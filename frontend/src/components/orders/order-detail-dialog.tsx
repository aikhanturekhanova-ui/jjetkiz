import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { JsonView } from "@/components/json-view";
import { StatusBadge } from "@/components/status-badge";
import { apiClient } from "@/lib/apiClient";
import { axiosErrorHandler } from "@/lib/api";
import { useUsers } from "@/hooks/use-users";
import { fmtDate, fmtNum } from "@/lib/format";
import type { Order } from "@/lib/types";
import {
  BrainCircuit,
  Calculator,
  Loader2,
  PackagePlus,
  RefreshCcw,
  CloudSun,
} from "lucide-react";

export function OrderDetailDialog({
  order,
  open,
  onOpenChange,
}: {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: users } = useUsers();
  const [result, setResult] = useState<{ title: string; data: unknown } | null>(null);

  useEffect(() => {
    if (open) setResult(null);
  }, [open]);

  const ai = useMutation({
    mutationFn: ({ label, fn }: { label: string; fn: () => Promise<unknown> }) =>
      fn().then((data) => ({ label, data })),
    onSuccess: (r) => {
      toast.success("Готово");
      setResult({ title: r.label, data: r.data });
    },
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  if (!order) return null;
  const customer = users?.find((u) => u.id === order.customer_id);

  const run = (label: string, fn: () => Promise<unknown>) => ai.mutate({ label, fn });

  const actions = [
    { label: "Рекомендовать цену", icon: Calculator, fn: () => apiClient.aiPriceRecommend(order.id) },
    { label: "Анализ цены", icon: BrainCircuit, fn: () => apiClient.aiPriceAnalyze(order.id) },
    { label: "Анализ консолидации", icon: PackagePlus, fn: () => apiClient.aiConsolidationAnalyze(order.id) },
    { label: "Создать LTL-группу", icon: PackagePlus, fn: () => apiClient.aiConsolidationCreate(order.id) },
    { label: "ETA с учётом погоды", icon: CloudSun, fn: () => apiClient.aiWeatherEta(order.id) },
    { label: "Событие: создан", icon: RefreshCcw, fn: () => apiClient.aiOrderCreated(order.id) },
    { label: "Событие: доставлен", icon: RefreshCcw, fn: () => apiClient.aiOrderDelivered(order.id) },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono text-sm">
            Заказ {order.id}
            <StatusBadge status={order.status} />
          </DialogTitle>
          <DialogDescription>
            {customer ? `${customer.full_name} (${customer.phone})` : `Клиент: ${order.customer_id}`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Отправка (A)</div>
            <div className="mt-1 text-sm font-medium">{order.point_a_address}</div>
            <div className="font-mono text-xs text-muted-foreground">
              {order.point_a_lat}, {order.point_a_lng}
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Назначение (B)</div>
            <div className="mt-1 text-sm font-medium">{order.point_b_address}</div>
            <div className="font-mono text-xs text-muted-foreground">
              {order.point_b_lat}, {order.point_b_lng}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <div className="text-xs text-muted-foreground">Вес</div>
            <div className="font-medium">{fmtNum(order.cargo_weight_kg)} кг</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Объём</div>
            <div className="font-medium">{fmtNum(order.cargo_volume_m3)} м³</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Приоритет</div>
            <StatusBadge status={order.priority_level} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Цена</div>
            <div className="font-medium">{order.price_offer ? `${fmtNum(order.price_offer)} ₸` : "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Создан</div>
            <div>{fmtDate(order.created_at)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Обновлён</div>
            <div>{fmtDate(order.updated_at)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Упаковка</div>
            <div>{order.packaging_quality ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">LTL</div>
            <div>{order.is_ltl_group ? "да" : "нет"}</div>
          </div>
        </div>

        {order.cargo_description && (
          <div className="rounded-lg border p-3 text-sm">{order.cargo_description}</div>
        )}

        <div>
          <div className="mb-2 text-sm font-semibold">AI-действия</div>
          <div className="flex flex-wrap gap-2">
            {actions.map(({ label, icon: Icon, fn }) => (
              <Button
                key={label}
                variant="outline"
                size="sm"
                disabled={ai.isPending}
                onClick={() => run(label, fn)}
              >
                {ai.isPending ? <Loader2 className="animate-spin" /> : <Icon />}
                {label}
              </Button>
            ))}
          </div>
        </div>

        {ai.isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> AI-движок считает...
          </div>
        )}
        {result && !ai.isPending && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-primary">{result.title}</div>
            <JsonView data={result.data} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}