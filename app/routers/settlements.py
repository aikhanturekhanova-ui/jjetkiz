from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime

from app.schemas.settlement_schema import SettlementSchema, SettlementCreate, SettlementUpdate
from app.models.settlement_model import Settlement as SettlementModel
from app.db.session import get_db_session

router = APIRouter(prefix="/settlements", tags=["settlements"])


def get_db():
    yield from get_db_session()


@router.get("/", response_model=List[SettlementSchema])
async def list_settlements(db: Session = Depends(get_db)):
    settlements = db.query(SettlementModel).all()
    return settlements


@router.get("/{settlement_id}", response_model=SettlementSchema)
async def get_settlement(settlement_id: UUID, db: Session = Depends(get_db)):
    settlement = db.query(SettlementModel).filter(SettlementModel.id == settlement_id).first()
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    return settlement


@router.post("/", response_model=SettlementSchema, status_code=status.HTTP_201_CREATED)
async def create_settlement(settlement_data: SettlementCreate, db: Session = Depends(get_db)):
    settlement = SettlementModel(
        name=settlement_data.name,
        lat=settlement_data.lat,
        lng=settlement_data.lng,
    )
    db.add(settlement)
    db.commit()
    db.refresh(settlement)
    return settlement


@router.put("/{settlement_id}", response_model=SettlementSchema)
async def update_settlement(settlement_id: UUID, settlement_data: SettlementUpdate, db: Session = Depends(get_db)):
    settlement = db.query(SettlementModel).filter(SettlementModel.id == settlement_id).first()
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    
    update_data = settlement_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(settlement, field, value)
    db.commit()
    db.refresh(settlement)
    return settlement
