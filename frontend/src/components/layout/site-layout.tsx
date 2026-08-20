import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useMode } from "@/lib/mode";
import { cn } from "@/lib/utils";

function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 64 64" className="size-8 shrink-0" aria-hidden>
        <rect width="64" height="64" rx="16" fill={light ? "#f6f3ec" : "#211d15"} />
        <path
          d="M15 40 L27 27 L35 35 L49 22"
          fill="none"
          stroke={light ? "#211d15" : "#f6f3ec"}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="49" cy="22" r="6.5" fill="#1f4fe0" stroke={light ? "#211d15" : "#f6f3ec"} strokeWidth="2.5" />
      </svg>
      <span className="leading-tight">
        <span className={cn("font-display block text-[17px] font-semibold tracking-tight", light ? "text-sand" : "text-ink")}>
          Jetkiz
        </span>
        <span className={cn("block text-[11px] font-medium", light ? "text-sand/60" : "text-muted-foreground")}>
          доставка по Мангистау
        </span>
      </span>
    </span>
  );
}

const NAV = [
  { to: "/#routes", label: "Куда везём" },
  { to: "/#how", label: "Как это работает" },
  { to: "/#tariffs", label: "Тарифы" },
  { to: "/board", label: "Водителям" },
];

function useScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const timer = window.setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        window.scrollTo({ top: 0 });
      }, 80);
      return () => window.clearTimeout(timer);
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);
}

function ModeRow({ compact = false }: { compact?: boolean }) {
  const { lite, setLite } = useMode();
  return (
    <div
      className={cn("flex items-center gap-2.5", compact ? "justify-between" : "")}
      title="Лёгкий режим: без карт и графиков — для слабого интернета"
    >
      <span className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
        <WifiOff className="size-4" aria-hidden />
        Слабый интернет
      </span>
      <Switch checked={lite} onCheckedChange={setLite} aria-label="Слабый интернет — лёгкий режим" />
    </div>
  );
}

export function SiteLayout({ children }: { children?: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { lite, setLite } = useMode();
  useScrollManager();

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-sand"
      >
        К содержанию
      </a>

      <header className="sticky top-0 z-50 border-b border-line bg-sand/90 backdrop-blur-md">
        <div className="container-site flex h-16 items-center justify-between gap-4">
          <Link to="/" aria-label="Jetkiz — на главную" className="shrink-0">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Основная навигация">
            {NAV.map((item) =>
              item.to.startsWith("/#") ? (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-full px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </Link>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "rounded-full px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                      isActive && "bg-muted text-foreground"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              )
            )}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden xl:block">
              <ModeRow />
            </div>
            <Link to="/track" className="hidden text-sm font-bold text-foreground transition-colors hover:text-caspi sm:block">
              Отследить заказ
            </Link>
            <Button asChild className="h-10 rounded-full px-5">
              <Link to="/order/new">Создать заявку</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Открыть меню"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
          </div>
        </div>

        {lite && (
          <div className="border-t border-line bg-paper">
            <div className="container-site flex flex-wrap items-center gap-x-4 gap-y-1.5 py-2.5">
              <WifiOff className="size-4 shrink-0 text-caspi" aria-hidden />
              <p className="min-w-0 flex-1 text-sm text-muted-foreground">
                Лёгкий режим включён: без карт и графиков, только текст и крупные кнопки. Хорошо работает
                на 2G/3G.
              </p>
              <button
                type="button"
                onClick={() => setLite(false)}
                className="text-sm font-bold text-caspi underline underline-offset-4"
              >
                Вернуть обычный вид
              </button>
            </div>
          </div>
        )}
      </header>

      <main id="main" className="flex-1">
        <Outlet />
        {children}
      </main>

      <footer className="mt-16 bg-ink text-sand">
        <div className="container-site grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:py-16">
          <div>
            <Logo light />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-sand/60">
              Грузовая доставка по Мангистауской области. Живая цена, попутные рейсы и отслеживание
              даже при слабом интернете.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-sand/50 uppercase">Сервис</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link className="font-semibold text-sand/85 hover:text-sand" to="/order/new">Создать заявку</Link></li>
              <li><Link className="font-semibold text-sand/85 hover:text-sand" to="/track">Отследить заказ</Link></li>
              <li><Link className="font-semibold text-sand/85 hover:text-sand" to="/board">Водителям</Link></li>
              <li><Link className="font-semibold text-sand/85 hover:text-sand" to="/#tariffs">Тарифы</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-sand/50 uppercase">Компания</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link className="font-semibold text-sand/85 hover:text-sand" to="/#how">Как это работает</Link></li>
              <li><Link className="font-semibold text-sand/85 hover:text-sand" to="/#faq">Частые вопросы</Link></li>
              <li><span className="text-sand/60">Поддержка: +7 700 000 00 00</span></li>
              <li><span className="text-sand/60">Актау, 4 мкр., офис 12</span></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-sand/50 uppercase">Связь</p>
            <p className="mt-4 text-sm leading-relaxed text-sand/60">
              Плохой интернет в степи? Включи лёгкий режим — заявки и статусы работают без карт и
              графики.
            </p>
            <div className="mt-4">
              <ModeRow />
            </div>
          </div>
        </div>
        <div className="border-t border-sand/10">
          <div className="container-site flex flex-wrap items-center justify-between gap-2 py-5 text-xs text-sand/50">
            <p>© 2026 Jetkiz · Доставка грузов по Мангистауской области</p>
            <p>Демо-режим: данные локальные, API подключается при доступности</p>
          </div>
        </div>
      </footer>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent
          aria-describedby={undefined}
          className="right-0 top-0 h-full w-80 max-w-[88vw] translate-x-0 rounded-none p-0 data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=closed]:fade-out-0"
        >
          <DialogHeader className="flex-row items-center justify-between gap-2 border-b p-4">
            <DialogTitle className="text-left">
              <Logo />
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" aria-label="Закрыть меню">
                <X />
              </Button>
            </DialogClose>
          </DialogHeader>
          <nav className="flex flex-col gap-1 p-4" aria-label="Мобильная навигация">
            <Button asChild variant="ghost" className="h-12 justify-start rounded-xl text-base font-bold" onClick={() => setMenuOpen(false)}>
              <Link to="/order/new">Создать заявку</Link>
            </Button>
            <Button asChild variant="ghost" className="h-12 justify-start rounded-xl text-base font-bold" onClick={() => setMenuOpen(false)}>
              <Link to="/track">Отследить заказ</Link>
            </Button>
            <Button asChild variant="ghost" className="h-12 justify-start rounded-xl text-base font-bold" onClick={() => setMenuOpen(false)}>
              <Link to="/board">Водителям</Link>
            </Button>
            <Button asChild variant="ghost" className="h-12 justify-start rounded-xl text-base font-bold" onClick={() => setMenuOpen(false)}>
              <Link to="/#tariffs">Тарифы</Link>
            </Button>
            <Button asChild variant="ghost" className="h-12 justify-start rounded-xl text-base font-bold" onClick={() => setMenuOpen(false)}>
              <Link to="/#how">Как это работает</Link>
            </Button>
          </nav>
          <div className="mt-auto border-t p-4">
            <ModeRow compact />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}