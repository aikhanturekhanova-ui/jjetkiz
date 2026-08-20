import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Loader2, RefreshCcw, AlertTriangle } from "lucide-react";
import { PageHeader, EmptyRow } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { JsonView } from "@/components/json-view";
import { apiClient } from "@/lib/apiClient";
import { axiosErrorHandler, shortId } from "@/lib/api";
import { useUsers } from "@/hooks/use-users";
import { fmtDate } from "@/lib/format";

const pointSchema = z.object({
  driver_id: z.string().min(1, "Выберите водителя"),
  order_id: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90, "Широта от -90 до 90"),
  lng: z.coerce.number().min(-180).max(180, "Долгота от -180 до 180"),
});

type PointForm = z.infer<typeof pointSchema>;

export function TrackingPage() {
  const qc = useQueryClient();
  const { data: users } = useUsers();
  const { data: points, isLoading } = useQuery({
    queryKey: ["tracking-points"],
    queryFn: apiClient.trackingPoints,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiResult, setAiResult] = useState<{ title: string; data: unknown } | null>(null);
  const form = useForm<PointForm>({ resolver: zodResolver(pointSchema) });

  const create = useMutation({
    mutationFn: (d: PointForm) =>
      apiClient.createTrackingPoint({
        driver_id: d.driver_id,
        ...(d.order_id ? { order_id: d.order_id } : {}),
        lat: Number(d.lat),
        lng: Number(d.lng),
      }),
    onSuccess: () => {
      toast.success("Точка сохранена");
      setDialogOpen(false);
      form.reset();
      qc.invalidateQueries({ queryKey: ["tracking-points"] });
    },
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  const sync = useMutation({
    mutationFn: apiClient.trackingSync,
    onSuccess: (data) => setAiResult({ title: "🔄 Результат синхронизации", data }),
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  const gaps = useMutation({
    mutationFn: apiClient.trackingGaps,
    onSuccess: (data) => setAiResult({ title: "⚠️ Провалы оффлайн-трекинга", data }),
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  const driverName = (id: string) => {
    const u = users?.find((x) => x.id === id);
    return u ? `${u.full_name} (${u.phone})` : shortId(id);
  };

  const sorted = points ? [...points].reverse() : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Трекинг"
        subtitle="GPS-точки водителей с оффлайн-синхронизацией"
        actions={
          <>
            <Button variant="outline" onClick={() => sync.mutate()}>
              {sync.isPending ? <Loader2 className="animate-spin" /> : <RefreshCcw />}
              Синхронизация
            </Button>
            <Button variant="outline" onClick={() => gaps.mutate()}>
              {gaps.isPending ? <Loader2 className="animate-spin" /> : <AlertTriangle />}
              Провалы GPS
            </Button>
            <Button onClick={() => setDialogOpen(true)}><Plus /> Точка</Button>
          </>
        }
      />

      {aiResult && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-primary">{aiResult.title}</div>
          <JsonView data={aiResult.data} />
        </div>
      )}

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Водитель</TableHead>
              <TableHead>Заказ</TableHead>
              <TableHead>Координаты</TableHead>
              <TableHead>На устройстве</TableHead>
              <TableHead>Получено сервером</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <EmptyRow colSpan={6} text="Загрузка..." />
            ) : !sorted.length ? (
              <EmptyRow colSpan={6} text="Точек нет" />
            ) : (
              sorted.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{shortId(p.id)}</TableCell>
                  <TableCell>{driverName(p.driver_id)}</TableCell>
                  <TableCell className="font-mono text-xs">{p.order_id ? shortId(p.order_id) : "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{p.lat.toFixed(5)}, {p.lng.toFixed(5)}</TableCell>
                  <TableCell>{fmtDate(p.recorded_at_device)}</TableCell>
                  <TableCell>{fmtDate(p.received_at_server)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новая точка трекинга</DialogTitle>
            <DialogDescription>Координаты фиксируются на устройстве и синхронизируются с сервером</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="space-y-4">
            <div className="space-y-2">
              <Label>Водитель (driver_id) *</Label>
              <Select
                value={form.watch("driver_id") || undefined}
                onValueChange={(v) => form.setValue("driver_id", v, { shouldValidate: true })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите водителя..." />
                </SelectTrigger>
                <SelectContent>
                  {users?.filter((u) => u.role === "driver").map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name} ({u.phone})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.driver_id && (
                <p className="text-xs text-destructive">{form.formState.errors.driver_id.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Заказ (order_id)</Label>
              <Input placeholder="UUID заказа (необязательно)" {...form.register("order_id")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Широта *</Label>
                <Input type="number" step="any" placeholder="43.65" {...form.register("lat")} />
                {form.formState.errors.lat && (
                  <p className="text-xs text-destructive">{form.formState.errors.lat.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Долгота *</Label>
                <Input type="number" step="any" placeholder="51.15" {...form.register("lng")} />
                {form.formState.errors.lng && (
                  <p className="text-xs text-destructive">{form.formState.errors.lng.message}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}