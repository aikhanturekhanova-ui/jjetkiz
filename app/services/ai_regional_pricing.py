import logging
from datetime import datetime, timedelta
from math import radians, cos, sin, sqrt, atan2
from typing import Dict, Any, Optional, List
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func, or_ as sa_or

from app.models import Order, DriverProfile, Settlement, WeatherSnapshot

logger = logging.getLogger(__name__)


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate great circle distance in kilometers."""
    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c


class AIRegionalPricingEngine:
    PRICING_RULES = {
        "base_rate_per_kg": 0.80,
        "base_rate_per_m3": 1.20,
        "urgency_multipliers": {"critical": 2.5, "high": 1.8, "normal": 1.0},
        "priority_multipliers": {"critical": 2.0, "high": 1.5, "normal": 1.0},
        "distance_rate_per_km": 0.50,
        "weather_penalty_dust_storm": 0.15,
        "weather_penalty_high_wind": 0.10,
        "remote_settlement_penalty": 0.20,
        "backhaul_discount_good": 0.10,
        "backhaul_discount_none": 0.0,
    }

    def __init__(self, db: Session):
        self.db = db

    def calculate_order_price(self, order_id: UUID) -> Dict[str, Any]:
        order = self.db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise ValueError(f"Order {order_id} not found")

        driver_profile = None
        if order.assigned_driver_id:
            driver_profile = (
                self.db.query(DriverProfile)
                .filter(DriverProfile.id == order.assigned_driver_id)
                .first()
            )

        # 1. Base price
        base_price = (
            (order.cargo_weight_kg or 0) * self.PRICING_RULES["base_rate_per_kg"]
            + (order.cargo_volume_m3 or 0) * self.PRICING_RULES["base_rate_per_m3"]
        )

        # 2. Urgency multiplier
        urgency = order.priority_level or "normal"
        if order.is_social_priority or order.weather_delay_warning:
            urgency = "critical"
        urgency_mult = self.PRICING_RULES["urgency_multipliers"].get(urgency, 1.0)
        urgency_add = base_price * (urgency_mult - 1.0)

        # 3. Priority multiplier
        priority_mult = self.PRICING_RULES["priority_multipliers"].get(
            order.priority_level or "normal", 1.0
        )
        priority_add = base_price * (priority_mult - 1.0)

        # 4. Distance
        distance_km = haversine_km(
            float(order.point_a_lat),
            float(order.point_a_lng),
            float(order.point_b_lat),
            float(order.point_b_lng),
        )
        distance_add = distance_km * self.PRICING_RULES["distance_rate_per_km"]

        # 5. Weather penalty
        weather_pct = 0.0
        weather_factors: List[str] = []
        lat_min = min(float(order.point_a_lat), float(order.point_b_lat)) - 5
        lat_max = max(float(order.point_a_lat), float(order.point_b_lat)) + 5
        lng_min = min(float(order.point_a_lng), float(order.point_b_lng)) - 5
        lng_max = max(float(order.point_a_lng), float(order.point_b_lng)) + 5

        ws = self.db.query(WeatherSnapshot).filter(
            WeatherSnapshot.region_point_lat.between(lat_min, lat_max),
            WeatherSnapshot.region_point_lng.between(lng_min, lng_max),
        ).all()

        for snap in ws:
            if snap.is_dust_storm_risk:
                weather_pct += self.PRICING_RULES["weather_penalty_dust_storm"]
                weather_factors.append("dust_storm_risk")
            if snap.wind_speed_ms > 15:
                weather_pct += self.PRICING_RULES["weather_penalty_high_wind"]
                weather_factors.append("high_wind")
        weather_pct = min(weather_pct, 0.25)

        # 6. Remote settlement penalty
        remote_pct = 0.0
        remote_factors: List[str] = []
        origin_kw = (str(order.point_a_address or "")[:20]).lower()
        dest_kw = (str(order.point_b_address or "")[:20]).lower()
        oset = (
            self.db.query(Settlement)
            .filter(func.lower(Settlement.name).ilike(f"%{origin_kw}%"))
            .first()
        )
        dset = (
            self.db.query(Settlement)
            .filter(func.lower(Settlement.name).ilike(f"%{dest_kw}%"))
            .first()
        )
        if oset or dset:
            remote_pct = self.PRICING_RULES["remote_settlement_penalty"]
            remote_factors.append("remote_settlement")

        # 7. Backhaul discount
        backhaul_discount_pct = self.PRICING_RULES["backhaul_discount_none"]
        backhaul_factors: List[str] = []
        if order.is_ltl_group and order.ltl_group_id:
            backhaul_discount_pct = self.PRICING_RULES["backhaul_discount_good"]
            backhaul_factors.append("ltl_group_backhaul")

        # 8. Final price - deterministic calculation
        final_price = base_price
        final_price += urgency_add
        final_price += priority_add
        final_price += distance_add
        final_price += base_price * weather_pct
        final_price += base_price * remote_pct
        final_price -= final_price * backhaul_discount_pct

        # Confidence
        dp = sum([1 for v in [order.cargo_weight_kg, order.cargo_volume_m3] if v])
        dp += 1 if order.point_a_lat else 0
        dp += 1 if order.point_b_lat else 0
        dp += 1 if order.priority_level else 0
        confidence = min(dp / 5.0, 1.0)

        breakdown = {
            "base_price": round(base_price, 2),
            "urgency_add": round(urgency_add, 2),
            "priority_add": round(priority_add, 2),
            "distance_km": round(distance_km, 1),
            "distance_factor": round(distance_add, 2),
            "weather_pct": round(weather_pct * 100, 1),
            "weather_factors": weather_factors,
            "remote_pct": round(remote_pct * 100, 1),
            "remote_factors": remote_factors,
            "backhaul_discount_pct": round(backhaul_discount_pct * 100, 1),
            "backhaul_factors": backhaul_factors,
        }

        factors: List[str] = []
        if urgency_mult > 1.0:
            factors.append("urgency")
        if priority_mult > 1.0:
            factors.append("priority")
        if distance_km > 10:
            factors.append("distance")
        if weather_factors:
            factors.append("weather")
        if remote_factors:
            factors.append("remote_settlement")
        if backhaul_factors:
            factors.append("backhaul")

        return {
            "recommended_price": round(final_price, 2),
            "price_breakdown": breakdown,
            "factors": factors,
            "confidence": round(confidence, 2),
            "distance_km": round(distance_km, 1),
            "data_completeness": round(dp / 5.0, 2),
        }

    def recalculate_pending_orders(self) -> Dict[str, Any]:
        stale = (
            self.db.query(Order)
            .filter(Order.status == "matching")
            .filter(Order.updated_at < datetime.utcnow() - timedelta(days=1))
            .all()
        )
        recalcd = 0
        for o in stale:
            try:
                self.calculate_order_price(o.id)
                recalcd += 1
            except Exception as e:
                logger.error(f"Recalc failed for {o.id}: {e}")
        return {"orders_recalculated": recalcd, "total_stale": len(stale)}

    def analyze_order_pricing(self, order_id: UUID) -> Dict[str, Any]:
        return self.calculate_order_price(order_id)
