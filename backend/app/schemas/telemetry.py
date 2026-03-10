"""Pydantic schemas for telemetry data."""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class TelemetryReadingCreate(BaseModel):
    """Schema for creating a telemetry reading."""
    
    timestamp: Optional[datetime] = None
    solar_power_w: float = Field(ge=0, description="Solar power in Watts")
    wind_power_w: float = Field(ge=0, description="Wind power in Watts")
    load_power_w: float = Field(ge=0, description="Load power in Watts")
    battery_soc_pct: float = Field(ge=0, le=100, description="Battery State of Charge %")
    battery_energy_wh: float = Field(ge=0, description="Battery energy in Wh")
    battery_charge_power_w: float = Field(description="Battery charge power (+ charging, - discharging)")
    grid_import_power_w: Optional[float] = Field(default=0.0, ge=0)
    grid_export_power_w: Optional[float] = Field(default=0.0, ge=0)
    source: Optional[str] = Field(default='manual', description="Data source: 'manual' or 'simulated'")


class TelemetryReadingResponse(BaseModel):
    """Schema for telemetry reading response."""
    
    id: int
    timestamp: datetime
    solar_power_w: float
    wind_power_w: float
    load_power_w: float
    battery_soc_pct: float
    battery_energy_wh: float
    battery_charge_power_w: float
    grid_import_power_w: Optional[float]
    grid_export_power_w: Optional[float]
    source: Optional[str] = 'manual'
    
    class Config:
        from_attributes = True


class DailySummaryResponse(BaseModel):
    """Schema for daily summary statistics."""
    
    date: str
    solar_energy_wh_today: float
    wind_energy_wh_today: float
    load_energy_wh_today: float
    battery_discharge_energy_wh_today: float
    renewable_energy_used_wh: float
    co2_saved_kg_today: float
    money_saved_cad_today: float
    
    # Current status
    current_solar_power_w: float
    current_wind_power_w: float
    current_load_power_w: float
    current_battery_soc_pct: float
    current_battery_energy_wh: float


class ForecastDayResponse(BaseModel):
    """Schema for a single day forecast."""
    
    date: str
    predicted_renewable_energy_kwh: float
    predicted_money_saved_cad: float
    confidence_lower: float
    confidence_upper: float


class ForecastResponse(BaseModel):
    """Schema for forecast response."""
    
    forecast_days: int
    based_on_last_n_days: int
    forecasts: List[ForecastDayResponse]


class SettingsUpdate(BaseModel):
    """Schema for updating system settings."""
    
    electricity_rate_cad_per_kwh: Optional[float] = Field(default=None, gt=0)
    co2_intensity_kg_per_kwh: Optional[float] = Field(default=None, ge=0)


class SettingsResponse(BaseModel):
    """Schema for settings response."""
    
    electricity_rate_cad_per_kwh: float
    co2_intensity_kg_per_kwh: float
    battery_capacity_wh: float
    solar_peak_power_w: float
    wind_peak_power_w: float
