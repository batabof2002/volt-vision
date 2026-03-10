# Quick Start Guide

## Start the System

### Terminal 1 - Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 - Frontend
```bash
cd frontend
npm install
npm run dev
```

### Access
- Dashboard: http://localhost:5173
- API Docs: http://localhost:8000/docs

## Quick Test

### 1. View Dashboard
Visit http://localhost:5173/dashboard
- Should see simulated data automatically (updates every 60 seconds)
- Charts update every 10 seconds

### 2. Manual Data Entry
Visit http://localhost:5173/data-input
- Enter custom readings
- Example values:
  - Solar: 3500 W
  - Wind: 1200 W
  - Load: 2000 W
  - Battery SOC: 75%
  - Battery Energy: 7500 Wh
  - Battery Charge Power: 700 W

### 3. API Test
```bash
# Get today's summary
curl http://localhost:8000/api/summary/today

# Get telemetry (last 24h)
curl http://localhost:8000/api/telemetry

# Get forecast
curl "http://localhost:8000/api/forecast?days=7"

# Post manual reading
curl -X POST http://localhost:8000/api/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "solar_power_w": 3500,
    "wind_power_w": 1200,
    "load_power_w": 2000,
    "battery_soc_pct": 75,
    "battery_energy_wh": 7500,
    "battery_charge_power_w": 700
  }'
```

## Key Features

✅ Real-time power monitoring (Solar, Wind, Load, Battery)
✅ Automatic data simulation (realistic patterns)
✅ Manual data entry via web form
✅ Time-series charts (1h, 6h, 24h views)
✅ Daily energy totals (kWh)
✅ CO₂ savings tracking
✅ Money savings calculations
✅ 7/14/30-day forecasts
✅ Configurable electricity rates & CO₂ intensity
✅ REST API for hardware integration
✅ Production-ready architecture

## File Structure

```
Capstone Project/
├── backend/          # Python FastAPI backend
│   ├── app/
│   ├── tests/
│   └── requirements.txt
├── frontend/         # React TypeScript frontend
│   ├── src/
│   └── package.json
└── README.md         # Complete documentation
```

## Troubleshooting

**No data showing?**
- Wait 60 seconds for first simulated reading
- Check backend is running: http://localhost:8000/health

**Port conflicts?**
- Backend: Change port in uvicorn command
- Frontend: Update vite.config.ts

**Dependencies issues?**
- Backend: `pip install -r requirements.txt --force-reinstall`
- Frontend: `rm -rf node_modules && npm install`
