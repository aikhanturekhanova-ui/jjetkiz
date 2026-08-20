import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { PageHeader, EmptyRow } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { apiClient } from "@/lib/apiClient";
import { axiosErrorHandler, shortId } from "@/lib/api";
import { useUsers } from "@/hooks/use-users";
import { fmtDate } from "@/lib/format";
import { PROFILE_STATUSES, USER_ROLES, type User } from "@/lib/types";

const userSchema = z.object({
  phone: z.string().min(1, "Телефон обязателен").max(20),
  full_name: z.string().min(1, "ФИО обязательно").max(255),
  role: z.enum(USER_ROLES),
  profile_status: z.enum(PROFILE_STATUSES),
  is_active: z.boolean(),
});

type UserForm = z.infer<typeof userSchema>;

function UserFormDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const form = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    values: user
      ? {
          phone: user.phone,
          full_name: user.full_name,
          role: user.role as UserForm["role"],
          profile_status: user.profile_status as UserForm["profile_status"],
          is_active: user.is_active,
        }
      : { phone: "", full_name: "", role: "customer", profile_status: "incomplete", is_active: true },
  });

  const mutation = useMutation({
    mutationFn: (data: UserForm) =>
      user ? apiClient.updateUser(user.id, data) : apiClient.createUser(data),
    onSuccess: () => {
      toast.success(user ? "Пользователь обновлён" : "Пользователь создан");
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? "Редактировать пользователя" : "Новый пользователь"}</DialogTitle>
          <DialogDescription>{user ? `ID: ${user.id}` : "Телефон должен быть уникальным"}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="space-y-2">
            <Label>Телефон *</Label>
            <Input placeholder="+7 700 000 00 00" {...form.register("phone")} />
            {form.formState.errors.phone && (
              <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>ФИО *</Label>
            <Input placeholder="Иванов Иван" {...form.register("full_name")} />
            {form.formState.errors.full_name && (
              <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Роль</Label>
              <Select
                value={form.watch("role")}
                onValueChange={(v) => form.setValue("role", v as UserForm["role"])}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Статус профиля</Label>
              <Select
                value={form.watch("profile_status")}
                onValueChange={(v) => form.setValue("profile_status", v as UserForm["profile_status"])}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROFILE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.watch("is_active")}
              onCheckedChange={(v) => form.setValue("is_active", v === true)}
            />
            Пользователь активен
          </label>
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

export function UsersPage() {
  const qc = useQueryClient();
  const { data: users, isLoading } = useUsers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const del = useMutation({
    mutationFn: (id: string) => apiClient.deleteUser(id),
    onSuccess: () => {
      toast.success("Пользователь удалён");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e) => toast.error(axiosErrorHandler(e)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Пользователи"
        subtitle="Водители, клиенты и администраторы платформы"
        actions={
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus /> Новый пользователь
          </Button>
        }
      />

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>ФИО</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Профиль</TableHead>
              <TableHead>Активен</TableHead>
              <TableHead>Создан</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <EmptyRow colSpan={8} text="Загрузка..." />
            ) : !users?.length ? (
              <EmptyRow colSpan={8} text="Пользователей нет" />
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-xs">{shortId(u.id)}</TableCell>
                  <TableCell>{u.phone}</TableCell>
                  <TableCell>{u.full_name}</TableCell>
                  <TableCell><StatusBadge status={u.role} /></TableCell>
                  <TableCell><StatusBadge status={u.profile_status} /></TableCell>
                  <TableCell>{u.is_active ? "✅" : "❌"}</TableCell>
                  <TableCell>{fmtDate(u.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditing(u); setDialogOpen(true); }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={del.isPending}
                        onClick={() => {
                          if (confirm(`Удалить пользователя ${u.full_name}?`)) del.mutate(u.id);
                        }}
                      >
                        {del.isPending && del.variables === u.id ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Trash2 />
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

      <UserFormDialog user={editing} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}