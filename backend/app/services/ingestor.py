"""Data ingestion service with pluggable implementations."""
import math
import random
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.models.telemetry import TelemetryReading
from app.config import get_settings


class DataIngestor(ABC):
    """Abstract base class for data ingestors."""
    
    @abstractmethod
    def ingest_reading(self, db: Session, reading_data: dict) -> TelemetryReading:
        """Ingest a telemetry reading."""
        pass


class ManualDataIngestor(DataIngestor):
    """Ingests manually provided data."""
    
    def ingest_reading(self, db: Session, reading_data: dict) -> TelemetryReading:
        """Store a manually provided reading."""
        # Add source field to distinguish from simulated data
        reading_data['source'] = 'manual'
        reading = TelemetryReading(**reading_data)
        db.add(reading)
        db.commit()
        db.refresh(reading)
        return reading


class SimulatedDataIngestor(DataIngestor):
    """Generates realistic simulated data based on time of day and patterns."""
    
    def __init__(self):
        self.settings = get_settings()
        self.last_battery_energy = self.settings.battery_capacity_wh * 0.5  # Start at 50%
    
    def ingest_reading(self, db: Session, reading_data: Optional[dict] = None) -> TelemetryReading:
        """Generate and store a simulated reading."""
        timestamp = datetime.utcnow()
        
        # Generate realistic solar power (depends on time of day)
        solar_power_w = self._simulate_solar_power(timestamp)
        
        # Generate realistic wind power (more random, some daily pattern)
        wind_power_w = self._simulate_wind_power(timestamp)
        
        # Generate realistic load (higher during day, lower at night)
        load_power_w = self._simulate_load_power(timestamp)
        
        # Calculate battery behavior
        renewable_power = solar_power_w + wind_power_w
        net_power = renewable_power - load_power_w
        
        # Battery charging/discharging
        battery_charge_power_w = 0.0
        if net_power > 0:
            # Excess renewable power -> charge battery
            battery_charge_power_w = min(net_power, self.settings.battery_max_charge_power_w)
        elif net_power < 0:
            # Deficit -> discharge battery
            battery_charge_power_w = max(net_power, -self.settings.battery_max_discharge_power_w)
        
        # Update battery energy (assume 1 minute intervals)
        time_interval_hours = self.settings.simulation_interval_seconds / 3600.0
        energy_delta = battery_charge_power_w * time_interval_hours
        self.last_battery_energy = max(0, min(
            self.settings.battery_capacity_wh,
            self.last_battery_energy + energy_delta
        ))
        
        battery_soc_pct = (self.last_battery_energy / self.settings.battery_capacity_wh) * 100.0
        
        # Grid import/export (simplified)
        grid_import_power_w = 0.0
        grid_export_power_w = 0.0
        if net_power < 0 and self.last_battery_energy <= 0:
            # Need to import from grid
            grid_import_power_w = abs(net_power)
        elif net_power > 0 and self.last_battery_energy >= self.settings.battery_capacity_wh:
            # Export excess to grid
            grid_export_power_w = net_power
        
        reading = TelemetryReading(
            timestamp=timestamp,
            solar_power_w=round(solar_power_w, 2),
            wind_power_w=round(wind_power_w, 2),
            load_power_w=round(load_power_w, 2),
            battery_soc_pct=round(battery_soc_pct, 2),
            battery_energy_wh=round(self.last_battery_energy, 2),
            battery_charge_power_w=round(battery_charge_power_w, 2),
            grid_import_power_w=round(grid_import_power_w, 2),
            grid_export_power_w=round(grid_export_power_w, 2),
            source='simulated',  # Mark as simulated data
        )
        
        db.add(reading)
        db.commit()
        db.refresh(reading)
        return reading
    
    def _simulate_solar_power(self, timestamp: datetime) -> float:
        """Simulate solar power with random values (not time-dependent)."""
        # Random value between 0 and solar_peak_power_w
        # This allows testing with halogen lamp at any time
        return random.uniform(0, self.settings.solar_peak_power_w)
    
    def _simulate_wind_power(self, timestamp: datetime) -> float:
        """Simulate wind power with random values (not time-dependent)."""
        # Random value between 0 and wind_peak_power_w
        # This allows testing with actual wind turbine at any time
        return random.uniform(0, self.settings.wind_peak_power_w)
    
    def _simulate_load_power(self, timestamp: datetime) -> float:
        """Simulate load power based on typical usage patterns."""
        hour = timestamp.hour
        
        # Typical residential load pattern
        if 0 <= hour < 6:
            # Night: low load (sleeping)
            base_load = random.uniform(300, 600)
        elif 6 <= hour < 9:
            # Morning: medium-high (breakfast, getting ready)
            base_load = random.uniform(1200, 2000)
        elif 9 <= hour < 17:
            # Day: medium (some appliances)
            base_load = random.uniform(800, 1500)
        elif 17 <= hour < 22:
            # Evening: high (cooking, entertainment)
            base_load = random.uniform(1500, 2500)
        else:
            # Late evening: medium (winding down)
            base_load = random.uniform(800, 1200)
        
        # Add random spikes (appliances turning on/off)
        if random.random() < 0.1:  # 10% chance of spike
            base_load += random.uniform(500, 1500)
        
        return base_load


# Global simulator instance for background task
_simulator_instance: Optional[SimulatedDataIngestor] = None


def get_simulator() -> SimulatedDataIngestor:
    """Get or create the global simulator instance."""
    global _simulator_instance
    if _simulator_instance is None:
        _simulator_instance = SimulatedDataIngestor()
    return _simulator_instance
