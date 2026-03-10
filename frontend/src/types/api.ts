/**
 * TypeScript types matching backend API responses
 */

export interface TelemetryReading {
  id: number;
  timestamp: string;
  solar_power_w: number;
  wind_power_w: number;
  load_power_w: number;
  battery_soc_pct: number;
  battery_energy_wh: number;
  battery_charge_power_w: number;
  grid_import_power_w?: number;
  grid_export_power_w?: number;
}

export interface TelemetryReadingCreate {
  timestamp?: string;
  solar_power_w: number;
  wind_power_w: number;
  load_power_w: number;
  battery_soc_pct: number;
  battery_energy_wh: number;
  battery_charge_power_w: number;
  grid_import_power_w?: number;
  grid_export_power_w?: number;
}

export interface DailySummary {
  date: string;
  solar_energy_wh_today: number;
  wind_energy_wh_today: number;
  load_energy_wh_today: number;
  battery_discharge_energy_wh_today: number;
  renewable_energy_used_wh: number;
  co2_saved_kg_today: number;
  money_saved_cad_today: number;
  current_solar_power_w: number;
  current_wind_power_w: number;
  current_load_power_w: number;
  current_battery_soc_pct: number;
  current_battery_energy_wh: number;
}

export interface ForecastDay {
  date: string;
  predicted_renewable_energy_kwh: number;
  predicted_money_saved_cad: number;
  confidence_lower: number;
  confidence_upper: number;
}

export interface Forecast {
  forecast_days: number;
  based_on_last_n_days: number;
  forecasts: ForecastDay[];
}

export interface SystemSettings {
  electricity_rate_cad_per_kwh: number;
  co2_intensity_kg_per_kwh: number;
  battery_capacity_wh: number;
  solar_peak_power_w: number;
  wind_peak_power_w: number;
}

export interface SettingsUpdate {
  electricity_rate_cad_per_kwh?: number;
  co2_intensity_kg_per_kwh?: number;
}
