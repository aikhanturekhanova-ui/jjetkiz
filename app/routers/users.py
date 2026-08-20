from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.schemas.user_schema import UserSchema, UserCreate, UserUpdate
from app.models.user_model import User as UserModel
from app.db.session import get_db_session

router = APIRouter(prefix="/users", tags=["users"])


def get_db():
    from app.db.session import get_db_session
    yield from get_db_session()


@router.get("/", response_model=List[UserSchema])
async def list_users(db: Session = Depends(get_db)):
    users = db.query(UserModel).all()
    return users


@router.get("/{user_id}", response_model=UserSchema)
async def get_user(user_id: UUID, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(UserModel).filter(UserModel.phone == user_data.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    user = UserModel(
        phone=user_data.phone,
        role=user_data.role or "customer",
        full_name=user_data.full_name,
        is_active=user_data.is_active,
        profile_status=user_data.profile_status,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserSchema)
async def update_user(user_id: UUID, user_data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user_data.phone and user_data.phone != user.phone:
        existing = db.query(UserModel).filter(UserModel.phone == user_data.phone).first()
        if existing:
            raise HTTPException(status_code=400, detail="Phone number already registered")
    for field, value in user_data.dict(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: UUID, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return None
