from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.schemas.tracking_point_schema import TrackingPointSchema, TrackingPointCreate
from app.models.tracking_point_model import TrackingPoint as TrackingPointModel
from app.models.user_model import User as UserModel
from app.db.session import get_db_session

router = APIRouter(prefix="/tracking-points", tags=["tracking-points"])


def get_db():
    yield from get_db_session()


@router.get("/", response_model=List[TrackingPointSchema])
async def list_tracking_points(
    driver_id: Optional[UUID] = None,
    order_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    query = db.query(TrackingPointModel)
    if driver_id:
        query = query.filter(TrackingPointModel.driver_id == driver_id)
    if order_id:
        query = query.filter(TrackingPointModel.order_id == order_id)
    points = query.all()
    return points


@router.get("/{point_id}", response_model=TrackingPointSchema)
async def get_tracking_point(point_id: UUID, db: Session = Depends(get_db)):
    point = db.query(TrackingPointModel).filter(TrackingPointModel.id == point_id).first()
    if not point:
        raise HTTPException(status_code=404, detail="Tracking point not found")
    return point


@router.post("/", response_model=TrackingPointSchema, status_code=status.HTTP_201_CREATED)
async def create_tracking_point(point_data: TrackingPointCreate, db: Session = Depends(get_db)):
    # Validate driver exists (accepts user id or driver profile id)
    driver = db.query(UserModel).filter(UserModel.id == point_data.driver_id).first()
    if not driver:
        from app.models.driver_profile_model import DriverProfile as DriverProfileModel
        profile = db.query(DriverProfileModel).filter(DriverProfileModel.id == point_data.driver_id).first()
        if not profile:
            raise HTTPException(status_code=400, detail="Driver not found")
    
    # Validate order exists if provided
    if point_data.order_id:
        from app.models.order_model import Order as OrderModel
        order = db.query(OrderModel).filter(OrderModel.id == point_data.order_id).first()
        if not order:
            raise HTTPException(status_code=400, detail="Order not found")
    
    point = TrackingPointModel(
        driver_id=point_data.driver_id,
        order_id=point_data.order_id,
        lat=point_data.lat,
        lng=point_data.lng,
        recorded_at_device=point_data.recorded_at_device,
        received_at_server=point_data.received_at_server,
        created_at=datetime.utcnow(),
    )
    db.add(point)
    db.commit()
    db.refresh(point)
    return point
