from datetime import datetime
from pydantic import BaseModel, Field, model_validator
from typing import Optional
from uuid import UUID
from enum import Enum

class OfferStatus(str, Enum):
    sent = "sent"
    accepted = "accepted"
    declined = "declined"
    expired = "expired"

class OrderOfferSchema(BaseModel):
    id: UUID
    order_id: Optional[UUID] = None
    ltl_group_id: Optional[UUID] = None
    driver_id: UUID
    status: OfferStatus = Field(default="sent")
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    responded_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class OrderOfferCreate(BaseModel):
    order_id: Optional[UUID] = None
    ltl_group_id: Optional[UUID] = None
    driver_id: UUID
    status: OfferStatus = Field(default="sent")
    sent_at: datetime = Field(default_factory=datetime.utcnow)

    @model_validator(mode="after")
    def check_exactly_one(self):
        if bool(self.order_id) == bool(self.ltl_group_id):
            raise ValueError("Exactly one of order_id or ltl_group_id required")
        return self

class OrderOfferUpdate(BaseModel):
    status: Optional[OfferStatus] = None
    responded_at: Optional[datetime] = None
