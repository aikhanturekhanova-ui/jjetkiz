import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { PageHeader, EmptyRow } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { apiClient } from "@/lib/apiClient";
import { axiosErrorHandler, shortId } from "@/lib/api";

const settlementSchema = z.object({
  name: z.string().min(1, "Название обязательно").max(100),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
});

type SettlementForm = z.infer<typeof settlementSchema>;

export function SettlementsPage() {
  const qc = useQueryClient();
  const { data: settlements, isLoading } = useQuery({
    queryKey: ["settlements"],
    queryFn: apiClient.settlements,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const form = useForm<SettlementForm>({ resolver: zodResolver(settlementSchema) });

  const create = useMutation({
    mutationFn: (d: SettlementForm) =>
      apiClient.createSettlement({
        name: d.name,
        lat: Number(d.lat),
        lng: Number(d.lng),
      }),
    onSuccess: () => {
      toast.success("Населённый пункт добавлен");
      setDialogOpen(false);
      form.reset();
      qc.invalidateQueries({ queryKey: ["settlements"] });
    },
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  const del = useMutation({
    mutationFn: (id: string) => apiClient.deleteSettlement(id),
    onSuccess: () => {
      toast.success("Пункт удалён");
      qc.invalidateQueries({ queryKey: ["settlements"] });
    },
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Населённые пункты"
        subtitle="База пунктов Мангистауской области"
        actions={<Button onClick={() => setDialogOpen(true)}><Plus /> Населённый пункт</Button>}
      />

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Широта</TableHead>
              <TableHead>Долгота</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <EmptyRow colSpan={5} text="Загрузка..." />
            ) : !settlements?.length ? (
              <EmptyRow colSpan={5} text="Пунктов нет" />
            ) : (
              settlements.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{shortId(s.id)}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="font-mono text-xs">{s.lat}</TableCell>
                  <TableCell className="font-mono text-xs">{s.lng}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={del.isPending}
                      onClick={() => {
                        if (confirm(`Удалить пункт ${s.name}?`)) del.mutate(s.id);
                      }}
                    >
                      {del.isPending && del.variables === s.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                    </Button>
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
            <DialogTitle>Новый населённый пункт</DialogTitle>
            <DialogDescription>Используется для кластеризации маршрутов</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="space-y-4">
            <div className="space-y-2">
              <Label>Название *</Label>
              <Input placeholder="Актау" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Широта *</Label>
                <Input type="number" step="any" {...form.register("lat")} />
              </div>
              <div className="space-y-2">
                <Label>Долгота *</Label>
                <Input type="number" step="any" {...form.register("lng")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Сохранение..." : "Добавить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}