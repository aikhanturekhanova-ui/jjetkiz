import logging
from typing import Dict, Any, List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import Order, LtlGroup, OrderOffer

logger = logging.getLogger(__name__)


class AILoadConsolidationEngine:
    """Rule-based LTL consolidation engine: groups small cargo on similar routes."""

    MIN_LTL_VOLUME_M3 = 0.5
    MAX_SINGLE_TRUCK_VOLUME_M3 = 12.0
    MAX_SINGLE_TRUCK_WEIGHT_KG = 3000.0
    CLUSTER_RADIUS_KM = 30.0

    def __init__(self, db: Session):
        self.db = db

    def analyze_for_new_order(self, order_id: UUID) -> Dict[str, Any]:
        order = self.db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return {"action": "NOT_CREATED", "reason": "order_not_found"}

        volume = float(order.cargo_volume_m3 or 0)
        weight = float(order.cargo_weight_kg or 0)

        if volume > self.MAX_SINGLE_TRUCK_VOLUME_M3 or weight > self.MAX_SINGLE_TRUCK_WEIGHT_KG:
            return {
                "action": "NOT_CREATED",
                "reason": "cargo_too_large_for_ltl",
                "order_id": str(order_id),
                "savings_pct": 0,
            }

        if order.is_ltl_group and order.ltl_group_id:
            return {
                "action": "ALREADY_IN_GROUP",
                "order_id": str(order_id),
                "ltl_group_id": str(order.ltl_group_id),
                "savings_pct": 0,
            }

        candidates = self._find_candidates(order)
        if not candidates:
            return {
                "action": "NOT_CREATED",
                "reason": "no_compatible_orders",
                "order_id": str(order_id),
                "savings_pct": 0,
            }

        total_weight = weight + sum(float(c.cargo_weight_kg or 0) for c in candidates)
        total_volume = volume + sum(float(c.cargo_volume_m3 or 0) for c in candidates)
        savings_pct = round(min(0.15 + (len(candidates) + 1) * 0.05, 0.35) * 100, 1)

        return {
            "action": "CREATE_LTL_GROUP",
            "consolidation_id": str(order_id),
            "order_id": str(order_id),
            "compatible_orders": [str(c.id) for c in candidates],
            "total_weight_kg": round(total_weight, 1),
            "total_volume_m3": round(total_volume, 1),
            "savings_pct": savings_pct,
        }

    def _find_candidates(self, order: Order) -> List[Order]:
        from app.services.ai_regional_pricing import haversine_km

        candidates: List[Order] = []
        for candidate in self.db.query(Order).filter(Order.status == "created").all():
            if candidate.id == order.id:
                continue
            dist_a = haversine_km(
                float(order.point_a_lat), float(order.point_a_lng),
                float(candidate.point_a_lat), float(candidate.point_a_lng),
            )
            dist_b = haversine_km(
                float(order.point_b_lat), float(order.point_b_lng),
                float(candidate.point_b_lat), float(candidate.point_b_lng),
            )
            if dist_a <= self.CLUSTER_RADIUS_KM and dist_b <= self.CLUSTER_RADIUS_KM:
                candidates.append(candidate)
            if len(candidates) >= 3:
                break
        return candidates

    def reanalyze_after_delivery(self, order_id: UUID) -> Dict[str, Any]:
        order = self.db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return {"status": "not_found"}
        active_groups = self.db.query(LtlGroup).filter(LtlGroup.status == "active").count()
        return {
            "status": "reanalyzed",
            "order_id": str(order_id),
            "active_ltl_groups": active_groups,
            "consolidation_potential": active_groups > 0,
        }