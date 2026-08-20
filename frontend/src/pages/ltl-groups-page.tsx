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
import { StatusBadge } from "@/components/status-badge";
import { apiClient } from "@/lib/apiClient";
import { axiosErrorHandler, shortId } from "@/lib/api";
import { fmtDate, fmtNum } from "@/lib/format";

const ltlSchema = z.object({
  point_a_cluster_lat: z.coerce.number().positive(),
  point_a_cluster_lng: z.coerce.number().positive(),
  point_b_cluster_lat: z.coerce.number().positive(),
  point_b_cluster_lng: z.coerce.number().positive(),
});

type LtlForm = z.infer<typeof ltlSchema>;

export function LtlGroupsPage() {
  const qc = useQueryClient();
  const { data: groups, isLoading } = useQuery({
    queryKey: ["ltl-groups"],
    queryFn: apiClient.ltlGroups,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const form = useForm<LtlForm>({ resolver: zodResolver(ltlSchema) });

  const create = useMutation({
    mutationFn: (d: LtlForm) =>
      apiClient.createLtlGroup({
        point_a_cluster_lat: Number(d.point_a_cluster_lat),
        point_a_cluster_lng: Number(d.point_a_cluster_lng),
        point_b_cluster_lat: Number(d.point_b_cluster_lat),
        point_b_cluster_lng: Number(d.point_b_cluster_lng),
      }),
    onSuccess: () => {
      toast.success("LTL-группа создана");
      setDialogOpen(false);
      form.reset();
      qc.invalidateQueries({ queryKey: ["ltl-groups"] });
    },
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  const del = useMutation({
    mutationFn: (id: string) => apiClient.deleteLtlGroup(id),
    onSuccess: () => {
      toast.success("Группа удалена");
      qc.invalidateQueries({ queryKey: ["ltl-groups"] });
    },
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="LTL-группы"
        subtitle="Консолидация сборных грузов (менее грузовика) — создаются AI-движком"
        actions={<Button onClick={() => setDialogOpen(true)}><Plus /> Новая группа</Button>}
      />

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Вес, кг</TableHead>
              <TableHead>Объём, м³</TableHead>
              <TableHead>Кластер A</TableHead>
              <TableHead>Кластер B</TableHead>
              <TableHead>Создана</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <EmptyRow colSpan={8} text="Загрузка..." />
            ) : !groups?.length ? (
              <EmptyRow colSpan={8} text="Групп нет. AI создаст их при консолидации заказов." />
            ) : (
              groups.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-mono text-xs">{shortId(g.id)}</TableCell>
                  <TableCell><StatusBadge status={g.status} /></TableCell>
                  <TableCell>{fmtNum(g.total_weight_kg)}</TableCell>
                  <TableCell>{fmtNum(g.total_volume_m3)}</TableCell>
                  <TableCell className="font-mono text-xs">{g.point_a_cluster_lat.toFixed(3)}, {g.point_a_cluster_lng.toFixed(3)}</TableCell>
                  <TableCell className="font-mono text-xs">{g.point_b_cluster_lat.toFixed(3)}, {g.point_b_cluster_lng.toFixed(3)}</TableCell>
                  <TableCell>{fmtDate(g.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={del.isPending}
                      onClick={() => {
                        if (confirm("Удалить LTL-группу?")) del.mutate(g.id);
                      }}
                    >
                      {del.isPending && del.variables === g.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
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
            <DialogTitle>Новая LTL-группа</DialogTitle>
            <DialogDescription>Кластеры точек отправки и назначения</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Широта A *</Label>
              <Input type="number" step="any" {...form.register("point_a_cluster_lat")} />
            </div>
            <div className="space-y-2">
              <Label>Долгота A *</Label>
              <Input type="number" step="any" {...form.register("point_a_cluster_lng")} />
            </div>
            <div className="space-y-2">
              <Label>Широта B *</Label>
              <Input type="number" step="any" {...form.register("point_b_cluster_lat")} />
            </div>
            <div className="space-y-2">
              <Label>Долгота B *</Label>
              <Input type="number" step="any" {...form.register("point_b_cluster_lng")} />
            </div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Сохранение..." : "Создать"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}