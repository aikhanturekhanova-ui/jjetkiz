import logging
from typing import Dict, Any, List
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import Order, DriverProfile, OrderOffer

logger = logging.getLogger(__name__)


class AIIBackhaulMatchingEngine:
    """Rule-based backhaul matching: finds return cargo for drivers after delivery."""

    MAX_EMPTY_LEG_KM = 150.0

    def __init__(self, db: Session):
        self.db = db

    def find_driver_backhauls(self, driver_id: UUID) -> Dict[str, Any]:
        from app.services.ai_regional_pricing import haversine_km

        driver = self.db.query(DriverProfile).filter(DriverProfile.id == driver_id).first()
        if not driver:
            return {"driver_id": str(driver_id), "matches_found": 0, "error": "driver_not_found"}

        user = self.db.query(DriverProfile).filter(DriverProfile.id == driver_id).first()

        delivered = (
            self.db.query(Order)
            .filter(Order.assigned_driver_id == driver_id)
            .filter(Order.status == "delivered")
            .all()
        )

        last_position = None
        for order in delivered:
            last_position = (float(order.point_b_lat), float(order.point_b_lng))

        if not last_position:
            return {
                "driver_id": str(driver_id),
                "matches_found": 0,
                "message": "no_delivered_orders_for_position",
            }

        matches: List[Dict[str, Any]] = []
        for candidate in self.db.query(Order).filter(Order.status == "created").all():
            dist = haversine_km(
                last_position[0], last_position[1],
                float(candidate.point_a_lat), float(candidate.point_a_lng),
            )
            if dist <= self.MAX_EMPTY_LEG_KM:
                matches.append({
                    "match_id": str(candidate.id),
                    "order_id": str(candidate.id),
                    "distance_from_driver_km": round(dist, 1),
                    "cargo_weight_kg": candidate.cargo_weight_kg,
                    "cargo_volume_m3": candidate.cargo_volume_m3,
                    "route": f"{candidate.point_a_address} -> {candidate.point_b_address}",
                    "estimated_revenue": self._estimate_revenue(candidate),
                })
            if len(matches) >= 5:
                break

        return {
            "driver_id": str(driver_id),
            "vehicle": user.vehicle_plate_number if user else None,
            "last_position_lat": last_position[0],
            "last_position_lng": last_position[1],
            "matches_found": len(matches),
            "matches": matches,
        }

    def _estimate_revenue(self, order: Order) -> float:
        if order.price_offer:
            return float(order.price_offer)
        base = (float(order.cargo_weight_kg or 0) * 0.8) + (float(order.cargo_volume_m3 or 0) * 1.2)
        mult = {"critical": 2.0, "high": 1.5, "normal": 1.0}.get(order.priority_level or "normal", 1.0)
        return round(base * mult, 2)