import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Loader2, Check, X } from "lucide-react";
import { PageHeader, EmptyRow } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { apiClient } from "@/lib/apiClient";
import { axiosErrorHandler, shortId } from "@/lib/api";
import { useUsers } from "@/hooks/use-users";
import { fmtDate } from "@/lib/format";

const offerSchema = z
  .object({
    order_id: z.string().optional(),
    ltl_group_id: z.string().optional(),
    driver_id: z.string().min(1, "Выберите водителя"),
  })
  .refine((d) => !!d.order_id !== !!d.ltl_group_id, {
    message: "Укажите ровно одно: order_id ИЛИ ltl_group_id",
    path: ["order_id"],
  });

type OfferForm = z.infer<typeof offerSchema>;

export function OffersPage() {
  const qc = useQueryClient();
  const { data: users } = useUsers();
  const { data: offers, isLoading } = useQuery({
    queryKey: ["offers"],
    queryFn: apiClient.offers,
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<OfferForm>({ resolver: zodResolver(offerSchema) });

  const create = useMutation({
    mutationFn: (data: OfferForm) =>
      apiClient.createOffer({
        driver_id: data.driver_id,
        ...(data.order_id ? { order_id: data.order_id } : { ltl_group_id: data.ltl_group_id }),
      }),
    onSuccess: () => {
      toast.success("Предложение отправлено");
      setDialogOpen(false);
      form.reset();
      qc.invalidateQueries({ queryKey: ["offers"] });
    },
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  const respond = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.updateOffer(id, { status }),
    onSuccess: (_d, v) => {
      toast.success(`Предложение: ${v.status}`);
      qc.invalidateQueries({ queryKey: ["offers"] });
    },
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  const driverName = (id: string) => {
    const u = users?.find((x) => x.id === id);
    return u ? `${u.full_name} (${u.phone})` : shortId(id);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Предложения водителям"
        subtitle="Офферы на заказы и LTL-группы"
        actions={<Button onClick={() => setDialogOpen(true)}><Plus /> Новое предложение</Button>}
      />

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Заказ</TableHead>
              <TableHead>LTL-группа</TableHead>
              <TableHead>Водитель</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Отправлено</TableHead>
              <TableHead>Ответ</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <EmptyRow colSpan={8} text="Загрузка..." />
            ) : !offers?.length ? (
              <EmptyRow colSpan={8} text="Предложений нет" />
            ) : (
              offers.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{shortId(o.id)}</TableCell>
                  <TableCell className="font-mono text-xs">{o.order_id ? shortId(o.order_id) : "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{o.ltl_group_id ? shortId(o.ltl_group_id) : "—"}</TableCell>
                  <TableCell>{driverName(o.driver_id)}</TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell>{fmtDate(o.sent_at)}</TableCell>
                  <TableCell>{fmtDate(o.responded_at)}</TableCell>
                  <TableCell className="text-right">
                    {(o.status === "sent" || o.status === "expired") && (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Принять"
                          disabled={respond.isPending}
                          onClick={() => respond.mutate({ id: o.id, status: "accepted" })}
                        >
                          {respond.isPending && respond.variables?.id === o.id ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <Check className="text-emerald-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Отклонить"
                          disabled={respond.isPending}
                          onClick={() => respond.mutate({ id: o.id, status: "declined" })}
                        >
                          <X className="text-destructive" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новое предложение</DialogTitle>
            <DialogDescription>Связывает водителя с заказом или LTL-группой (ровно одно).</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="space-y-4">
            <div className="space-y-2">
              <Label>Заказ (order_id) или LTL-группа (ltl_group_id)</Label>
              <Input placeholder="UUID заказа" {...form.register("order_id")} />
              <Input placeholder="UUID LTL-группы" {...form.register("ltl_group_id")} />
              {form.formState.errors.order_id && (
                <p className="text-xs text-destructive">{form.formState.errors.order_id.message}</p>
              )}
            </div>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Отправка..." : "Отправить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}