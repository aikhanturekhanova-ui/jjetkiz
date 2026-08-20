from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.schemas.weather_snapshot_schema import WeatherSnapshotSchema, WeatherSnapshotCreate
from app.models.weather_snapshot_model import WeatherSnapshot as WeatherSnapshotModel
from app.db.session import get_db_session

router = APIRouter(prefix="/weather-snapshots", tags=["weather-snapshots"])


def get_db():
    yield from get_db_session()


@router.get("/", response_model=List[WeatherSnapshotSchema])
async def list_weather_snapshots(
    db: Session = Depends(get_db)
):
    snapshots = db.query(WeatherSnapshotModel).all()
    return snapshots


@router.get("/{snapshot_id}", response_model=WeatherSnapshotSchema)
async def get_weather_snapshot(snapshot_id: UUID, db: Session = Depends(get_db)):
    snapshot = db.query(WeatherSnapshotModel).filter(WeatherSnapshotModel.id == snapshot_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Weather snapshot not found")
    return snapshot


@router.post("/", response_model=WeatherSnapshotSchema, status_code=status.HTTP_201_CREATED)
async def create_weather_snapshot(snapshot_data: WeatherSnapshotCreate, db: Session = Depends(get_db)):
    snapshot = WeatherSnapshotModel(
        region_point_lat=snapshot_data.region_point_lat,
        region_point_lng=snapshot_data.region_point_lng,
        temperature_c=snapshot_data.temperature_c,
        wind_speed_ms=snapshot_data.wind_speed_ms,
        is_dust_storm_risk=snapshot_data.is_dust_storm_risk,
        fetched_at=snapshot_data.fetched_at or datetime.utcnow(),
    )
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    return snapshot
