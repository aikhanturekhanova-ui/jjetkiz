import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { apiClient } from "@/lib/apiClient";
import { axiosErrorHandler } from "@/lib/api";
import { useUsersByRole } from "@/hooks/use-users";
import { PACKAGING_QUALITIES, PRIORITY_LEVELS } from "@/lib/types";

const orderSchema = z.object({
  customer_id: z.string().min(1, "Выберите клиента"),
  point_a_address: z.string().min(1, "Укажите адрес отправки"),
  point_a_lat: z.coerce.number().positive("Широта должна быть > 0"),
  point_a_lng: z.coerce.number().positive("Долгота должна быть > 0"),
  point_b_address: z.string().min(1, "Укажите адрес назначения"),
  point_b_lat: z.coerce.number().positive("Широта должна быть > 0"),
  point_b_lng: z.coerce.number().positive("Долгота должна быть > 0"),
  cargo_weight_kg: z.coerce.number().positive("Вес должен быть > 0"),
  cargo_volume_m3: z.coerce.number().positive("Объём должен быть > 0"),
  priority_level: z.enum(PRIORITY_LEVELS),
  packaging_quality: z.string().optional(),
  cargo_description: z.string().optional(),
  price_offer: z.coerce.number().positive().optional(),
  estimated_delivery_minutes: z.coerce.number().positive().optional(),
  requested_pickup_time: z.string().optional(),
  is_perishable: z.boolean(),
  is_fragile: z.boolean(),
  is_social_priority: z.boolean(),
});

type OrderForm = z.infer<typeof orderSchema>;

export function OrderCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const { data: customers, isLoading: loadingUsers } = useUsersByRole("customer");

  const form = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer_id: "",
      point_a_address: "",
      point_a_lat: undefined,
      point_a_lng: undefined,
      point_b_address: "",
      point_b_lat: undefined,
      point_b_lng: undefined,
      cargo_weight_kg: undefined,
      cargo_volume_m3: undefined,
      priority_level: "normal",
      packaging_quality: undefined,
      cargo_description: "",
      price_offer: undefined,
      estimated_delivery_minutes: undefined,
      requested_pickup_time: "",
      is_perishable: false,
      is_fragile: false,
      is_social_priority: false,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: OrderForm) =>
      apiClient.createOrder({
        ...data,
        point_a_lat: Number(data.point_a_lat),
        point_a_lng: Number(data.point_a_lng),
        point_b_lat: Number(data.point_b_lat),
        point_b_lng: Number(data.point_b_lng),
        cargo_weight_kg: Number(data.cargo_weight_kg),
        cargo_volume_m3: Number(data.cargo_volume_m3),
        packaging_quality: data.packaging_quality || null,
        cargo_description: data.cargo_description || null,
        price_offer: data.price_offer ? Number(data.price_offer) : null,
        estimated_delivery_minutes: data.estimated_delivery_minutes
          ? Number(data.estimated_delivery_minutes)
          : null,
        requested_pickup_time: data.requested_pickup_time || null,
      }),
    onSuccess: () => {
      toast.success("Заказ создан");
      form.reset();
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Новый заказ</DialogTitle>
          <DialogDescription>
            Грузоперевозка по Мангистауской области. После создания запустите AI-события со страницы «AI-рекомендации».
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((d) => mutation.mutate(d))}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="space-y-2 sm:col-span-2">
            <Label>Клиент (customer_id) *</Label>
            <Select
              value={form.watch("customer_id") || undefined}
              onValueChange={(v) => form.setValue("customer_id", v, { shouldValidate: true })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loadingUsers ? "Загрузка клиентов..." : "Выберите пользователя-клиента..."} />
              </SelectTrigger>
              <SelectContent>
                {(customers ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.full_name} ({c.phone})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.customer_id && (
              <p className="text-xs text-destructive">{form.formState.errors.customer_id.message}</p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Адрес отправки (A) *</Label>
            <Input placeholder="г. Актау, ул. ..." {...form.register("point_a_address")} />
            {form.formState.errors.point_a_address && (
              <p className="text-xs text-destructive">{form.formState.errors.point_a_address.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Широта A *</Label>
            <Input type="number" step="any" placeholder="43.65" {...form.register("point_a_lat")} />
            {form.formState.errors.point_a_lat && (
              <p className="text-xs text-destructive">{form.formState.errors.point_a_lat.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Долгота A *</Label>
            <Input type="number" step="any" placeholder="51.15" {...form.register("point_a_lng")} />
            {form.formState.errors.point_a_lng && (
              <p className="text-xs text-destructive">{form.formState.errors.point_a_lng.message}</p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Адрес назначения (B) *</Label>
            <Input placeholder="г. Жанаозен, ул. ..." {...form.register("point_b_address")} />
            {form.formState.errors.point_b_address && (
              <p className="text-xs text-destructive">{form.formState.errors.point_b_address.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Широта B *</Label>
            <Input type="number" step="any" placeholder="43.34" {...form.register("point_b_lat")} />
            {form.formState.errors.point_b_lat && (
              <p className="text-xs text-destructive">{form.formState.errors.point_b_lat.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Долгота B *</Label>
            <Input type="number" step="any" placeholder="52.86" {...form.register("point_b_lng")} />
            {form.formState.errors.point_b_lng && (
              <p className="text-xs text-destructive">{form.formState.errors.point_b_lng.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Вес груза, кг *</Label>
            <Input type="number" step="any" min="0.01" placeholder="500" {...form.register("cargo_weight_kg")} />
            {form.formState.errors.cargo_weight_kg && (
              <p className="text-xs text-destructive">{form.formState.errors.cargo_weight_kg.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Объём, м³ *</Label>
            <Input type="number" step="any" min="0.01" placeholder="3.5" {...form.register("cargo_volume_m3")} />
            {form.formState.errors.cargo_volume_m3 && (
              <p className="text-xs text-destructive">{form.formState.errors.cargo_volume_m3.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Приоритет</Label>
            <Select
              value={form.watch("priority_level")}
              onValueChange={(v) => form.setValue("priority_level", v as OrderForm["priority_level"])}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_LEVELS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Качество упаковки</Label>
            <Select
              value={form.watch("packaging_quality") || undefined}
              onValueChange={(v) => form.setValue("packaging_quality", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {PACKAGING_QUALITIES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Описание груза</Label>
            <Input placeholder="Хрупкий груз, электроника..." {...form.register("cargo_description")} />
          </div>
          <div className="space-y-2">
            <Label>Цена предложения, ₸</Label>
            <Input type="number" step="any" min="0.01" placeholder="45000" {...form.register("price_offer")} />
          </div>
          <div className="space-y-2">
            <Label>Оценка доставки, мин</Label>
            <Input type="number" step="any" min="1" placeholder="180" {...form.register("estimated_delivery_minutes")} />
          </div>
          <div className="space-y-2">
            <Label>Время забора</Label>
            <Input type="datetime-local" {...form.register("requested_pickup_time")} />
          </div>

          <div className="flex flex-wrap items-end gap-4 pb-1">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.watch("is_perishable")}
                onCheckedChange={(v) => form.setValue("is_perishable", v === true)}
              />
              Скоропортящийся
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.watch("is_fragile")}
                onCheckedChange={(v) => form.setValue("is_fragile", v === true)}
              />
              Хрупкий
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.watch("is_social_priority")}
                onCheckedChange={(v) => form.setValue("is_social_priority", v === true)}
              />
              Соц. приоритет
            </label>
          </div>

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Сохранение..." : "Создать заказ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}