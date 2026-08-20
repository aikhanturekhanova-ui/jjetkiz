from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.schemas.ltl_group_schema import LtlGroupSchema, LtlGroupCreate, LtlGroupUpdate
from app.models.ltl_group_model import LtlGroup as LtlGroupModel
from app.db.session import get_db_session

router = APIRouter(prefix="/ltl-groups", tags=["ltl-groups"])


def get_db():
    yield from get_db_session()


@router.get("/", response_model=List[LtlGroupSchema])
async def list_ltl_groups(db: Session = Depends(get_db)):
    groups = db.query(LtlGroupModel).all()
    return groups


@router.get("/{group_id}", response_model=LtlGroupSchema)
async def get_ltl_group(group_id: UUID, db: Session = Depends(get_db)):
    group = db.query(LtlGroupModel).filter(LtlGroupModel.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="LTL group not found")
    return group


@router.post("/", response_model=LtlGroupSchema, status_code=status.HTTP_201_CREATED)
async def create_ltl_group(group_data: LtlGroupCreate, db: Session = Depends(get_db)):
    group = LtlGroupModel(
        status=group_data.status or "active",
        total_weight_kg=group_data.total_weight_kg or 0.0,
        total_volume_m3=group_data.total_volume_m3 or 0.0,
        point_a_cluster_lat=group_data.point_a_cluster_lat,
        point_a_cluster_lng=group_data.point_a_cluster_lng,
        point_b_cluster_lat=group_data.point_b_cluster_lat,
        point_b_cluster_lng=group_data.point_b_cluster_lng,
        created_at=datetime.utcnow(),
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.put("/{group_id}", response_model=LtlGroupSchema)
async def update_ltl_group(group_id: UUID, group_data: LtlGroupUpdate, db: Session = Depends(get_db)):
    group = db.query(LtlGroupModel).filter(LtlGroupModel.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="LTL group not found")
    
    update_data = group_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(group, field, value)
    db.commit()
    db.refresh(group)
    return group


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ltl_group(group_id: UUID, db: Session = Depends(get_db)):
    group = db.query(LtlGroupModel).filter(LtlGroupModel.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="LTL group not found")
    db.delete(group)
    db.commit()
    return None
