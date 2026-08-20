import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class AILogisticsEngine:
    """Central AI Logistics Engine - integrates 5 capabilities as rule-based calculators."""

    def __init__(self, db=None):
        self.db = db
        self._recommendation_log = []

    @property
    def pricing(self):
        from app.services.ai_regional_pricing import AIRegionalPricingEngine
        return AIRegionalPricingEngine(self.db)

    @property
    def consolidation(self):
        from app.services.ai_load_consolidation import AILoadConsolidationEngine
        return AILoadConsolidationEngine(self.db)

    @property
    def backhaul(self):
        from app.services.ai_backhaul_matching import AIIBackhaulMatchingEngine
        return AIIBackhaulMatchingEngine(self.db)

    @property
    def weather(self):
        from app.services.ai_weather_risk import AIWeatherRiskEngine
        return AIWeatherRiskEngine(self.db)

    @property
    def tracking(self):
        from app.services.ai_offline_tracking import AIOfflineTrackingEngine
        return AIOfflineTrackingEngine(self.db)

    def execute_on_order_created(self, order_id):
        """Trigger all AI capabilities when order is created."""
        result = {"order_id": str(order_id), "timestamp": datetime.utcnow().isoformat(),
                  "capabilities": {}}
        try:
            pr = self.pricing.calculate_order_price(order_id)
            result["capabilities"]["pricing"] = {"status": "success",
                                               "recommended_price": pr["recommended_price"]}
        except Exception as e:
            logger.error(f"Pricing: {e}")
            result["capabilities"]["pricing"] = {"status": "error", "error": str(e)}

        try:
            cs = self.consolidation.analyze_for_new_order(order_id)
            result["capabilities"]["consolidation"] = {"status": "success",
                                                      "action": cs.get("action")}
        except Exception as e:
            logger.error(f"Consolidation: {e}")
            result["capabilities"]["consolidation"] = {"status": "error", "error": str(e)}

        try:
            bw = self.backhaul.find_driver_backhauls(order_id)
            result["capabilities"]["backhaul"] = {"status": "success",
                                                  "matches_found": bw.get("matches_found", 0)}
        except Exception as e:
            logger.error(f"Backhaul: {e}")
            result["capabilities"]["backhaul"] = {"status": "error", "error": str(e)}

        try:
            wa = self.weather.assess_order_risk(order_id)
            result["capabilities"]["weather"] = {"status": "success",
                                                 "risk_score": wa.get("risk_score")}
        except Exception as e:
            logger.error(f"Weather: {e}")
            result["capabilities"]["weather"] = {"status": "error", "error": str(e)}

        try:
            tr = self.tracking.initialize_order_tracking(order_id)
            result["capabilities"]["tracking"] = {"status": "success",
                                                  "driver_id": tr.get("driver_id")}
        except Exception as e:
            logger.error(f"Tracking: {e}")
            result["capabilities"]["tracking"] = {"status": "error", "error": str(e)}

        self._log_recommendation({"event": "order_created", "order_id": str(order_id),
                                  "inputs": {"order_id": str(order_id)},
                                  "outputs": result,
                                  "timestamp": datetime.utcnow().isoformat()})
        return result

    def execute_on_order_delivered(self, order_id):
        result = {"order_id": str(order_id), "timestamp": datetime.utcnow().isoformat(),
                  "capabilities": {}}
        try:
            pr = self.pricing.recalculate_pending_orders()
            result["capabilities"]["pricing"] = {"status": "success",
                                                 "orders_recalculated": pr["orders_recalculated"]}
        except Exception as e:
            logger.error(f"Pricing recalc: {e}")
            result["capabilities"]["pricing"] = {"status": "error", "error": str(e)}

        try:
            bw = self.backhaul.find_driver_backhauls(order_id)
            result["capabilities"]["backhaul"] = {"status": "success",
                                                  "matches_found": bw.get("matches_found", 0)}
        except Exception as e:
            logger.error(f"Backhaul: {e}")
            result["capabilities"]["backhaul"] = {"status": "error", "error": str(e)}

        self._log_recommendation({"event": "order_delivered", "order_id": str(order_id),
                                  "inputs": {"order_id": str(order_id)},
                                  "outputs": result,
                                  "timestamp": datetime.utcnow().isoformat()})
        return result

    def _log_recommendation(self, log_entry):
        self._recommendation_log.append(log_entry)
        if len(self._recommendation_log) > 1000:
            self._recommendation_log = self._recommendation_log[-1000:]
        logger.info(f"AI Rec: {str(log_entry)[:200]}...")

    def get_recommendation_history(self, limit=100):
        return self._recommendation_log[-limit:]


_engine_instance = None


def get_ai_engine():
    global _engine_instance
    if _engine_instance is None:
        from app.db.session import SessionLocal
        _engine_instance = AILogisticsEngine(db=SessionLocal())
    return _engine_instance


def reset_ai_engine():
    global _engine_instance
    _engine_instance = None
