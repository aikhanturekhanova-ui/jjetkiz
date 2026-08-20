import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { PageHeader, EmptyRow } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { apiClient } from "@/lib/apiClient";
import { shortId } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import { Search } from "lucide-react";

export function HistoryPage() {
  const [orderFilter, setOrderFilter] = useState("");
  const [applied, setApplied] = useState("");

  const { data: history, isLoading } = useQuery({
    queryKey: ["order-history", applied],
    queryFn: () => apiClient.orderHistory(applied || undefined),
  });

  const sorted = history ? [...history].reverse() : [];

  return (
    <div className="space-y-6">
      <PageHeader title="История статусов" subtitle="Журнал смены статусов заказов" />

      <div className="flex gap-2">
        <Input
          placeholder="ID заказа (UUID)"
          className="max-w-sm"
          value={orderFilter}
          onChange={(e) => setOrderFilter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setApplied(orderFilter.trim())}
        />
        <Button variant="outline" onClick={() => setApplied(orderFilter.trim())}>
          <Search /> Показать
        </Button>
        {applied && (
          <Button variant="ghost" onClick={() => { setOrderFilter(""); setApplied(""); }}>
            Сбросить
          </Button>
        )}
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Заказ</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Кто изменил</TableHead>
              <TableHead>Когда</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <EmptyRow colSpan={5} text="Загрузка..." />
            ) : !sorted.length ? (
              <EmptyRow colSpan={5} text="Истории нет" />
            ) : (
              sorted.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-mono text-xs">{shortId(h.id)}</TableCell>
                  <TableCell className="font-mono text-xs">{shortId(h.order_id)}</TableCell>
                  <TableCell><StatusBadge status={h.status} /></TableCell>
                  <TableCell className="font-mono text-xs">
                    {h.changed_by_user_id ? shortId(h.changed_by_user_id) : "—"}
                  </TableCell>
                  <TableCell>{fmtDate(h.changed_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}