import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/layout/site-layout";
import { AppLayout } from "@/components/layout/app-layout";
import { ModeProvider } from "@/lib/mode";
import { DeliveryProvider } from "@/lib/delivery/store";
import { NotFoundPage } from "@/pages/not-found-page";

const HomePage = lazy(() => import("@/pages/home-page").then((m) => ({ default: m.HomePage })));
const OrderNewPage = lazy(() => import("@/pages/order-new-page").then((m) => ({ default: m.OrderNewPage })));
const TrackPage = lazy(() => import("@/pages/track-page").then((m) => ({ default: m.TrackPage })));
const BoardPage = lazy(() => import("@/pages/board-page").then((m) => ({ default: m.BoardPage })));

const DashboardPage = lazy(() => import("@/pages/dashboard-page").then((m) => ({ default: m.DashboardPage })));
const OrdersPage = lazy(() => import("@/pages/orders-page").then((m) => ({ default: m.OrdersPage })));
const UsersPage = lazy(() => import("@/pages/users-page").then((m) => ({ default: m.UsersPage })));
const DriversPage = lazy(() => import("@/pages/drivers-page").then((m) => ({ default: m.DriversPage })));
const CustomersPage = lazy(() => import("@/pages/customers-page").then((m) => ({ default: m.CustomersPage })));
const OffersPage = lazy(() => import("@/pages/offers-page").then((m) => ({ default: m.OffersPage })));
const LtlGroupsPage = lazy(() => import("@/pages/ltl-groups-page").then((m) => ({ default: m.LtlGroupsPage })));
const TrackingPage = lazy(() => import("@/pages/tracking-page").then((m) => ({ default: m.TrackingPage })));
const WeatherPage = lazy(() => import("@/pages/weather-page").then((m) => ({ default: m.WeatherPage })));
const SettlementsPage = lazy(() => import("@/pages/settlements-page").then((m) => ({ default: m.SettlementsPage })));
const HistoryPage = lazy(() => import("@/pages/history-page").then((m) => ({ default: m.HistoryPage })));
const AiPage = lazy(() => import("@/pages/ai-page").then((m) => ({ default: m.AiPage })));

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
      <Loader2 className="size-6 animate-spin" />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <SiteLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "order/new", element: <OrderNewPage /> },
      { path: "track", element: <TrackPage /> },
      { path: "track/:id", element: <TrackPage /> },
      { path: "board", element: <BoardPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  {
    path: "/admin",
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "users", element: <UsersPage /> },
      { path: "drivers", element: <DriversPage /> },
      { path: "customers", element: <CustomersPage /> },
      { path: "offers", element: <OffersPage /> },
      { path: "ltl", element: <LtlGroupsPage /> },
      { path: "tracking", element: <TrackingPage /> },
      { path: "weather", element: <WeatherPage /> },
      { path: "settlements", element: <SettlementsPage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "ai", element: <AiPage /> },
    ],
  },
]);

export function App() {
  return (
    <ModeProvider>
      <DeliveryProvider>
        <Suspense fallback={<PageFallback />}>
          <RouterProvider router={router} />
        </Suspense>
      </DeliveryProvider>
    </ModeProvider>
  );
}