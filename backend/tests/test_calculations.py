"""Tests for energy calculations."""
import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.telemetry import TelemetryReading
from app.services.calculations import EnergyCalculator


@pytest.fixture
def db_session():
    """Create a test database session."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


def test_energy_integration_simple(db_session):
    """Test simple energy integration calculation."""
    # Create test data: constant 1000W for 1 hour
    start_time = datetime(2026, 1, 21, 12, 0, 0)
    
    # Two readings 1 hour apart at 1000W
    reading1 = TelemetryReading(
        timestamp=start_time,
        solar_power_w=1000.0,
        wind_power_w=0.0,
        load_power_w=0.0,
        battery_soc_pct=50.0,
        battery_energy_wh=5000.0,
        battery_charge_power_w=0.0
    )
    reading2 = TelemetryReading(
        timestamp=start_time + timedelta(hours=1),
        solar_power_w=1000.0,
        wind_power_w=0.0,
        load_power_w=0.0,
        battery_soc_pct=50.0,
        battery_energy_wh=5000.0,
        battery_charge_power_w=0.0
    )
    
    db_session.add(reading1)
    db_session.add(reading2)
    db_session.commit()
    
    # Calculate daily summary
    calculator = EnergyCalculator(db_session)
    summary = calculator.calculate_daily_summary(start_time)
    
    # 1000W for 1 hour = 1000Wh
    assert summary["solar_energy_wh_today"] == 1000.0
    assert summary["wind_energy_wh_today"] == 0.0


def test_energy_integration_variable(db_session):
    """Test energy integration with variable power."""
    start_time = datetime(2026, 1, 21, 12, 0, 0)
    
    # Create readings with varying power over 2 hours
    readings = [
        (0, 0),      # 0W at t=0
        (30, 1000),  # 1000W at t=30min
        (60, 2000),  # 2000W at t=60min
        (120, 1000), # 1000W at t=120min
    ]
    
    for minutes, power in readings:
        reading = TelemetryReading(
            timestamp=start_time + timedelta(minutes=minutes),
            solar_power_w=power,
            wind_power_w=0.0,
            load_power_w=0.0,
            battery_soc_pct=50.0,
            battery_energy_wh=5000.0,
            battery_charge_power_w=0.0
        )
        db_session.add(reading)
    
    db_session.commit()
    
    calculator = EnergyCalculator(db_session)
    summary = calculator.calculate_daily_summary(start_time)
    
    # Trapezoidal integration:
    # (0+1000)/2 * 0.5h + (1000+2000)/2 * 0.5h + (2000+1000)/2 * 1h
    # = 250 + 750 + 1500 = 2500 Wh
    assert abs(summary["solar_energy_wh_today"] - 2500.0) < 1.0


def test_battery_discharge_calculation(db_session):
    """Test battery discharge energy calculation."""
    start_time = datetime(2026, 1, 21, 12, 0, 0)
    
    # Create readings with battery discharging
    readings = [
        (0, 0, 0),        # No discharge
        (30, 0, -500),    # Discharging at 500W
        (60, 0, -500),    # Still discharging at 500W
        (90, 0, 500),     # Now charging at 500W (should not count)
    ]
    
    for minutes, solar, battery in readings:
        reading = TelemetryReading(
            timestamp=start_time + timedelta(minutes=minutes),
            solar_power_w=solar,
            wind_power_w=0.0,
            load_power_w=0.0,
            battery_soc_pct=50.0,
            battery_energy_wh=5000.0,
            battery_charge_power_w=battery
        )
        db_session.add(reading)
    
    db_session.commit()
    
    calculator = EnergyCalculator(db_session)
    summary = calculator.calculate_daily_summary(start_time)
    
    # Discharge: (0+500)/2 * 0.5h + (500+500)/2 * 0.5h = 125 + 250 = 375 Wh
    assert abs(summary["battery_discharge_energy_wh_today"] - 375.0) < 1.0


def test_co2_and_money_calculation(db_session):
    """Test CO2 and money savings calculations."""
    start_time = datetime(2026, 1, 21, 12, 0, 0)
    
    # Create readings with 10 kWh of renewable energy over the day
    reading1 = TelemetryReading(
        timestamp=start_time,
        solar_power_w=5000.0,
        wind_power_w=5000.0,
        load_power_w=8000.0,
        battery_soc_pct=50.0,
        battery_energy_wh=5000.0,
        battery_charge_power_w=2000.0
    )
    reading2 = TelemetryReading(
        timestamp=start_time + timedelta(hours=1),
        solar_power_w=5000.0,
        wind_power_w=5000.0,
        load_power_w=8000.0,
        battery_soc_pct=60.0,
        battery_energy_wh=6000.0,
        battery_charge_power_w=2000.0
    )
    
    db_session.add(reading1)
    db_session.add(reading2)
    db_session.commit()
    
    calculator = EnergyCalculator(db_session)
    summary = calculator.calculate_daily_summary(start_time)
    
    # Total renewable: 10 kWh (5kW solar + 5kW wind for 1 hour)
    renewable_kwh = summary["renewable_energy_used_wh"] / 1000.0
    assert abs(renewable_kwh - 10.0) < 0.1
    
    # CO2 saved: 10 kWh * 0.03 kg/kWh = 0.3 kg (using default settings)
    # Money saved: 10 kWh * 0.18 CAD/kWh = 1.8 CAD
    assert abs(summary["co2_saved_kg_today"] - 0.3) < 0.01
    assert abs(summary["money_saved_cad_today"] - 1.8) < 0.01


def test_no_data_summary(db_session):
    """Test summary with no data returns zeros."""
    start_time = datetime(2026, 1, 21, 12, 0, 0)
    
    calculator = EnergyCalculator(db_session)
    summary = calculator.calculate_daily_summary(start_time)
    
    assert summary["solar_energy_wh_today"] == 0.0
    assert summary["wind_energy_wh_today"] == 0.0
    assert summary["co2_saved_kg_today"] == 0.0
    assert summary["money_saved_cad_today"] == 0.0
