import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Loader2, CloudSun } from "lucide-react";
import { PageHeader, EmptyRow } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { JsonView } from "@/components/json-view";
import { apiClient } from "@/lib/apiClient";
import { axiosErrorHandler, shortId } from "@/lib/api";
import { fmtDate } from "@/lib/format";

const weatherSchema = z.object({
  region_point_lat: z.coerce.number(),
  region_point_lng: z.coerce.number(),
  temperature_c: z.coerce.number(),
  wind_speed_ms: z.coerce.number().min(0),
  is_dust_storm_risk: z.boolean(),
});

type WeatherForm = z.infer<typeof weatherSchema>;

export function WeatherPage() {
  const qc = useQueryClient();
  const { data: snapshots, isLoading } = useQuery({
    queryKey: ["weather-snapshots"],
    queryFn: apiClient.weatherSnapshots,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiResult, setAiResult] = useState<{ title: string; data: unknown } | null>(null);
  const form = useForm<WeatherForm>({
    resolver: zodResolver(weatherSchema),
    defaultValues: { is_dust_storm_risk: false },
  });

  const create = useMutation({
    mutationFn: (d: WeatherForm) =>
      apiClient.createWeatherSnapshot({
        region_point_lat: Number(d.region_point_lat),
        region_point_lng: Number(d.region_point_lng),
        temperature_c: Number(d.temperature_c),
        wind_speed_ms: Number(d.wind_speed_ms),
        is_dust_storm_risk: d.is_dust_storm_risk,
      }),
    onSuccess: () => {
      toast.success("Снимок погоды сохранён");
      setDialogOpen(false);
      form.reset();
      qc.invalidateQueries({ queryKey: ["weather-snapshots"] });
    },
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  const analyze = useMutation({
    mutationFn: apiClient.weatherAnalyze,
    onSuccess: (data) => setAiResult({ title: "🤖 Оценка погодных рисков сети", data }),
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  const sorted = snapshots ? [...snapshots].reverse() : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Погода"
        subtitle="Снимки погоды по региону: температура, ветер, риски пылевых бурь"
        actions={
          <>
            <Button variant="outline" onClick={() => analyze.mutate()}>
              {analyze.isPending ? <Loader2 className="animate-spin" /> : <CloudSun />}
              AI-анализ рисков
            </Button>
            <Button onClick={() => setDialogOpen(true)}><Plus /> Снимок</Button>
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
              <TableHead>Регион (lat, lng)</TableHead>
              <TableHead>Температура</TableHead>
              <TableHead>Ветер</TableHead>
              <TableHead>Пылевая буря</TableHead>
              <TableHead>Снимок</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <EmptyRow colSpan={6} text="Загрузка..." />
            ) : !sorted.length ? (
              <EmptyRow colSpan={6} text="Снимков нет" />
            ) : (
              sorted.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{shortId(s.id)}</TableCell>
                  <TableCell className="font-mono text-xs">{s.region_point_lat.toFixed(3)}, {s.region_point_lng.toFixed(3)}</TableCell>
                  <TableCell>{s.temperature_c}°C</TableCell>
                  <TableCell>{s.wind_speed_ms} м/с</TableCell>
                  <TableCell>
                    {s.is_dust_storm_risk ? <Badge variant="destructive">⚠️ БУРЯ</Badge> : "—"}
                  </TableCell>
                  <TableCell>{fmtDate(s.fetched_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый снимок погоды</DialogTitle>
            <DialogDescription>Данные по точке региона (используются AI для оценки рисков)</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Широта региона *</Label>
              <Input type="number" step="any" placeholder="43.65" {...form.register("region_point_lat")} />
            </div>
            <div className="space-y-2">
              <Label>Долгота региона *</Label>
              <Input type="number" step="any" placeholder="51.15" {...form.register("region_point_lng")} />
            </div>
            <div className="space-y-2">
              <Label>Температура, °C *</Label>
              <Input type="number" step="any" placeholder="25" {...form.register("temperature_c")} />
            </div>
            <div className="space-y-2">
              <Label>Ветер, м/с *</Label>
              <Input type="number" step="any" min="0" placeholder="8" {...form.register("wind_speed_ms")} />
              {form.formState.errors.wind_speed_ms && (
                <p className="text-xs text-destructive">{form.formState.errors.wind_speed_ms.message}</p>
              )}
            </div>
            <label className="col-span-2 flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.watch("is_dust_storm_risk")}
                onCheckedChange={(v) => form.setValue("is_dust_storm_risk", v === true)}
              />
              Риск пылевой бури
            </label>
            <DialogFooter className="col-span-2">
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