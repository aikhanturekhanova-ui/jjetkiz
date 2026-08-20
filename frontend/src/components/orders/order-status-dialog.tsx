import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/apiClient";
import { axiosErrorHandler } from "@/lib/api";
import { ORDER_STATUS_TRANSITIONS, type Order, type OrderStatus } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";

export function OrderStatusDialog({
  order,
  open,
  onOpenChange,
}: {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<OrderStatus | "">("");
  const allowed = order ? (ORDER_STATUS_TRANSITIONS[order.status] ?? []) : [];

  useEffect(() => {
    if (open) setStatus("");
  }, [open]);

  const mutation = useMutation({
    mutationFn: (s: string) => apiClient.setOrderStatus(order!.id, s),
    onSuccess: (updated) => {
      toast.success(`Статус изменён: ${order?.status} → ${updated.status}`);
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order-history"] });
    },
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Смена статуса заказа</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            Текущий статус: <StatusBadge status={order?.status ?? ""} />
          </DialogDescription>
        </DialogHeader>

        {allowed.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Заказ в терминальном статусе — переходы невозможны.
          </p>
        ) : (
          <div className="space-y-2">
            <Select value={status || undefined} onValueChange={(v) => setStatus(v as OrderStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите новый статус..." />
              </SelectTrigger>
              <SelectContent>
                {allowed.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Доступные переходы: {allowed.join(", ")}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button
            disabled={!status || mutation.isPending}
            onClick={() => status && mutation.mutate(status)}
          >
            {mutation.isPending ? "Сохранение..." : "Изменить статус"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}