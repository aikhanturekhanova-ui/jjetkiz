export const ORDER_STATUSES = [
  "created",
  "matching",
  "offered",
  "accepted",
  "in_progress",
  "delivered",
  "cancelled",
  "expired",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  created: ["matching", "cancelled", "expired"],
  matching: ["offered", "cancelled", "expired"],
  offered: ["accepted", "cancelled", "expired"],
  accepted: ["in_progress", "cancelled", "expired"],
  in_progress: ["delivered", "cancelled", "expired"],
  delivered: [],
  cancelled: [],
  expired: [],
};

export const PACKAGING_QUALITIES = ["good", "acceptable", "poor"] as const;
export const PRIORITY_LEVELS = ["normal", "high", "critical"] as const;
export const USER_ROLES = ["customer", "driver", "admin"] as const;
export const PROFILE_STATUSES = ["incomplete", "complete"] as const;
export const VEHICLE_TYPES = ["tent", "flatbed", "pickup", "box_truck"] as const;
export const DRIVER_STATUSES = ["offline", "online", "on_order"] as const;
export const OFFER_STATUSES = ["sent", "accepted", "declined", "expired"] as const;
export const LTL_STATUSES = ["active", "consolidated", "completed"] as const;

export interface User {
  id: string;
  phone: string;
  role: string;
  full_name: string;
  created_at: string;
  is_active: boolean;
  profile_status: string;
}

export interface DriverProfile {
  id: string;
  user_id: string;
  vehicle_brand: string;
  vehicle_plate_number: string;
  capacity_kg: number;
  capacity_m3: number;
  has_refrigerator: boolean;
  vehicle_type: string;
  is_verified: boolean;
  current_status: string;
  rating_completed_trips: number;
  rating_failed_trips: number;
}

export interface CustomerProfile {
  id: string;
  user_id: string;
  company_name: string | null;
  settlement: string;
  business_type: string;
}

export interface Order {
  id: string;
  customer_id: string;
  status: OrderStatus;
  point_a_lat: number;
  point_a_lng: number;
  point_a_address: string;
  point_b_lat: number;
  point_b_lng: number;
  point_b_address: string;
  cargo_weight_kg: number;
  cargo_volume_m3: number;
  is_perishable: boolean;
  is_fragile: boolean;
  packaging_quality: string | null;
  packaging_photo_url: string | null;
  cargo_description: string | null;
  priority_level: string;
  is_social_priority: boolean;
  weather_delay_warning: boolean;
  estimated_delivery_minutes: number | null;
  requested_pickup_time: string | null;
  price_offer: number | null;
  assigned_driver_id: string | null;
  is_ltl_group: boolean;
  ltl_group_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderOffer {
  id: string;
  order_id: string | null;
  ltl_group_id: string | null;
  driver_id: string;
  status: string;
  sent_at: string;
  responded_at: string | null;
}

export interface LtlGroup {
  id: string;
  status: string;
  total_weight_kg: number;
  total_volume_m3: number;
  point_a_cluster_lat: number;
  point_a_cluster_lng: number;
  point_b_cluster_lat: number;
  point_b_cluster_lng: number;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: string;
  changed_at: string;
  changed_by_user_id: string | null;
}

export interface TrackingPoint {
  id: string;
  driver_id: string;
  order_id: string | null;
  lat: number;
  lng: number;
  recorded_at_device: string;
  received_at_server: string;
  created_at: string;
}

export interface WeatherSnapshot {
  id: string;
  region_point_lat: number;
  region_point_lng: number;
  temperature_c: number;
  wind_speed_ms: number;
  is_dust_storm_risk: boolean;
  fetched_at: string;
  raw_response?: Record<string, unknown> | null;
}

export interface Settlement {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface AiInsights {
  total_recommendations: number;
  capability_breakdown: Record<string, number>;
  recent_recommendations: unknown[];
}

export interface AiHealth {
  engine: string;
  capabilities: string[];
  status: string;
}

export interface AiResponse {
  [key: string]: unknown;
}