import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/layout/site-layout";
import { AppLayout } from "@/components/layout/app-layout";
import { ModeProvider } from "@/lib/mode";
import { DeliveryProvider } from "@/lib/delivery/store";
import { AuthProvider } from "@/lib/auth";
import { NotFoundPage } from "@/pages/not-found-page";

const HomePage = lazy(() => import("@/pages/home-page").then((m) => ({ default: m.HomePage })));
const OrderNewPage = lazy(() => import("@/pages/order-new-page").then((m) => ({ default: m.OrderNewPage })));
const TrackPage = lazy(() => import("@/pages/track-page").then((m) => ({ default: m.TrackPage })));
const BoardPage = lazy(() => import("@/pages/board-page").then((m) => ({ default: m.BoardPage })));
const LoginPage = lazy(() => import("@/pages/login-page"));
const RegisterPage = lazy(() => import("@/pages/register-page"));

const DriverDashboardPage = lazy(() => import("@/pages/driver-dashboard-page").then((m) => ({ default: m.DriverDashboardPage })));
const DriverJobsPage = lazy(() => import("@/pages/driver-jobs-page").then((m) => ({ default: m.DriverJobsPage })));
const DriverJobPage = lazy(() => import("@/pages/driver-job-page").then((m) => ({ default: m.DriverJobPage })));
const DriverTripPage = lazy(() => import("@/pages/driver-trip-page").then((m) => ({ default: m.DriverTripPage })));
const DriverBackhaulPage = lazy(() => import("@/pages/driver-backhaul-page").then((m) => ({ default: m.DriverBackhaulPage })));
const DriverTrackingPage = lazy(() => import("@/pages/driver-tracking-page").then((m) => ({ default: m.DriverTrackingPage })));
const DriverHistoryPage = lazy(() => import("@/pages/driver-history-page").then((m) => ({ default: m.DriverHistoryPage })));
const DriverProfilePage = lazy(() => import("@/pages/driver-profile-page").then((m) => ({ default: m.DriverProfilePage })));

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
const AdminRoutesPage = lazy(() => import("@/pages/admin-routes-page").then((m) => ({ default: m.AdminRoutesPage })));
const AdminAiInsightsPage = lazy(() => import("@/pages/admin-ai-insights-page").then((m) => ({ default: m.AdminAiInsightsPage })));

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
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      {
        path: "driver",
        children: [
          { index: true, element: <Navigate to="/driver/dashboard" replace /> },
          { path: "dashboard", element: <DriverDashboardPage /> },
          { path: "jobs", element: <DriverJobsPage /> },
          { path: "jobs/:id", element: <DriverJobPage /> },
          { path: "active-trip", element: <DriverTripPage /> },
          { path: "backhaul", element: <DriverBackhaulPage /> },
          { path: "tracking", element: <DriverTrackingPage /> },
          { path: "history", element: <DriverHistoryPage /> },
          { path: "profile", element: <DriverProfilePage /> },
        ],
      },
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
      { path: "routes", element: <AdminRoutesPage /> },
      { path: "ai-insights", element: <AdminAiInsightsPage /> },
      { path: "ai", element: <AiPage /> },
    ],
  },
]);

export function App() {
  return (
    <ModeProvider>
      <AuthProvider>
        <DeliveryProvider>
          <Suspense fallback={<PageFallback />}>
            <RouterProvider router={router} />
          </Suspense>
        </DeliveryProvider>
      </AuthProvider>
    </ModeProvider>
  );
}