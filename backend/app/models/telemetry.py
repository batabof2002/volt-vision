"""Telemetry data models."""
from sqlalchemy import Column, Integer, Float, DateTime, String, Index
from datetime import datetime
from app.database import Base


class TelemetryReading(Base):
    """Time-series telemetry reading."""
    
    __tablename__ = "telemetry_readings"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, nullable=False, index=True, default=datetime.utcnow)
    
    # Power measurements (instantaneous, Watts)
    solar_power_w = Column(Float, nullable=False, default=0.0)
    wind_power_w = Column(Float, nullable=False, default=0.0)
    load_power_w = Column(Float, nullable=False, default=0.0)
    
    # Battery state
    battery_soc_pct = Column(Float, nullable=False, default=50.0)  # 0-100%
    battery_energy_wh = Column(Float, nullable=False, default=0.0)
    battery_charge_power_w = Column(Float, nullable=False, default=0.0)  # +charging, -discharging
    
    # Grid interaction (optional)
    grid_import_power_w = Column(Float, nullable=True, default=0.0)
    grid_export_power_w = Column(Float, nullable=True, default=0.0)
    
    # Data source (simulated or manual)
    source = Column(String(20), nullable=True, default='manual')
    
    # Add composite index for time-range queries
    __table_args__ = (
        Index('idx_timestamp_desc', timestamp.desc()),
    )
    
    def __repr__(self):
        return f"<TelemetryReading(timestamp={self.timestamp}, solar={self.solar_power_w}W, wind={self.wind_power_w}W)>"
