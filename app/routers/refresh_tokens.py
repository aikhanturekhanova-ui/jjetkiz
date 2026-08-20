from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from datetime import datetime

from app.schemas.refresh_token_schema import RefreshTokenSchema, RefreshTokenCreate, RefreshTokenUpdate
from app.models.refresh_token_model import RefreshToken as RefreshTokenModel
from app.models.user_model import User as UserModel
from app.db.session import get_db_session

router = APIRouter(prefix="/refresh-tokens", tags=["refresh-tokens"])


def get_db():
    yield from get_db_session()


@router.get("/", response_model=List[RefreshTokenSchema])
async def list_refresh_tokens(
    user_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    query = db.query(RefreshTokenModel)
    if user_id:
        query = query.filter(RefreshTokenModel.user_id == user_id)
    tokens = query.all()
    return tokens


@router.get("/{token_id}", response_model=RefreshTokenSchema)
async def get_refresh_token(token_id: UUID, db: Session = Depends(get_db)):
    token = db.query(RefreshTokenModel).filter(RefreshTokenModel.id == token_id).first()
    if not token:
        raise HTTPException(status_code=404, detail="Refresh token not found")
    return token


@router.post("/", response_model=RefreshTokenSchema, status_code=status.HTTP_201_CREATED)
async def create_refresh_token(token_data: RefreshTokenCreate, db: Session = Depends(get_db)):
    # Validate user exists
    user = db.query(UserModel).filter(UserModel.id == token_data.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    
    # Check for active (non-revoked, non-expired) tokens
    existing_active = db.query(RefreshTokenModel).filter(
        RefreshTokenModel.user_id == token_data.user_id,
        RefreshTokenModel.revoked_at.is_(None),
        RefreshTokenModel.expires_at > datetime.utcnow()
    ).first()
    if existing_active:
        raise HTTPException(
            status_code=400, 
            detail="User already has an active refresh token"
        )
    
    token = RefreshTokenModel(
        user_id=token_data.user_id,
        token_hash=token_data.token_hash,
        expires_at=token_data.expires_at,
    )
    db.add(token)
    db.commit()
    db.refresh(token)
    return token


@router.put("/{token_id}/revoke", response_model=RefreshTokenSchema)
async def revoke_refresh_token(token_id: UUID, db: Session = Depends(get_db)):
    token = db.query(RefreshTokenModel).filter(RefreshTokenModel.id == token_id).first()
    if not token:
        raise HTTPException(status_code=404, detail="Refresh token not found")
    
    token.revoked_at = datetime.utcnow()
    db.commit()
    db.refresh(token)
    return token
