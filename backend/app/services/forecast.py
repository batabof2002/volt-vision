"""Forecast service for predicting future energy and savings."""
from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session
from app.services.calculations import EnergyCalculator
from app.config import get_settings
import statistics


class ForecastService:
    """Service for forecasting energy production and savings."""
    
    def __init__(self, db: Session):
        self.db = db
        self.calculator = EnergyCalculator(db)
        self.settings = get_settings()
    
    def forecast_savings(self, days: int = 7, based_on_last_n_days: int = 7) -> dict:
        """
        Forecast energy savings for the next N days based on historical average.
        
        Args:
            days: Number of days to forecast
            based_on_last_n_days: Number of historical days to average
        
        Returns:
            Dictionary with forecast data
        """
        # Get historical data
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=based_on_last_n_days)
        
        # Calculate daily averages from historical data
        daily_renewable_energy = []
        daily_money_saved = []
        
        for i in range(based_on_last_n_days):
            day_date = start_date + timedelta(days=i)
            summary = self.calculator.calculate_daily_summary(day_date)
            
            renewable_kwh = summary["renewable_energy_used_wh"] / 1000.0
            money_saved = summary["money_saved_cad_today"]
            
            if renewable_kwh > 0:  # Only include days with data
                daily_renewable_energy.append(renewable_kwh)
                daily_money_saved.append(money_saved)
        
        if not daily_renewable_energy:
            # No historical data, return zero forecast
            forecasts = []
            for i in range(days):
                forecast_date = end_date + timedelta(days=i + 1)
                forecasts.append({
                    "date": forecast_date.strftime("%Y-%m-%d"),
                    "predicted_renewable_energy_kwh": 0.0,
                    "predicted_money_saved_cad": 0.0,
                    "confidence_lower": 0.0,
                    "confidence_upper": 0.0,
                })
            return {
                "forecast_days": days,
                "based_on_last_n_days": based_on_last_n_days,
                "forecasts": forecasts,
            }
        
        # Calculate averages and standard deviation for confidence intervals
        avg_renewable = statistics.mean(daily_renewable_energy)
        avg_money = statistics.mean(daily_money_saved)
        
        # Calculate standard deviation if we have enough data
        if len(daily_renewable_energy) > 1:
            std_renewable = statistics.stdev(daily_renewable_energy)
            std_money = statistics.stdev(daily_money_saved)
        else:
            std_renewable = avg_renewable * 0.2  # 20% uncertainty
            std_money = avg_money * 0.2
        
        # Generate forecasts
        forecasts = []
        for i in range(days):
            forecast_date = end_date + timedelta(days=i + 1)
            
            # Simple forecast: use average with confidence bands
            # In production, could use more sophisticated methods (ARIMA, ML, weather data)
            forecasts.append({
                "date": forecast_date.strftime("%Y-%m-%d"),
                "predicted_renewable_energy_kwh": round(avg_renewable, 2),
                "predicted_money_saved_cad": round(avg_money, 2),
                "confidence_lower": round(avg_money - std_money, 2),
                "confidence_upper": round(avg_money + std_money, 2),
            })
        
        return {
            "forecast_days": days,
            "based_on_last_n_days": based_on_last_n_days,
            "forecasts": forecasts,
        }
