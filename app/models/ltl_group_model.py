import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, String, Uuid
from .user_model import Base


class LtlGroup(Base):
    __tablename__ = "ltl_groups"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    status = Column(String(20), nullable=False, default="active")
    total_weight_kg = Column(Float, nullable=False, default=0.0)
    total_volume_m3 = Column(Float, nullable=False, default=0.0)
    point_a_cluster_lat = Column(Float, nullable=False)
    point_a_cluster_lng = Column(Float, nullable=False)
    point_b_cluster_lat = Column(Float, nullable=False)
    point_b_cluster_lng = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
