import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  Building2,
  Send,
  Puzzle,
  MapPin,
  CloudSun,
  Map,
  History,
  BrainCircuit,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { to: "/admin", label: "Дашборд", icon: LayoutDashboard },
  { to: "/admin/orders", label: "Заказы", icon: Package },
  { to: "/admin/users", label: "Пользователи", icon: Users },
  { to: "/admin/drivers", label: "Водители", icon: Truck },
  { to: "/admin/customers", label: "Клиенты", icon: Building2 },
  { to: "/admin/offers", label: "Предложения", icon: Send },
  { to: "/admin/ltl", label: "LTL-группы", icon: Puzzle },
  { to: "/admin/tracking", label: "Трекинг", icon: MapPin },
  { to: "/admin/weather", label: "Погода", icon: CloudSun },
  { to: "/admin/settlements", label: "Нас. пункты", icon: Map },
  { to: "/admin/history", label: "История статусов", icon: History },
  { to: "/admin/ai", label: "AI-рекомендации", icon: BrainCircuit },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              isActive && "bg-accent text-foreground font-medium"
            )
          }
        >
          <Icon className="size-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 text-lg font-bold">
      <Truck className="size-5 text-primary" />
      Jetkiz
    </div>
  );
}

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    return () => root.classList.remove("dark");
  }, []);

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="border-b px-5 py-4">
          <Brand />
          <p className="text-xs text-muted-foreground">Freight Management + AI</p>
        </div>
        <NavList />
        <div className="border-t p-4 text-xs text-muted-foreground">
          API: {import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-card px-4 py-3 lg:hidden">
          <Brand />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Открыть меню"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu />
          </Button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent
          aria-describedby={undefined}
          className="left-0 top-0 h-full w-72 max-w-[85vw] translate-x-0 rounded-none p-0 data-[state=open]:animate-in data-[state=open]:slide-in-from-left data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=closed]:fade-out-0"
        >
          <DialogHeader className="flex-row items-center justify-between gap-2 border-b p-4">
            <div>
              <DialogTitle>
                <Brand />
              </DialogTitle>
              <p className="text-xs text-muted-foreground">Freight Management + AI</p>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" aria-label="Закрыть меню">
                <X />
              </Button>
            </DialogClose>
          </DialogHeader>
          <NavList onNavigate={() => setDrawerOpen(false)} />
          <div className="border-t p-4 text-xs text-muted-foreground">
            API: {import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}