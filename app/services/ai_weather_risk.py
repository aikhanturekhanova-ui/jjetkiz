import logging
from typing import Dict, Any, List
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import Order, WeatherSnapshot

logger = logging.getLogger(__name__)


class AIWeatherRiskEngine:
    """Rule-based weather risk assessment using regional weather snapshots."""

    DUST_STORM_PENALTY_PCT = 0.15
    HIGH_WIND_PENALTY_PCT = 0.10
    HIGH_WIND_THRESHOLD_MS = 15.0

    def __init__(self, db: Session):
        self.db = db

    def assess_network_risk(self) -> Dict[str, Any]:
        active = (
            self.db.query(Order)
            .filter(Order.status.in_(["created", "matching", "offered", "accepted", "in_progress"]))
            .all()
        )
        affected: List[Dict[str, Any]] = []
        risk_sum = 0.0
        for order in active:
            risk = self.assess_order_risk(order.id)
            risk_sum += float(risk.get("risk_score", 0))
            if risk.get("at_risk"):
                affected.append({
                    "order_id": str(order.id),
                    "risk_score": risk.get("risk_score"),
                    "factors": risk.get("factors"),
                    "eta_penalty_minutes": risk.get("eta_penalty_minutes"),
                })
        return {
            "total_active_orders": len(active),
            "orders_at_risk": len(affected),
            "network_risk_score": round(risk_sum / max(len(active), 1), 2),
            "affected_orders": affected,
            "severity": "high" if len(affected) > 0 else "low",
        }

    def assess_order_risk(self, order_id: UUID) -> Dict[str, Any]:
        order = self.db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return {"order_id": str(order_id), "risk_score": 0, "at_risk": False,
                    "error": "order_not_found"}

        lat_min = min(float(order.point_a_lat), float(order.point_b_lat)) - 5
        lat_max = max(float(order.point_a_lat), float(order.point_b_lat)) + 5
        lng_min = min(float(order.point_a_lng), float(order.point_b_lng)) - 5
        lng_max = max(float(order.point_a_lng), float(order.point_b_lng)) + 5

        snapshots = (
            self.db.query(WeatherSnapshot)
            .filter(WeatherSnapshot.region_point_lat.between(lat_min, lat_max),
                    WeatherSnapshot.region_point_lng.between(lng_min, lng_max))
            .all()
        )

        factors: List[str] = []
        risk_score = 0.0
        eta_penalty = 0
        for snap in snapshots:
            if snap.is_dust_storm_risk:
                factors.append("dust_storm_risk")
                risk_score += self.DUST_STORM_PENALTY_PCT
                eta_penalty += 30
            if float(snap.wind_speed_ms or 0) > self.HIGH_WIND_THRESHOLD_MS:
                factors.append("high_wind")
                risk_score += self.HIGH_WIND_PENALTY_PCT
                eta_penalty += 15

        risk_score = round(min(risk_score, 0.45), 2)
        if order.weather_delay_warning:
            factors.append("weather_delay_warning")
            risk_score = round(min(risk_score + 0.1, 0.45), 2)
            eta_penalty += 20

        return {
            "order_id": str(order_id),
            "risk_score": risk_score,
            "at_risk": risk_score > 0.05,
            "factors": factors,
            "eta_penalty_minutes": eta_penalty,
            "snapshots_considered": len(snapshots),
            "recommendation": "delay" if eta_penalty >= 30 else "proceed",
        }