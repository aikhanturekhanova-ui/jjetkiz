import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/driver/dashboard", label: "Дашборд", icon: "LayoutDashboard" },
  { to: "/driver/jobs", label: "Заявки", icon: "PackageSearch" },
  { to: "/driver/active-trip", label: "Активный рейс", icon: "Navigation" },
  { to: "/driver/backhaul", label: "Обратный груз", icon: "Repeat" },
  { to: "/driver/history", label: "История", icon: "History" },
  { to: "/driver/profile", label: "Профиль", icon: "UserRound" },
];

export function DriverNav() {
  return (
    <nav aria-label="Навигация водителя" className="-mx-1 mt-6 flex gap-1 overflow-x-hidden pb-1">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "flex shrink-0 items-center gap-1 rounded-full px-1 py-1 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              isActive && "bg-ink text-sand hover:bg-ink hover:text-sand"
            )
          }
        >
          <span className="size-4" aria-hidden />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}