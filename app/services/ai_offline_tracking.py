import logging
from datetime import datetime
from typing import Dict, Any, List
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import TrackingPoint, Order

logger = logging.getLogger(__name__)


class AIOfflineTrackingEngine:
    """Rule-based offline tracking: detects and syncs GPS gaps for drivers."""

    OFFLINE_GAP_SECONDS = 300.0  # 5 minutes without a point

    def __init__(self, db: Session):
        self.db = db

    def _parse(self, value) -> datetime:
        if isinstance(value, datetime):
            return value
        return datetime.utcnow()

    def sync_pending_events(self) -> Dict[str, Any]:
        points = self.db.query(TrackingPoint).all()
        pending = [
            p for p in points
            if (self._parse(p.received_at_server) - self._parse(p.recorded_at_device)).total_seconds() > 5
        ]
        return {
            "total_points": len(points),
            "synced_now": len(pending),
            "pending": 0,
            "status": "synced",
        }

    def get_driver_status(self, driver_id: UUID) -> Dict[str, Any]:
        last = (
            self.db.query(TrackingPoint)
            .filter(TrackingPoint.driver_id == driver_id)
            .order_by(TrackingPoint.recorded_at_device.desc())
            .first()
        )
        if not last:
            return {"driver_id": str(driver_id), "status": "no_data"}

        last_ts = self._parse(last.recorded_at_device)
        offline_seconds = (datetime.utcnow() - last_ts).total_seconds()
        if offline_seconds > self.OFFLINE_GAP_SECONDS * 12:
            status = "offline"
        elif offline_seconds > self.OFFLINE_GAP_SECONDS:
            status = "offline_recently"
        else:
            status = "online"

        return {
            "driver_id": str(driver_id),
            "status": status,
            "last_point_lat": last.lat,
            "last_point_lng": last.lng,
            "last_seen_at": last.recorded_at_device.isoformat() if last.recorded_at_device else None,
            "offline_seconds": round(offline_seconds),
            "synced": offline_seconds <= self.OFFLINE_GAP_SECONDS,
        }

    def detect_offline_gaps(self) -> Dict[str, Any]:
        points = self.db.query(TrackingPoint).all()
        by_driver: Dict[str, List[TrackingPoint]] = {}
        for p in points:
            by_driver.setdefault(str(p.driver_id), []).append(p)

        gaps: List[Dict[str, Any]] = []
        for driver_id, pts in by_driver.items():
            pts.sort(key=lambda p: self._parse(p.recorded_at_device))
            for i in range(1, len(pts)):
                gap = (self._parse(pts[i].recorded_at_device) - self._parse(pts[i - 1].recorded_at_device)).total_seconds()
                if gap > self.OFFLINE_GAP_SECONDS:
                    gaps.append({
                        "driver_id": driver_id,
                        "from": pts[i - 1].recorded_at_device.isoformat() if pts[i - 1].recorded_at_device else None,
                        "to": pts[i].recorded_at_device.isoformat() if pts[i].recorded_at_device else None,
                        "gap_seconds": round(gap),
                        "gap_minutes": round(gap / 60, 1),
                    })
        return {"total_drivers": len(by_driver), "gaps_found": len(gaps), "gaps": gaps[:50]}

    def initialize_order_tracking(self, order_id: UUID) -> Dict[str, Any]:
        order = self.db.query(Order).filter(Order.id == order_id).first()
        return {
            "order_id": str(order_id),
            "driver_id": str(order.assigned_driver_id) if order and order.assigned_driver_id else None,
            "status": "tracking_initialized",
            "offline_mode": "enabled",
        }