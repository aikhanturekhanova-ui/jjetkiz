from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.schemas.driver_profile_schema import DriverProfileSchema, DriverProfileCreate, DriverProfileUpdate
from app.models.driver_profile_model import DriverProfile as DriverProfileModel
from app.db.session import get_db_session
from datetime import datetime

router = APIRouter(prefix="/driver-profiles", tags=["driver-profiles"])


def get_db():
    yield from get_db_session()


@router.get("/", response_model=List[DriverProfileSchema])
async def list_driver_profiles(db: Session = Depends(get_db)):
    profiles = db.query(DriverProfileModel).all()
    return profiles


@router.get("/{profile_id}", response_model=DriverProfileSchema)
async def get_driver_profile(profile_id: UUID, db: Session = Depends(get_db)):
    profile = db.query(DriverProfileModel).filter(DriverProfileModel.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Driver profile not found")
    return profile


@router.post("/", response_model=DriverProfileSchema, status_code=status.HTTP_201_CREATED)
async def create_driver_profile(profile_data: DriverProfileCreate, db: Session = Depends(get_db)):
    # Check user exists
    from app.models.user_model import User as UserModel
    user = db.query(UserModel).filter(UserModel.id == profile_data.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    
    # Check plate number uniqueness
    existing = db.query(DriverProfileModel).filter(DriverProfileModel.vehicle_plate_number == profile_data.vehicle_plate_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Plate number already registered")
    
    profile = DriverProfileModel(
        user_id=profile_data.user_id,
        vehicle_brand=profile_data.vehicle_brand,
        vehicle_plate_number=profile_data.vehicle_plate_number,
        capacity_kg=profile_data.capacity_kg,
        capacity_m3=profile_data.capacity_m3,
        has_refrigerator=profile_data.has_refrigerator,
        vehicle_type=profile_data.vehicle_type,
        is_verified=profile_data.is_verified,
        current_status=profile_data.current_status,
        rating_completed_trips=profile_data.rating_completed_trips,
        rating_failed_trips=profile_data.rating_failed_trips,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.put("/{profile_id}", response_model=DriverProfileSchema)
async def update_driver_profile(profile_id: UUID, profile_data: DriverProfileUpdate, db: Session = Depends(get_db)):
    profile = db.query(DriverProfileModel).filter(DriverProfileModel.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Driver profile not found")
    
    if profile_data.vehicle_plate_number and profile_data.vehicle_plate_number != profile.vehicle_plate_number:
        existing = db.query(DriverProfileModel).filter(DriverProfileModel.vehicle_plate_number == profile_data.vehicle_plate_number).first()
        if existing:
            raise HTTPException(status_code=400, detail="Plate number already registered")
    
    update_data = profile_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_driver_profile(profile_id: UUID, db: Session = Depends(get_db)):
    profile = db.query(DriverProfileModel).filter(DriverProfileModel.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Driver profile not found")
    db.delete(profile)
    db.commit()
    return None
