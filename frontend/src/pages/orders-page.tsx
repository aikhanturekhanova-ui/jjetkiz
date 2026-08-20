import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Loader2, ArrowRightLeft, Calculator } from "lucide-react";
import { PageHeader, EmptyRow } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { OrderCreateDialog } from "@/components/orders/order-create-dialog";
import { OrderStatusDialog } from "@/components/orders/order-status-dialog";
import { OrderDetailDialog } from "@/components/orders/order-detail-dialog";
import { apiClient } from "@/lib/apiClient";
import { axiosErrorHandler, shortId } from "@/lib/api";
import { useUsers } from "@/hooks/use-users";
import { fmtDate, fmtNum } from "@/lib/format";
import { ORDER_STATUSES, type Order } from "@/lib/types";

export function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [statusOrder, setStatusOrder] = useState<Order | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: users } = useUsers();
  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", statusFilter, customerFilter],
    queryFn: () =>
      apiClient.orders({
        status: statusFilter || undefined,
        customer_id: customerFilter || undefined,
      }),
  });

  const quickPrice = useMutation({
    mutationFn: (orderId: string) => apiClient.aiPriceRecommend(orderId),
    onSuccess: (_data, orderId) => {
      setDetailOrder((prev) => (prev && prev.id === orderId ? prev : null));
      toast.success("Цена рассчитана AI-движком");
      setDetailOpen(true);
    },
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  const customerName = (id: string) => {
    const u = users?.find((x) => x.id === id);
    return u ? `${u.full_name} (${u.phone})` : shortId(id);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Заказы"
        subtitle="Грузоперевозки по Мангистауской области: маршруты, статусы, AI-ценообразование"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Новый заказ
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter || undefined} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Все статусы</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={customerFilter || undefined} onValueChange={setCustomerFilter}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Все клиенты" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Все клиенты</SelectItem>
            {(users ?? [])
              .filter((u) => u.role === "customer")
              .map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.full_name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {(statusFilter || customerFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter("");
              setCustomerFilter("");
            }}
          >
            Сбросить
          </Button>
        )}
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Маршрут</TableHead>
              <TableHead>Клиент</TableHead>
              <TableHead>Груз</TableHead>
              <TableHead>Приоритет</TableHead>
              <TableHead>Цена</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Создан</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <EmptyRow colSpan={9} text="Загрузка..." />
            ) : !orders?.length ? (
              <EmptyRow colSpan={9} text="Заказов нет. Создайте первый!" />
            ) : (
              orders.map((o) => (
                <TableRow key={o.id} className="cursor-pointer" onClick={() => { setDetailOrder(o); setDetailOpen(true); }}>
                  <TableCell className="font-mono text-xs">{shortId(o.id)}</TableCell>
                  <TableCell>
                    <div className="max-w-64 truncate">{o.point_a_address}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ArrowRightLeft className="size-3" />
                      <span className="truncate">{o.point_b_address}</span>
                    </div>
                  </TableCell>
                  <TableCell>{customerName(o.customer_id)}</TableCell>
                  <TableCell>
                    {fmtNum(o.cargo_weight_kg)} кг / {fmtNum(o.cargo_volume_m3)} м³
                  </TableCell>
                  <TableCell><StatusBadge status={o.priority_level} /></TableCell>
                  <TableCell>{o.price_offer ? `${fmtNum(o.price_offer)} ₸` : "—"}</TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell>{fmtDate(o.created_at)}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Сменить статус"
                        onClick={() => { setStatusOrder(o); setStatusOpen(true); }}
                      >
                        <ArrowRightLeft />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Рекомендовать цену (AI)"
                        disabled={quickPrice.isPending}
                        onClick={() => quickPrice.mutate(o.id)}
                      >
                        {quickPrice.isPending && quickPrice.variables === o.id ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Calculator />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <OrderCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <OrderStatusDialog order={statusOrder} open={statusOpen} onOpenChange={setStatusOpen} />
      <OrderDetailDialog order={detailOrder} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}