# API Testing Examples

## Health Check
```bash
curl http://localhost:8000/health
```

## Get All Telemetry (Last 24h)
```bash
curl http://localhost:8000/api/telemetry
```

## Get Telemetry with Time Range
```bash
curl "http://localhost:8000/api/telemetry?from_time=2026-01-21T00:00:00&to_time=2026-01-21T23:59:59"
```

## Get Downsampled Telemetry (1 reading per 5 minutes)
```bash
curl "http://localhost:8000/api/telemetry?interval_minutes=5&limit=288"
```

## Post Manual Telemetry Reading
```bash
curl -X POST http://localhost:8000/api/telemetry \
  -H "Content-Type: application/json" \
  -d "{\"solar_power_w\":3500,\"wind_power_w\":1200,\"load_power_w\":2000,\"battery_soc_pct\":75,\"battery_energy_wh\":7500,\"battery_charge_power_w\":700}"
```

## Get Today's Summary
```bash
curl http://localhost:8000/api/summary/today
```

## Get Date Range Summary
```bash
curl "http://localhost:8000/api/summary/range?from_date=2026-01-01T00:00:00&to_date=2026-01-31T23:59:59"
```

## Get 7-Day Forecast
```bash
curl "http://localhost:8000/api/forecast?days=7&based_on_last_n_days=7"
```

## Get 30-Day Forecast (based on last 14 days)
```bash
curl "http://localhost:8000/api/forecast?days=30&based_on_last_n_days=14"
```

## Get Current Settings
```bash
curl http://localhost:8000/api/settings
```

## Update Settings
```bash
curl -X PUT http://localhost:8000/api/settings \
  -H "Content-Type: application/json" \
  -d "{\"electricity_rate_cad_per_kwh\":0.20,\"co2_intensity_kg_per_kwh\":0.040}"
```

## Delete All Telemetry Data (Reset)
```bash
curl -X DELETE http://localhost:8000/api/telemetry/all
```

## Batch Insert (Multiple Readings)
```bash
# Reading 1
curl -X POST http://localhost:8000/api/telemetry \
  -H "Content-Type: application/json" \
  -d "{\"solar_power_w\":2000,\"wind_power_w\":800,\"load_power_w\":1500,\"battery_soc_pct\":60,\"battery_energy_wh\":6000,\"battery_charge_power_w\":300}"

# Reading 2
curl -X POST http://localhost:8000/api/telemetry \
  -H "Content-Type: application/json" \
  -d "{\"solar_power_w\":4000,\"wind_power_w\":1500,\"load_power_w\":2500,\"battery_soc_pct\":70,\"battery_energy_wh\":7000,\"battery_charge_power_w\":1000}"

# Reading 3
curl -X POST http://localhost:8000/api/telemetry \
  -H "Content-Type: application/json" \
  -d "{\"solar_power_w\":3000,\"wind_power_w\":1000,\"load_power_w\":3000,\"battery_soc_pct\":65,\"battery_energy_wh\":6500,\"battery_charge_power_w\":0}"
```

## PowerShell Versions (Windows)

### Get Today's Summary
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/summary/today" -Method GET
```

### Post Telemetry Reading
```powershell
$body = @{
    solar_power_w = 3500
    wind_power_w = 1200
    load_power_w = 2000
    battery_soc_pct = 75
    battery_energy_wh = 7500
    battery_charge_power_w = 700
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/telemetry" -Method POST -Body $body -ContentType "application/json"
```

### Get Forecast
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/forecast?days=14&based_on_last_n_days=7" -Method GET
```
