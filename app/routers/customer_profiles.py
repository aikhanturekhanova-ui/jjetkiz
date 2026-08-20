from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.schemas.customer_profile_schema import CustomerProfileSchema, CustomerProfileCreate, CustomerProfileUpdate
from app.models.customer_profile_model import CustomerProfile as CustomerProfileModel
from app.models.user_model import User as UserModel
from app.db.session import get_db_session

router = APIRouter(prefix="/customer-profiles", tags=["customer-profiles"])


def get_db():
    yield from get_db_session()


@router.get("/", response_model=List[CustomerProfileSchema])
async def list_customer_profiles(db: Session = Depends(get_db)):
    profiles = db.query(CustomerProfileModel).all()
    return profiles


@router.get("/{profile_id}", response_model=CustomerProfileSchema)
async def get_customer_profile(profile_id: UUID, db: Session = Depends(get_db)):
    profile = db.query(CustomerProfileModel).filter(CustomerProfileModel.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Customer profile not found")
    return profile


@router.post("/", response_model=CustomerProfileSchema, status_code=status.HTTP_201_CREATED)
async def create_customer_profile(profile_data: CustomerProfileCreate, db: Session = Depends(get_db)):
    # Check user exists
    user = db.query(UserModel).filter(UserModel.id == profile_data.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    
    # Check user_id uniqueness
    existing = db.query(CustomerProfileModel).filter(CustomerProfileModel.user_id == profile_data.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already has a customer profile")
    
    profile = CustomerProfileModel(
        user_id=profile_data.user_id,
        company_name=profile_data.company_name,
        settlement=profile_data.settlement,
        business_type=profile_data.business_type,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.put("/{profile_id}", response_model=CustomerProfileSchema)
async def update_customer_profile(profile_id: UUID, profile_data: CustomerProfileUpdate, db: Session = Depends(get_db)):
    profile = db.query(CustomerProfileModel).filter(CustomerProfileModel.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Customer profile not found")
    
    update_data = profile_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer_profile(profile_id: UUID, db: Session = Depends(get_db)):
    profile = db.query(CustomerProfileModel).filter(CustomerProfileModel.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Customer profile not found")
    db.delete(profile)
    db.commit()
    return None
