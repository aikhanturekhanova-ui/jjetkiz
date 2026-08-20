import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, Uuid
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    phone = Column(String(20), unique=True, nullable=False)
    role = Column(String(20), nullable=False, default="customer")
    full_name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    is_active = Column(Boolean, default=True, nullable=False)
    profile_status = Column(String(20), nullable=False, default="incomplete")
    password_hash = Column(String(255), nullable=True)
