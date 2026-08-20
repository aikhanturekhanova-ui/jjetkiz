import hashlib
import os
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models.refresh_token_model import RefreshToken
from app.models.user_model import User

router = APIRouter(prefix="/auth", tags=["auth"])

TOKEN_TTL_DAYS = 30


def get_db():
    yield from get_db_session()


def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()


def issue_token(db: Session, user_id) -> str:
    token = uuid.uuid4().hex
    existing = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > datetime.utcnow(),
        )
        .first()
    )
    if existing:
        existing.revoked_at = datetime.utcnow()
    db.add(
        RefreshToken(
            user_id=user_id,
            token_hash=hashlib.sha256(token.encode("utf-8")).hexdigest(),
            expires_at=datetime.utcnow() + timedelta(days=TOKEN_TTL_DAYS),
        )
    )
    db.commit()
    return token


def user_payload(user: User) -> dict:
    return {
        "id": str(user.id),
        "phone": user.phone,
        "role": user.role,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "profile_status": user.profile_status,
    }


class RegisterRequest(BaseModel):
    phone: str = Field(..., min_length=1, max_length=20)
    password: str = Field(..., min_length=4, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=255)


class LoginRequest(BaseModel):
    phone: str = Field(..., min_length=1, max_length=20)
    password: str = Field(..., min_length=1, max_length=128)


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.phone == data.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Этот номер уже зарегистрирован")
    salt = os.urandom(16).hex()
    user = User(
        phone=data.phone,
        role="customer",
        full_name=data.full_name,
        is_active=True,
        profile_status="incomplete",
        password_hash=hash_password(data.password, salt) + ":" + salt,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = issue_token(db, user.id)
    return {"access_token": token, "token_type": "bearer", "user": user_payload(user)}


@router.post("/login")
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == data.phone).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Неверный номер или пароль")
    stored_hash, salt = user.password_hash.rsplit(":", 1)
    if stored_hash != hash_password(data.password, salt):
        raise HTTPException(status_code=401, detail="Неверный номер или пароль")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Аккаунт отключён")
    token = issue_token(db, user.id)
    return {"access_token": token, "token_type": "bearer", "user": user_payload(user)}


@router.get("/me")
async def me(user_id: str):
    db = next(get_db_session())
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user_payload(user)
    finally:
        db.close()