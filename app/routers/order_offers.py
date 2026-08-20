from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.schemas.order_offer_schema import OrderOfferSchema, OrderOfferCreate, OrderOfferUpdate, OfferStatus
from app.models.order_offer_model import OrderOffer as OrderOfferModel
from app.models.order_model import Order as OrderModel
from app.models.user_model import User as UserModel
from app.db.session import get_db_session

router = APIRouter(prefix="/order-offers", tags=["order-offers"])


def get_db():
    yield from get_db_session()


@router.get("/", response_model=List[OrderOfferSchema])
async def list_order_offers(
    driver_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    query = db.query(OrderOfferModel)
    if driver_id:
        query = query.filter(OrderOfferModel.driver_id == driver_id)
    offers = query.all()
    return offers


@router.get("/{offer_id}", response_model=OrderOfferSchema)
async def get_order_offer(offer_id: UUID, db: Session = Depends(get_db)):
    offer = db.query(OrderOfferModel).filter(OrderOfferModel.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Order offer not found")
    return offer


@router.post("/", response_model=OrderOfferSchema, status_code=status.HTTP_201_CREATED)
async def create_order_offer(offer_data: OrderOfferCreate, db: Session = Depends(get_db)):
    # Check exactly one of order_id or ltl_group_id
    if (offer_data.order_id and offer_data.ltl_group_id) or (not offer_data.order_id and not offer_data.ltl_group_id):
        raise HTTPException(
            status_code=400, 
            detail="Exactly one of order_id or ltl_group_id is required"
        )
    
    # Validate order_id if provided
    if offer_data.order_id:
        order = db.query(OrderModel).filter(OrderModel.id == offer_data.order_id).first()
        if not order:
            raise HTTPException(status_code=400, detail="Order not found")
    
    # Validate driver_id exists (accepts user id or driver profile id)
    if offer_data.driver_id:
        driver = db.query(UserModel).filter(UserModel.id == offer_data.driver_id).first()
        if not driver:
            from app.models.driver_profile_model import DriverProfile as DriverProfileModel
            profile = db.query(DriverProfileModel).filter(DriverProfileModel.id == offer_data.driver_id).first()
            if not profile:
                raise HTTPException(status_code=400, detail="Driver not found")
    
    offer = OrderOfferModel(
        order_id=offer_data.order_id,
        ltl_group_id=offer_data.ltl_group_id,
        driver_id=offer_data.driver_id,
        status=offer_data.status or OfferStatus.sent,
        sent_at=offer_data.sent_at or datetime.utcnow(),
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


@router.put("/{offer_id}", response_model=OrderOfferSchema)
async def update_order_offer(offer_id: UUID, offer_data: OrderOfferUpdate, db: Session = Depends(get_db)):
    offer = db.query(OrderOfferModel).filter(OrderOfferModel.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Order offer not found")
    
    update_data = offer_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(offer, field, value)
    db.commit()
    db.refresh(offer)
    return offer
