"""Energy calculation service."""
from typing import List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.telemetry import TelemetryReading
from app.config import get_settings


class EnergyCalculator:
    """Handles all energy-related calculations."""
    
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()
    
    def calculate_daily_summary(self, date: datetime) -> dict:
        """Calculate summary statistics for a given date."""
        start_of_day = datetime(date.year, date.month, date.day, 0, 0, 0)
        end_of_day = start_of_day + timedelta(days=1)
        
        # Get all readings for the day
        readings = self.db.query(TelemetryReading).filter(
            TelemetryReading.timestamp >= start_of_day,
            TelemetryReading.timestamp < end_of_day
        ).order_by(TelemetryReading.timestamp.asc()).all()
        
        if not readings:
            # Return zeros if no data
            return {
                "date": start_of_day.strftime("%Y-%m-%d"),
                "solar_energy_wh_today": 0.0,
                "wind_energy_wh_today": 0.0,
                "load_energy_wh_today": 0.0,
                "battery_discharge_energy_wh_today": 0.0,
                "renewable_energy_used_wh": 0.0,
                "co2_saved_kg_today": 0.0,
                "money_saved_cad_today": 0.0,
                "current_solar_power_w": 0.0,
                "current_wind_power_w": 0.0,
                "current_load_power_w": 0.0,
                "current_battery_soc_pct": 50.0,
                "current_battery_energy_wh": 0.0,
            }
        
        # Calculate energy totals using trapezoidal integration
        solar_energy_wh = self._integrate_power(readings, "solar_power_w")
        wind_energy_wh = self._integrate_power(readings, "wind_power_w")
        load_energy_wh = self._integrate_power(readings, "load_power_w")
        
        # Calculate battery discharge energy (only negative charge power)
        battery_discharge_energy_wh = self._integrate_discharge(readings)
        
        # Renewable energy used = solar + wind (assumes all renewable is used or stored)
        renewable_energy_used_wh = solar_energy_wh + wind_energy_wh
        
        # Calculate savings
        renewable_energy_used_kwh = renewable_energy_used_wh / 1000.0
        co2_saved_kg = renewable_energy_used_kwh * self.settings.co2_intensity_kg_per_kwh
        money_saved_cad = renewable_energy_used_kwh * self.settings.electricity_rate_cad_per_kwh
        
        # Get current (latest) values
        latest = readings[-1]
        
        return {
            "date": start_of_day.strftime("%Y-%m-%d"),
            "solar_energy_wh_today": round(solar_energy_wh, 2),
            "wind_energy_wh_today": round(wind_energy_wh, 2),
            "load_energy_wh_today": round(load_energy_wh, 2),
            "battery_discharge_energy_wh_today": round(battery_discharge_energy_wh, 2),
            "renewable_energy_used_wh": round(renewable_energy_used_wh, 2),
            "co2_saved_kg_today": round(co2_saved_kg, 3),
            "money_saved_cad_today": round(money_saved_cad, 2),
            "current_solar_power_w": round(latest.solar_power_w, 2),
            "current_wind_power_w": round(latest.wind_power_w, 2),
            "current_load_power_w": round(latest.load_power_w, 2),
            "current_battery_soc_pct": round(latest.battery_soc_pct, 2),
            "current_battery_energy_wh": round(latest.battery_energy_wh, 2),
        }
    
    def calculate_range_summary(self, start_date: datetime, end_date: datetime) -> dict:
        """Calculate summary statistics for a date range."""
        readings = self.db.query(TelemetryReading).filter(
            TelemetryReading.timestamp >= start_date,
            TelemetryReading.timestamp < end_date
        ).order_by(TelemetryReading.timestamp.asc()).all()
        
        if not readings:
            return {
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
                "total_solar_energy_wh": 0.0,
                "total_wind_energy_wh": 0.0,
                "total_load_energy_wh": 0.0,
                "total_renewable_energy_used_wh": 0.0,
                "total_co2_saved_kg": 0.0,
                "total_money_saved_cad": 0.0,
            }
        
        solar_energy_wh = self._integrate_power(readings, "solar_power_w")
        wind_energy_wh = self._integrate_power(readings, "wind_power_w")
        load_energy_wh = self._integrate_power(readings, "load_power_w")
        renewable_energy_used_wh = solar_energy_wh + wind_energy_wh
        
        renewable_energy_used_kwh = renewable_energy_used_wh / 1000.0
        co2_saved_kg = renewable_energy_used_kwh * self.settings.co2_intensity_kg_per_kwh
        money_saved_cad = renewable_energy_used_kwh * self.settings.electricity_rate_cad_per_kwh
        
        return {
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "total_solar_energy_wh": round(solar_energy_wh, 2),
            "total_wind_energy_wh": round(wind_energy_wh, 2),
            "total_load_energy_wh": round(load_energy_wh, 2),
            "total_renewable_energy_used_wh": round(renewable_energy_used_wh, 2),
            "total_co2_saved_kg": round(co2_saved_kg, 3),
            "total_money_saved_cad": round(money_saved_cad, 2),
        }
    
    def _integrate_power(self, readings: List[TelemetryReading], power_field: str) -> float:
        """
        Integrate power over time using trapezoidal rule to get energy (Wh).
        
        Energy = integral of Power over time
        Using trapezoidal: E = sum((P1 + P2) / 2 * dt)
        """
        if len(readings) < 2:
            return 0.0
        
        total_energy = 0.0
        for i in range(len(readings) - 1):
            p1 = getattr(readings[i], power_field)
            p2 = getattr(readings[i + 1], power_field)
            dt_hours = (readings[i + 1].timestamp - readings[i].timestamp).total_seconds() / 3600.0
            energy = (p1 + p2) / 2.0 * dt_hours
            total_energy += energy
        
        return total_energy
    
    def _integrate_discharge(self, readings: List[TelemetryReading]) -> float:
        """Calculate total energy discharged from battery (only negative charge power)."""
        if len(readings) < 2:
            return 0.0
        
        total_discharge = 0.0
        for i in range(len(readings) - 1):
            p1 = min(readings[i].battery_charge_power_w, 0)  # Only negative (discharge)
            p2 = min(readings[i + 1].battery_charge_power_w, 0)
            dt_hours = (readings[i + 1].timestamp - readings[i].timestamp).total_seconds() / 3600.0
            energy = abs((p1 + p2) / 2.0 * dt_hours)  # abs to make positive
            total_discharge += energy
        
        return total_discharge
