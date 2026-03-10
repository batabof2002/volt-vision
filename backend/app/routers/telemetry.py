"""Telemetry API routes."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models.telemetry import TelemetryReading
from app.schemas import (
    TelemetryReadingCreate,
    TelemetryReadingResponse,
    DailySummaryResponse,
    ForecastResponse,
    SettingsUpdate,
    SettingsResponse
)
from app.services import EnergyCalculator, ForecastService
from app.services.ingestor import ManualDataIngestor
from app.config import get_settings

router = APIRouter(prefix="/api", tags=["telemetry"])


@router.post("/telemetry", response_model=TelemetryReadingResponse, status_code=201)
def create_telemetry_reading(
    reading: TelemetryReadingCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new telemetry reading (manual data entry).
    
    Example:
    ```
    POST /api/telemetry
    {
        "solar_power_w": 3500,
        "wind_power_w": 1200,
        "load_power_w": 2000,
        "battery_soc_pct": 75,
        "battery_energy_wh": 7500,
        "battery_charge_power_w": 700
    }
    ```
    """
    ingestor = ManualDataIngestor()
    reading_data = reading.model_dump()
    if reading_data["timestamp"] is None:
        reading_data["timestamp"] = datetime.utcnow()
    
    db_reading = ingestor.ingest_reading(db, reading_data)
    return db_reading


@router.get("/telemetry", response_model=List[TelemetryReadingResponse])
def get_telemetry_readings(
    from_time: Optional[datetime] = Query(None, description="Start time (ISO format)"),
    to_time: Optional[datetime] = Query(None, description="End time (ISO format)"),
    interval_minutes: Optional[int] = Query(None, description="Downsampling interval in minutes"),
    limit: int = Query(1000, le=10000, description="Maximum number of readings"),
    db: Session = Depends(get_db)
):
    """
    Get telemetry readings with optional time range filtering and downsampling.
    
    Examples:
    - Get last 24 hours: GET /api/telemetry?from_time=2026-01-20T00:00:00
    - Get last 100 readings: GET /api/telemetry?limit=100
    - Get downsampled (1 per 5 min): GET /api/telemetry?interval_minutes=5
    """
    query = db.query(TelemetryReading)
    
    # Apply time filters
    if from_time:
        query = query.filter(TelemetryReading.timestamp >= from_time)
    if to_time:
        query = query.filter(TelemetryReading.timestamp <= to_time)
    
    # If no time filter, default to last 24 hours
    if not from_time and not to_time:
        from_time = datetime.utcnow() - timedelta(hours=24)
        query = query.filter(TelemetryReading.timestamp >= from_time)
    
    query = query.order_by(TelemetryReading.timestamp.desc())
    
    # Apply downsampling if requested
    if interval_minutes and interval_minutes > 0:
        # Simple downsampling: take one reading every N minutes
        all_readings = query.all()
        downsampled = []
        last_timestamp = None
        
        for reading in reversed(all_readings):  # Process chronologically
            if last_timestamp is None or \
               (reading.timestamp - last_timestamp).total_seconds() >= interval_minutes * 60:
                downsampled.append(reading)
                last_timestamp = reading.timestamp
        
        return list(reversed(downsampled[-limit:]))  # Return in desc order
    else:
        return query.limit(limit).all()


@router.get("/summary/today", response_model=DailySummaryResponse)
def get_today_summary(db: Session = Depends(get_db)):
    """
    Get summary statistics for today.
    
    Returns:
    - Daily energy totals (solar, wind, load)
    - Battery discharge energy used
    - CO2 saved
    - Money saved
    - Current power readings
    """
    calculator = EnergyCalculator(db)
    summary = calculator.calculate_daily_summary(datetime.utcnow())
    return summary


@router.get("/summary/range")
def get_range_summary(
    from_date: datetime = Query(..., description="Start date"),
    to_date: datetime = Query(..., description="End date"),
    db: Session = Depends(get_db)
):
    """
    Get summary statistics for a custom date range.
    
    Example: GET /api/summary/range?from_date=2026-01-01T00:00:00&to_date=2026-01-31T23:59:59
    """
    if from_date >= to_date:
        raise HTTPException(status_code=400, detail="from_date must be before to_date")
    
    calculator = EnergyCalculator(db)
    summary = calculator.calculate_range_summary(from_date, to_date)
    return summary


@router.get("/forecast", response_model=ForecastResponse)
def get_forecast(
    days: int = Query(7, ge=1, le=90, description="Number of days to forecast"),
    based_on_last_n_days: int = Query(7, ge=1, le=365, description="Historical days to base forecast on"),
    db: Session = Depends(get_db)
):
    """
    Get energy and savings forecast for the next N days.
    
    Uses rolling average of the last N days to predict future performance.
    
    Example: GET /api/forecast?days=14&based_on_last_n_days=7
    """
    forecast_service = ForecastService(db)
    forecast = forecast_service.forecast_savings(days, based_on_last_n_days)
    return forecast


@router.get("/settings", response_model=SettingsResponse)
def get_settings():
    """Get current system settings."""
    settings = get_settings()
    return {
        "electricity_rate_cad_per_kwh": settings.electricity_rate_cad_per_kwh,
        "co2_intensity_kg_per_kwh": settings.co2_intensity_kg_per_kwh,
        "battery_capacity_wh": settings.battery_capacity_wh,
        "solar_peak_power_w": settings.solar_peak_power_w,
        "wind_peak_power_w": settings.wind_peak_power_w,
    }


@router.put("/settings", response_model=SettingsResponse)
def update_settings(settings_update: SettingsUpdate):
    """
    Update system settings (electricity rate and CO2 intensity).
    
    Note: This updates the in-memory settings. For persistent changes, update the .env file.
    """
    settings = get_settings()
    
    if settings_update.electricity_rate_cad_per_kwh is not None:
        settings.electricity_rate_cad_per_kwh = settings_update.electricity_rate_cad_per_kwh
    
    if settings_update.co2_intensity_kg_per_kwh is not None:
        settings.co2_intensity_kg_per_kwh = settings_update.co2_intensity_kg_per_kwh
    
    return {
        "electricity_rate_cad_per_kwh": settings.electricity_rate_cad_per_kwh,
        "co2_intensity_kg_per_kwh": settings.co2_intensity_kg_per_kwh,
        "battery_capacity_wh": settings.battery_capacity_wh,
        "solar_peak_power_w": settings.solar_peak_power_w,
        "wind_peak_power_w": settings.wind_peak_power_w,
    }


@router.delete("/telemetry/all", status_code=204)
def delete_all_telemetry(db: Session = Depends(get_db)):
    """Delete all telemetry data (useful for testing/reset)."""
    db.query(TelemetryReading).delete()
    db.commit()
    return None
