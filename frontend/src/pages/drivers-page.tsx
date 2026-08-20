import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Repeat2 } from "lucide-react";
import { PageHeader, EmptyRow } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { JsonView } from "@/components/json-view";
import { StatusBadge } from "@/components/status-badge";
import { apiClient } from "@/lib/apiClient";
import { axiosErrorHandler, shortId } from "@/lib/api";
import { useUsers } from "@/hooks/use-users";
import { fmtNum } from "@/lib/format";
import { DRIVER_STATUSES, VEHICLE_TYPES, type DriverProfile } from "@/lib/types";

const driverSchema = z.object({
  user_id: z.string().min(1, "Выберите пользователя-водителя"),
  vehicle_brand: z.string().min(1, "Марка ТС обязательна").max(100),
  vehicle_plate_number: z.string().min(1, "Госномер обязателен").max(20),
  capacity_kg: z.coerce.number().positive("Грузоподъёмность > 0"),
  capacity_m3: z.coerce.number().positive("Объём > 0"),
  has_refrigerator: z.boolean(),
  vehicle_type: z.enum(VEHICLE_TYPES),
  is_verified: z.boolean(),
  current_status: z.enum(DRIVER_STATUSES),
});

type DriverForm = z.infer<typeof driverSchema>;

function DriverFormDialog({
  driver,
  open,
  onOpenChange,
}: {
  driver: DriverProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const { data: allUsers } = useUsers();

  const form = useForm<DriverForm>({
    resolver: zodResolver(driverSchema),
    values: driver
      ? {
          user_id: driver.user_id,
          vehicle_brand: driver.vehicle_brand,
          vehicle_plate_number: driver.vehicle_plate_number,
          capacity_kg: driver.capacity_kg,
          capacity_m3: driver.capacity_m3,
          has_refrigerator: driver.has_refrigerator,
          vehicle_type: driver.vehicle_type as DriverForm["vehicle_type"],
          is_verified: driver.is_verified,
          current_status: driver.current_status as DriverForm["current_status"],
        }
      : {
          user_id: "",
          vehicle_brand: "",
          vehicle_plate_number: "",
          capacity_kg: 0,
          capacity_m3: 0,
          has_refrigerator: false,
          vehicle_type: "tent",
          is_verified: false,
          current_status: "offline",
        },
  });

  const mutation = useMutation({
    mutationFn: (data: DriverForm) =>
      driver
        ? apiClient.updateDriver(driver.id, data)
        : apiClient.createDriver(data),
    onSuccess: () => {
      toast.success(driver ? "Водитель обновлён" : "Водитель создан");
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ["drivers"] });
    },
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{driver ? "Редактировать водителя" : "Новый водитель"}</DialogTitle>
          <DialogDescription>{driver ? `ID: ${driver.id}` : "Госномер должен быть уникальным"}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          {!driver && (
            <div className="space-y-2">
              <Label>Пользователь (user_id) *</Label>
              <Select
                value={form.watch("user_id") || undefined}
                onValueChange={(v) => form.setValue("user_id", v, { shouldValidate: true })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите пользователя-водителя..." />
                </SelectTrigger>
                <SelectContent>
                  {allUsers?.filter((u) => u.role === "driver").map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name} ({u.phone})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.user_id && (
                <p className="text-xs text-destructive">{form.formState.errors.user_id.message}</p>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Марка ТС *</Label>
              <Input placeholder="ГАЗель Next" {...form.register("vehicle_brand")} />
              {form.formState.errors.vehicle_brand && (
                <p className="text-xs text-destructive">{form.formState.errors.vehicle_brand.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Госномер *</Label>
              <Input placeholder="12A345BC" disabled={!!driver} {...form.register("vehicle_plate_number")} />
              {form.formState.errors.vehicle_plate_number && (
                <p className="text-xs text-destructive">{form.formState.errors.vehicle_plate_number.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Грузоподъёмность, кг *</Label>
              <Input type="number" min="1" step="any" {...form.register("capacity_kg")} />
              {form.formState.errors.capacity_kg && (
                <p className="text-xs text-destructive">{form.formState.errors.capacity_kg.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Объём кузова, м³ *</Label>
              <Input type="number" min="1" step="any" {...form.register("capacity_m3")} />
              {form.formState.errors.capacity_m3 && (
                <p className="text-xs text-destructive">{form.formState.errors.capacity_m3.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Тип ТС</Label>
              <Select
                value={form.watch("vehicle_type")}
                onValueChange={(v) => form.setValue("vehicle_type", v as DriverForm["vehicle_type"])}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select
                value={form.watch("current_status")}
                onValueChange={(v) => form.setValue("current_status", v as DriverForm["current_status"])}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DRIVER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-6 text-sm">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={form.watch("has_refrigerator")}
                onCheckedChange={(v) => form.setValue("has_refrigerator", v === true)}
              />
              Рефрижератор
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={form.watch("is_verified")}
                onCheckedChange={(v) => form.setValue("is_verified", v === true)}
              />
              Верифицирован
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DriversPage() {
  const qc = useQueryClient();
  const { data: users } = useUsers();
  const { data: drivers, isLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: apiClient.drivers,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DriverProfile | null>(null);
  const [backhaulResult, setBackhaulResult] = useState<{ driverId: string; data: unknown } | null>(null);

  const del = useMutation({
    mutationFn: (id: string) => apiClient.deleteDriver(id),
    onSuccess: () => {
      toast.success("Водитель удалён");
      qc.invalidateQueries({ queryKey: ["drivers"] });
    },
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  const backhaul = useMutation({
    mutationFn: (driverId: string) => apiClient.aiBackhaulFind(driverId),
    onSuccess: (data, driverId) => {
      toast.success("Обратные рейсы найдены");
      setBackhaulResult({ driverId, data });
    },
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  const userName = (id: string) => {
    const u = users?.find((x) => x.id === id);
    return u ? `${u.full_name} (${u.phone})` : shortId(id);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Водители"
        subtitle="Профили водителей, транспорт и статусы доступности"
        actions={
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus /> Новый водитель
          </Button>
        }
      />

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Водитель</TableHead>
              <TableHead>Транспорт</TableHead>
              <TableHead>Госномер</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Грузоподъёмность</TableHead>
              <TableHead>Реф.</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Рейтинг ✅/❌</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <EmptyRow colSpan={10} text="Загрузка..." />
            ) : !drivers?.length ? (
              <EmptyRow colSpan={10} text="Водителей нет" />
            ) : (
              drivers.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs">{shortId(d.id)}</TableCell>
                  <TableCell>{userName(d.user_id)}</TableCell>
                  <TableCell>{d.vehicle_brand}</TableCell>
                  <TableCell className="font-mono text-xs">{d.vehicle_plate_number}</TableCell>
                  <TableCell>{d.vehicle_type}</TableCell>
                  <TableCell>{fmtNum(d.capacity_kg)} кг / {fmtNum(d.capacity_m3)} м³</TableCell>
                  <TableCell>{d.has_refrigerator ? "✅" : "—"}</TableCell>
                  <TableCell><StatusBadge status={d.current_status} /></TableCell>
                  <TableCell>{d.rating_completed_trips} / {d.rating_failed_trips}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Обратные рейсы (AI)"
                        disabled={backhaul.isPending}
                        onClick={() => backhaul.mutate(d.id)}
                      >
                        {backhaul.isPending && backhaul.variables === d.id ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Repeat2 />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(d); setDialogOpen(true); }}>
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={del.isPending}
                        onClick={() => {
                          if (confirm(`Удалить водителя ${d.vehicle_plate_number}?`)) del.mutate(d.id);
                        }}
                      >
                        {del.isPending && del.variables === d.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {backhaulResult && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-primary">
            🔁 Обратные рейсы для водителя {shortId(backhaulResult.driverId)}
          </div>
          <JsonView data={backhaulResult.data} />
        </div>
      )}

      <DriverFormDialog driver={editing} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}