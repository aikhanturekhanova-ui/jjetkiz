import uvicorn
import os
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from uuid import UUID

from dotenv import load_dotenv
load_dotenv()

from app.schemas import *
from app.routers import users_router, auth_router, driver_profiles_router, customer_profiles_router, \
    orders_router, order_offers_router, ltl_groups_router, order_status_history_router, \
    tracking_points_router, weather_snapshots_router, refresh_tokens_router, settlements_router
from app.db.session import get_db_session
from app.models import Base, User, Settlement, DriverProfile, CustomerProfile, Order, \
    OrderStatusHistory, OrderOffer, LtlGroup, TrackingPoint, WeatherSnapshot, RefreshToken
from app.db.base import engine

Base.metadata.create_all(bind=engine)

# Lightweight migration for existing databases: add password_hash to users
with engine.begin() as conn:
    cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(users)").fetchall()]
    if cols and "password_hash" not in cols:
        conn.exec_driver_sql("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)")

app = FastAPI(title="Freight Management API + AI Logistics Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.services.ai_logistics_engine import AILogisticsEngine, get_ai_engine
ai_engine = get_ai_engine()

# Load API keys from environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
RAILWAY_API_KEY = os.getenv("RAILWAY_API_KEY")

def get_db():
    db = next(get_db_session())
    try:
        yield db
    finally:
        db.close()

app.include_router(users_router)
app.include_router(auth_router)
app.include_router(driver_profiles_router)
app.include_router(customer_profiles_router)
app.include_router(orders_router)
app.include_router(order_offers_router)
app.include_router(ltl_groups_router)
app.include_router(order_status_history_router)
app.include_router(tracking_points_router)
app.include_router(weather_snapshots_router)
app.include_router(refresh_tokens_router)
app.include_router(settlements_router)


@app.get("/")
def root():
    return {"message": "Freight Management API + AI Logistics Engine", "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/ai/health")
def ai_health():
    capabilities = ["regional_pricing", "load_consolidation", "backhaul_matching",
                    "weather_risk", "offline_tracking"]
    return {"engine": "AI Logistics Engine", "capabilities": capabilities, "status": "operational"}


@app.post("/ai/pricing/recommend")
def ai_price_recommendation(order_id: str = Body(...)):
    order_id_uuid = UUID(order_id)
    result = ai_engine.pricing.calculate_order_price(order_id_uuid)
    return result


@app.post("/ai/pricing/analyze/{order_id}")
def ai_price_analyze(order_id: str):
    order_id_uuid = UUID(order_id)
    result = ai_engine.pricing.analyze_order_pricing(order_id_uuid)
    return result


@app.post("/ai/pricing/recalculate")
def ai_price_recalculate():
    result = ai_engine.pricing.recalculate_pending_orders()
    return result


@app.post("/ai/consolidation/analyze")
def ai_consolidation_analyze(order_id: str = Body(...)):
    order_id_uuid = UUID(order_id)
    result = ai_engine.consolidation.analyze_for_new_order(order_id_uuid)
    return result


@app.post("/ai/consolidation/create")
def ai_consolidation_create(order_id: str = Body(...)):
    order_id_uuid = UUID(order_id)
    result = ai_engine.consolidation.analyze_for_new_order(order_id_uuid)
    action = result.get("action")
    if action == "CREATE_LTL_GROUP":
        return {"status": "ltl_group_created", "ltl_group_id": result.get("consolidation_id"),
                "savings_pct": result.get("savings_pct")}
    return {"status": "not_created", "reason": result.get("reason")}


@app.post("/ai/consolidation/reanalyze/{order_id}")
def ai_consolidation_reanalyze(order_id: str):
    order_id_uuid = UUID(order_id)
    result = ai_engine.consolidation.reanalyze_after_delivery(order_id_uuid)
    return result


@app.post("/ai/backhaul/find/{driver_id}")
def ai_backhaul_find(driver_id: str):
    driver_id_uuid = UUID(driver_id)
    result = ai_engine.backhaul.find_driver_backhauls(driver_id_uuid)
    return result


@app.get("/ai/backhaul/available")
def ai_backhaul_available():
    return {"available_drivers": 0, "message": "endpoint placeholder"}


@app.post("/ai/backhaul/accept")
def ai_backhaul_accept(match_id: str = Body(...)):
    match_id_uuid = UUID(match_id)
    return {"status": "accepted", "match_id": str(match_id_uuid)}


@app.post("/ai/weather/analyze")
def ai_weather_analyze():
    result = ai_engine.weather.assess_network_risk()
    return result


@app.post("/ai/weather/eta/{order_id}")
def ai_weather_eta(order_id: str):
    order_id_uuid = UUID(order_id)
    result = ai_engine.weather.assess_order_risk(order_id_uuid)
    return result


@app.get("/ai/weather/risk-map")
def ai_weather_risk_map():
    return {"risk_map": "placeholder - shows routes affected by weather"}


@app.post("/ai/weather/alerts")
def ai_weather_alerts():
    return {"status": "alerts_subscribed"}


@app.post("/tracking/sync")
def tracking_sync():
    result = ai_engine.tracking.sync_pending_events()
    return result


@app.get("/tracking/driver-status/{driver_id}")
def driver_status(driver_id: str):
    driver_id_uuid = UUID(driver_id)
    result = ai_engine.tracking.get_driver_status(driver_id_uuid)
    return result


@app.get("/tracking/gaps")
def tracking_gaps():
    result = ai_engine.tracking.detect_offline_gaps()
    return result


PRICING_EVENT = "order_created"
CONSOLIDATION_EVENT = "order_created"
BACKHAUL_EVENT = "order_delivered"
WEATHER_EVENT = "order_delivered"
TRACKING_EVENT = "order_delivered"


@app.post("/ai/recommendations/order-created/{order_id}")
def ai_order_created(order_id: str):
    order_id_uuid = UUID(order_id)
    result = ai_engine.execute_on_order_created(order_id_uuid)
    return result


@app.post("/ai/recommendations/order-delivered/{order_id}")
def ai_order_delivered(order_id: str):
    order_id_uuid = UUID(order_id)
    result = ai_engine.execute_on_order_delivered(order_id_uuid)
    return result


@app.get("/ai/insights/dashboard")
def ai_dashboard_insights():
    history = ai_engine.get_recommendation_history(limit=50)
    total = len(history)
    pricing_cnt = sum(1 for h in history if h.get("event") == PRICING_EVENT)
    consolidation_cnt = sum(1 for h in history if h.get("event") == CONSOLIDATION_EVENT)
    backhaul_cnt = sum(1 for h in history if h.get("event") == BACKHAUL_EVENT)
    weather_cnt = sum(1 for h in history if h.get("event") == WEATHER_EVENT)
    tracking_cnt = sum(1 for h in history if h.get("event") == TRACKING_EVENT)
    recent = history[-10:] if history else []
    return {
        "total_recommendations": total,
        "capability_breakdown": {
            "pricing": pricing_cnt,
            "consolidation": consolidation_cnt,
            "backhaul": backhaul_cnt,
            "weather": weather_cnt,
            "tracking": tracking_cnt,
        },
        "recent_recommendations": recent,
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
