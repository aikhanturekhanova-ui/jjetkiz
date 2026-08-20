import { api } from "./api";
import type {
  AiHealth,
  AiInsights,
  AiResponse,
  CustomerProfile,
  DriverProfile,
  LtlGroup,
  Order,
  OrderOffer,
  OrderStatusHistory,
  Settlement,
  TrackingPoint,
  User,
  WeatherSnapshot,
} from "./types";

const qs = (params: Record<string, string | undefined>) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) s.set(k, v);
  }
  const str = s.toString();
  return str ? `?${str}` : "";
};

export const apiClient = {
  // health
  health: () => api.get<{ status: string }>("/health").then((r) => r.data),

  // users
  users: () => api.get<User[]>("/users/").then((r) => r.data),
  user: (id: string) => api.get<User>(`/users/${id}`).then((r) => r.data),
  createUser: (data: Partial<User> & { phone: string; full_name: string }) =>
    api.post<User>("/users/", data).then((r) => r.data),
  updateUser: (id: string, data: Partial<User>) =>
    api.put<User>(`/users/${id}`, data).then((r) => r.data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),

  // drivers
  drivers: () => api.get<DriverProfile[]>("/driver-profiles/").then((r) => r.data),
  createDriver: (data: Partial<DriverProfile> & { user_id: string; vehicle_plate_number: string }) =>
    api.post<DriverProfile>("/driver-profiles/", data).then((r) => r.data),
  updateDriver: (id: string, data: Partial<DriverProfile>) =>
    api.put<DriverProfile>(`/driver-profiles/${id}`, data).then((r) => r.data),
  deleteDriver: (id: string) => api.delete(`/driver-profiles/${id}`),

  // customers
  customers: () => api.get<CustomerProfile[]>("/customer-profiles/").then((r) => r.data),
  createCustomer: (data: Partial<CustomerProfile> & { user_id: string }) =>
    api.post<CustomerProfile>("/customer-profiles/", data).then((r) => r.data),
  updateCustomer: (id: string, data: Partial<CustomerProfile>) =>
    api.put<CustomerProfile>(`/customer-profiles/${id}`, data).then((r) => r.data),
  deleteCustomer: (id: string) => api.delete(`/customer-profiles/${id}`),

  // orders
  orders: (params?: { status?: string; customer_id?: string }) =>
    api.get<Order[]>(`/orders/${qs(params ?? {})}`).then((r) => r.data),
  order: (id: string) => api.get<Order>(`/orders/${id}`).then((r) => r.data),
  createOrder: (data: Record<string, unknown>) =>
    api.post<Order>("/orders/", data).then((r) => r.data),
  updateOrder: (id: string, data: Record<string, unknown>) =>
    api.put<Order>(`/orders/${id}`, data).then((r) => r.data),
  setOrderStatus: (id: string, status: string) =>
    api.put<Order>(`/orders/${id}/status`, null, { params: { new_status: status } }).then((r) => r.data),

  // offers
  offers: () => api.get<OrderOffer[]>("/order-offers/").then((r) => r.data),
  createOffer: (data: Record<string, unknown>) =>
    api.post<OrderOffer>("/order-offers/", data).then((r) => r.data),
  updateOffer: (id: string, data: Record<string, unknown>) =>
    api.put<OrderOffer>(`/order-offers/${id}`, data).then((r) => r.data),

  // ltl groups
  ltlGroups: () => api.get<LtlGroup[]>("/ltl-groups/").then((r) => r.data),
  createLtlGroup: (data: Record<string, unknown>) =>
    api.post<LtlGroup>("/ltl-groups/", data).then((r) => r.data),
  deleteLtlGroup: (id: string) => api.delete(`/ltl-groups/${id}`),

  // history
  orderHistory: (orderId?: string) =>
    api
      .get<OrderStatusHistory[]>(`/order-status-history/${qs({ order_id: orderId })}`)
      .then((r) => r.data),

  // tracking
  trackingPoints: () => api.get<TrackingPoint[]>("/tracking-points/").then((r) => r.data),
  createTrackingPoint: (data: Record<string, unknown>) =>
    api.post<TrackingPoint>("/tracking-points/", data).then((r) => r.data),
  trackingSync: () => api.post<AiResponse>("/tracking/sync").then((r) => r.data),
  trackingGaps: () => api.get<AiResponse>("/tracking/gaps").then((r) => r.data),

  // weather
  weatherSnapshots: () => api.get<WeatherSnapshot[]>("/weather-snapshots/").then((r) => r.data),
  createWeatherSnapshot: (data: Record<string, unknown>) =>
    api.post<WeatherSnapshot>("/weather-snapshots/", data).then((r) => r.data),
  weatherAnalyze: () => api.post<AiResponse>("/ai/weather/analyze").then((r) => r.data),

  // settlements
  settlements: () => api.get<Settlement[]>("/settlements/").then((r) => r.data),
  createSettlement: (data: Record<string, unknown>) =>
    api.post<Settlement>("/settlements/", data).then((r) => r.data),
  deleteSettlement: (id: string) => api.delete(`/settlements/${id}`),

  // ai
  aiHealth: () => api.get<AiHealth>("/ai/health").then((r) => r.data),
  aiInsights: () => api.get<AiInsights>("/ai/insights/dashboard").then((r) => r.data),
  aiPriceRecommend: (orderId: string) =>
    api.post<AiResponse>("/ai/pricing/recommend", orderId).then((r) => r.data),
  aiPriceAnalyze: (orderId: string) =>
    api.post<AiResponse>(`/ai/pricing/analyze/${orderId}`).then((r) => r.data),
  aiPriceRecalculate: () =>
    api.post<AiResponse>("/ai/pricing/recalculate").then((r) => r.data),
  aiConsolidationAnalyze: (orderId: string) =>
    api.post<AiResponse>("/ai/consolidation/analyze", orderId).then((r) => r.data),
  aiConsolidationCreate: (orderId: string) =>
    api.post<AiResponse>("/ai/consolidation/create", orderId).then((r) => r.data),
  aiBackhaulFind: (driverId: string) =>
    api.post<AiResponse>(`/ai/backhaul/find/${driverId}`).then((r) => r.data),
  aiWeatherEta: (orderId: string) =>
    api.post<AiResponse>(`/ai/weather/eta/${orderId}`).then((r) => r.data),
  aiOrderCreated: (orderId: string) =>
    api.post<AiResponse>(`/ai/recommendations/order-created/${orderId}`).then((r) => r.data),
  aiOrderDelivered: (orderId: string) =>
    api.post<AiResponse>(`/ai/recommendations/order-delivered/${orderId}`).then((r) => r.data),
};