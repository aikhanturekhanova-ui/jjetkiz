import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, Integer, String, Text, Uuid
)
from .enums import (
    role_enum, profile_status_enum, current_status_enum,
    vehicle_type_enum, order_status_enum, priority_level_enum,
    offer_status_enum, packaging_quality_enum
)
from .user_model import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    customer_id = Column(Uuid, nullable=False)
    status = Column(order_status_enum, nullable=False, default="created")
    point_a_lat = Column(Float, nullable=False)
    point_a_lng = Column(Float, nullable=False)
    point_a_address = Column(String(500), nullable=False)
    point_b_lat = Column(Float, nullable=False)
    point_b_lng = Column(Float, nullable=False)
    point_b_address = Column(String(500), nullable=False)
    cargo_weight_kg = Column(Float, nullable=False)
    cargo_volume_m3 = Column(Float, nullable=False)
    is_perishable = Column(Boolean, default=False, nullable=False)
    is_fragile = Column(Boolean, default=False, nullable=False)
    packaging_quality = Column(packaging_quality_enum, nullable=True)
    packaging_photo_url = Column(String(500), nullable=True)
    cargo_description = Column(Text, nullable=True)
    priority_level = Column(priority_level_enum, nullable=False, default="normal")
    is_social_priority = Column(Boolean, nullable=False, default=False)
    weather_delay_warning = Column(Boolean, nullable=False, default=False)
    estimated_delivery_minutes = Column(Float, nullable=True)
    requested_pickup_time = Column(String, nullable=True)
    price_offer = Column(Float, nullable=True)
    assigned_driver_id = Column(Uuid, nullable=True)
    is_ltl_group = Column(Boolean, default=False, nullable=False)
    ltl_group_id = Column(Uuid, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
