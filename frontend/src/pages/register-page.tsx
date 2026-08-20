import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { axiosErrorHandler } from "@/lib/api";
import { useMode } from "@/lib/mode";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { lite } = useMode();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim() || !phone.trim() || !password) {
      setError("Заполни имя, номер и пароль — без них аккаунт не создам.");
      return;
    }
    if (password.length < 4) {
      setError("Пароль слишком короткий — минимум 4 символа.");
      return;
    }
    setBusy(true);
    try {
      const user = await register(fullName.trim(), phone.trim(), password);
      toast.success(`Аккаунт создан. Добро пожаловать, ${user.full_name}!`);
      navigate("/board", { replace: true });
    } catch (err) {
      const msg = axiosErrorHandler(err);
      setError(
        /уже зарегистрирован/i.test(msg)
          ? "Этот номер уже зарегистрирован. Зайди через форму входа."
          : /Network|network|ERR_NETWORK|Недоступен|недоступ/i.test(msg)
            ? "Сервис сейчас недоступен — проверь, запущен ли бэкенд (python main.py)."
            : msg
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-site flex max-w-md flex-col py-12 sm:py-20">
      <p className="text-xs font-bold tracking-[0.2em] text-caspi uppercase">Личный кабинет</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Создать аккаунт</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Минута на регистрацию — и я смогу создавать заявки, следить за машиной и копить историю перевозок.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 rounded-2xl border bg-paper p-6 shadow-sm sm:p-8" noValidate>
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Как тебя зовут</Label>
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="Айхан"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={lite ? "h-12 text-base" : "h-11"}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Номер телефона</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+7 700 000 00 00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={lite ? "h-12 text-base" : "h-11"}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Минимум 4 символа"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={lite ? "h-12 text-base" : "h-11"}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" disabled={busy} className="h-12 w-full rounded-full text-base">
            <UserPlus className="size-4" aria-hidden />
            {busy ? "Создаю…" : "Создать аккаунт"}
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{" "}
        <Link to="/login" className="font-bold text-caspi underline underline-offset-4 hover:text-foreground">
          Войди
        </Link>
      </p>
    </div>
  );
}