import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Uuid
from .user_model import Base


class TrackingPoint(Base):
    __tablename__ = "tracking_points"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    driver_id = Column(Uuid, nullable=False)
    order_id = Column(Uuid, nullable=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    recorded_at_device = Column(DateTime(timezone=True), nullable=False)
    received_at_server = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
