from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.schemas.order_schema import OrderSchema, OrderCreate, OrderUpdate, OrderStatus, PackagingQuality
from app.models.order_model import Order as OrderModel
from app.models.user_model import User as UserModel
from app.db.session import get_db_session

router = APIRouter(prefix="/orders", tags=["orders"])


def get_db():
    yield from get_db_session()


@router.get("/", response_model=List[OrderSchema])
async def list_orders(
    status: Optional[OrderStatus] = None,
    customer_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    query = db.query(OrderModel)
    if status:
        query = query.filter(OrderModel.status == status)
    if customer_id:
        query = query.filter(OrderModel.customer_id == customer_id)
    orders = query.all()
    return orders


@router.get("/{order_id}", response_model=OrderSchema)
async def get_order(order_id: UUID, db: Session = Depends(get_db)):
    order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/", response_model=OrderSchema, status_code=status.HTTP_201_CREATED)
async def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    # Check customer exists
    user = db.query(UserModel).filter(UserModel.id == order_data.customer_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Customer not found")
    
    # Check exactly one of order_id or ltl_group_id is set (for offers, but orders always have customer_id)
    order = OrderModel(
        customer_id=order_data.customer_id,
        status=order_data.status or OrderStatus.created,
        point_a_lat=order_data.point_a_lat,
        point_a_lng=order_data.point_a_lng,
        point_a_address=order_data.point_a_address,
        point_b_lat=order_data.point_b_lat,
        point_b_lng=order_data.point_b_lng,
        point_b_address=order_data.point_b_address,
        cargo_weight_kg=order_data.cargo_weight_kg,
        cargo_volume_m3=order_data.cargo_volume_m3,
        is_perishable=order_data.is_perishable,
        is_fragile=order_data.is_fragile,
        packaging_quality=order_data.packaging_quality,
        packaging_photo_url=order_data.packaging_photo_url,
        cargo_description=order_data.cargo_description,
        priority_level=order_data.priority_level or "normal",
        is_social_priority=order_data.is_social_priority,
        weather_delay_warning=order_data.weather_delay_warning,
        estimated_delivery_minutes=order_data.estimated_delivery_minutes,
        requested_pickup_time=order_data.requested_pickup_time,
        price_offer=order_data.price_offer,
        assigned_driver_id=order_data.assigned_driver_id,
        is_ltl_group=order_data.is_ltl_group,
        ltl_group_id=order_data.ltl_group_id,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.put("/{order_id}", response_model=OrderSchema)
async def update_order(order_id: UUID, order_data: OrderUpdate, db: Session = Depends(get_db)):
    order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    update_data = order_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(order, field, value)
    db.commit()
    db.refresh(order)
    return order


@router.put("/{order_id}/status", response_model=OrderSchema)
async def update_order_status(order_id: UUID, new_status: str, db: Session = Depends(get_db)):
    order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    try:
        status_enum = OrderStatus(new_status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status. Valid: {[s.value for s in OrderStatus]}")
    
    # Validate status transitions
    valid_transitions = {
        "created": ["matching", "cancelled", "expired"],
        "matching": ["offered", "cancelled", "expired"],
        "offered": ["accepted", "cancelled", "expired"],
        "accepted": ["in_progress", "cancelled", "expired"],
        "in_progress": ["delivered", "cancelled", "expired"],
        "delivered": [],  # terminal
        "cancelled": [],  # terminal
        "expired": [],  # terminal
    }
    
    current = order.status.value if hasattr(order.status, "value") else str(order.status)
    if status_enum not in valid_transitions.get(current, []):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition from '{current}' to '{new_status}'"
        )
    
    order.status = status_enum
    # Add to status history
    from app.models.order_status_history_model import OrderStatusHistory as StatusHistoryModel
    history = StatusHistoryModel(
        order_id=order.id,
        status=status_enum,
        changed_at=datetime.utcnow(),
    )
    db.add(history)
    db.commit()
    db.refresh(order)
    return order
