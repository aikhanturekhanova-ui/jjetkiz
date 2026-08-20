import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogIn, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { axiosErrorHandler } from "@/lib/api";
import { useMode } from "@/lib/mode";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { lite } = useMode();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? "/board";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!phone.trim() || !password) {
      setError("Нужен и номер телефона, и пароль — без них не пущу.");
      return;
    }
    setBusy(true);
    try {
      const user = await login(phone.trim(), password);
      toast.success(`Вошли, ${user.full_name}. Давай перевозить!`);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = axiosErrorHandler(err);
      setError(
        /Неверный номер или пароль/i.test(msg)
          ? "Номер или пароль не подходят. Проверь и попробуй ещё раз."
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
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Войти в Jetkiz</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Здесь я вижу свои заявки, активные рейсы и историю. Один вход — и весь груз под контролем.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 rounded-2xl border bg-paper p-6 shadow-sm sm:p-8" noValidate>
        <div className="space-y-5">
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
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
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
            <LogIn className="size-4" aria-hidden />
            {busy ? "Вхожу…" : "Войти"}
          </Button>
        </div>
      </form>

      <div className="mt-6 space-y-3 text-center text-sm">
        <p className="text-muted-foreground">
          Нет аккаунта?{" "}
          <Link to="/register" className="font-bold text-caspi underline underline-offset-4 hover:text-foreground">
            Зарегистрируйся за минуту
          </Link>
        </p>
        <p className="text-muted-foreground">
          Или{" "}
          <button
            type="button"
            onClick={() => navigate("/board")}
            className="inline-flex items-center gap-1.5 font-bold text-ink underline underline-offset-4 hover:text-caspi"
          >
            <UserRound className="size-3.5" aria-hidden />
            войти как гость
          </button>{" "}
          — демо работает и без входа.
        </p>
      </div>
    </div>
  );
}