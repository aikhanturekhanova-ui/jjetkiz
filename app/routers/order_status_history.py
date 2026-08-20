from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime

from app.schemas.order_status_history_schema import OrderStatusHistorySchema, OrderStatusHistoryCreate
from app.models.order_status_history_model import OrderStatusHistory as StatusHistoryModel
from app.db.session import get_db_session

router = APIRouter(prefix="/order-status-history", tags=["order-status-history"])


def get_db():
    yield from get_db_session()


@router.get("/", response_model=List[OrderStatusHistorySchema])
async def list_status_history(
    order_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    query = db.query(StatusHistoryModel)
    if order_id:
        query = query.filter(StatusHistoryModel.order_id == order_id)
    history = query.all()
    return history


@router.get("/{history_id}", response_model=OrderStatusHistorySchema)
async def get_status_history(history_id: UUID, db: Session = Depends(get_db)):
    history = db.query(StatusHistoryModel).filter(StatusHistoryModel.id == history_id).first()
    if not history:
        raise HTTPException(status_code=404, detail="Status history not found")
    return history


@router.post("/", response_model=OrderStatusHistorySchema, status_code=status.HTTP_201_CREATED)
async def create_status_history(history_data: OrderStatusHistoryCreate, db: Session = Depends(get_db)):
    # Check order exists
    from app.models.order_model import Order as OrderModel
    order = db.query(OrderModel).filter(OrderModel.id == history_data.order_id).first()
    if not order:
        raise HTTPException(status_code=400, detail="Order not found")
    
    history = StatusHistoryModel(
        order_id=history_data.order_id,
        status=history_data.status,
        changed_at=history_data.changed_at or datetime.utcnow(),
        changed_by_user_id=history_data.changed_by_user_id,
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    return history
