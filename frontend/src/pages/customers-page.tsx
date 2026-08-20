import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { PageHeader, EmptyRow } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { apiClient } from "@/lib/apiClient";
import { axiosErrorHandler, shortId } from "@/lib/api";
import { useUsers } from "@/hooks/use-users";
import type { CustomerProfile } from "@/lib/types";

const customerSchema = z.object({
  user_id: z.string().optional(),
  company_name: z.string().max(255).optional(),
  settlement: z.string().min(1, "Населённый пункт обязателен").max(100),
  business_type: z.string().min(1, "Тип бизнеса обязателен").max(50),
});

type CustomerForm = z.infer<typeof customerSchema>;

function CustomerFormDialog({
  customer,
  open,
  onOpenChange,
}: {
  customer: CustomerProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const { data: allUsers } = useUsers();

  const form = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    values: customer
      ? {
          company_name: customer.company_name ?? "",
          settlement: customer.settlement,
          business_type: customer.business_type,
        }
      : { company_name: "", settlement: "", business_type: "" },
  });

  const mutation = useMutation({
    mutationFn: (data: CustomerForm) =>
      customer
        ? apiClient.updateCustomer(customer.id, {
            company_name: data.company_name || null,
            settlement: data.settlement,
            business_type: data.business_type,
          })
        : apiClient.createCustomer({
            user_id: data.user_id!,
            company_name: data.company_name || null,
            settlement: data.settlement,
            business_type: data.business_type,
          }),
    onSuccess: () => {
      toast.success(customer ? "Клиент обновлён" : "Клиент создан");
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{customer ? "Редактировать клиента" : "Новый клиент"}</DialogTitle>
          <DialogDescription>
            {customer ? `ID: ${customer.id}` : "У пользователя может быть только один профиль клиента"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          {!customer && (
            <div className="space-y-2">
              <Label>Пользователь (user_id) *</Label>
              <Select
                value={form.watch("user_id") || undefined}
                onValueChange={(v) => form.setValue("user_id", v, { shouldValidate: true })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите пользователя-клиента..." />
                </SelectTrigger>
                <SelectContent>
                  {allUsers?.filter((u) => u.role === "customer").map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name} ({u.phone})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.user_id && (
                <p className="text-xs text-destructive">{form.formState.errors.user_id.message}</p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label>Компания</Label>
            <Input placeholder="ТОО «...»" {...form.register("company_name")} />
          </div>
          <div className="space-y-2">
            <Label>Населённый пункт *</Label>
            <Input placeholder="Актау" {...form.register("settlement")} />
            {form.formState.errors.settlement && (
              <p className="text-xs text-destructive">{form.formState.errors.settlement.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Тип бизнеса *</Label>
            <Input placeholder="Торговля, производство..." {...form.register("business_type")} />
            {form.formState.errors.business_type && (
              <p className="text-xs text-destructive">{form.formState.errors.business_type.message}</p>
            )}
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

export function CustomersPage() {
  const qc = useQueryClient();
  const { data: users } = useUsers();
  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: apiClient.customers,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerProfile | null>(null);

  const del = useMutation({
    mutationFn: (id: string) => apiClient.deleteCustomer(id),
    onSuccess: () => {
      toast.success("Клиент удалён");
      qc.invalidateQueries({ queryKey: ["customers"] });
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
        title="Клиенты"
        subtitle="Компании и отправители грузов"
        actions={
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus /> Новый клиент
          </Button>
        }
      />

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Компания</TableHead>
              <TableHead>Пользователь</TableHead>
              <TableHead>Нас. пункт</TableHead>
              <TableHead>Тип бизнеса</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <EmptyRow colSpan={6} text="Загрузка..." />
            ) : !customers?.length ? (
              <EmptyRow colSpan={6} text="Клиентов нет" />
            ) : (
              customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{shortId(c.id)}</TableCell>
                  <TableCell>{c.company_name || "—"}</TableCell>
                  <TableCell>{userName(c.user_id)}</TableCell>
                  <TableCell>{c.settlement}</TableCell>
                  <TableCell>{c.business_type}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(c); setDialogOpen(true); }}>
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={del.isPending}
                        onClick={() => {
                          if (confirm(`Удалить клиента ${c.company_name || c.settlement}?`)) del.mutate(c.id);
                        }}
                      >
                        {del.isPending && del.variables === c.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <CustomerFormDialog customer={editing} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}