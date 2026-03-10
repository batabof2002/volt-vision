"""Application configuration."""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings."""
    
    # Database
    database_url: str = "sqlite:///./energy_system.db"
    
    # Energy calculation constants
    electricity_rate_cad_per_kwh: float = 0.18
    co2_intensity_kg_per_kwh: float = 0.03  # Ontario average
    
    # Simulation settings
    simulation_enabled: bool = True
    simulation_interval_seconds: int = 60
    
    # Battery specs (for realistic simulation)
    battery_capacity_wh: float = 10000  # 10 kWh battery
    battery_max_charge_power_w: float = 3000  # 3 kW max charge rate
    battery_max_discharge_power_w: float = 3000  # 3 kW max discharge rate
    
    # Solar/Wind specs (for simulation)
    solar_peak_power_w: float = 5000  # 5 kW solar array
    wind_peak_power_w: float = 3000  # 3 kW wind turbine
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
