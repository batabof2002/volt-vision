# Hybrid Energy System Dashboard

A production-ready web dashboard for monitoring and controlling a hybrid Solar + Wind + Battery energy system. Built for an Electrical Engineering capstone project.

![Tech Stack](https://img.shields.io/badge/Python-FastAPI-green)
![Tech Stack](https://img.shields.io/badge/React-TypeScript-blue)
![Tech Stack](https://img.shields.io/badge/Charts-Recharts-orange)
![Tech Stack](https://img.shields.io/badge/Database-SQLite-lightgrey)

## 🎯 Features

### Real-Time Monitoring
- **Live power flow visualization** (Solar, Wind, Load)
- **Battery state monitoring** (SOC, energy, charge/discharge rates)
- **Time-series charts** with adjustable time ranges (1h, 6h, 24h)
- **Auto-refresh** every 10 seconds

### Analytics & Insights
- **Daily summaries** with energy totals (kWh)
- **Environmental impact** tracking (CO₂ saved)
- **Financial savings** calculations (CAD)
- **7/14/30-day forecasts** based on historical data

### Data Ingestion
- **Automatic simulation** mode (generates realistic data)
- **Manual data entry** via web form
- **REST API** ready for hardware integration
- **Pluggable architecture** for easy sensor integration

### Configuration
- **Adjustable electricity rates** (CAD per kWh)
- **Configurable CO₂ intensity** (kg per kWh)
- **Regional presets** included (Ontario, Alberta, BC, etc.)

---

## 🏗️ Architecture

### Backend (Python FastAPI)
```
backend/
├── app/
│   ├── main.py              # FastAPI application & lifespan manager
│   ├── config.py            # Settings management
│   ├── database.py          # SQLAlchemy setup
│   ├── models/              # Database models
│   │   └── telemetry.py     # Time-series telemetry model
│   ├── schemas/             # Pydantic validation schemas
│   │   └── telemetry.py
│   ├── services/            # Business logic
│   │   ├── calculations.py  # Energy calculations
│   │   ├── ingestor.py      # Data ingestion (simulated & manual)
│   │   └── forecast.py      # Forecasting service
│   └── routers/             # API endpoints
│       └── telemetry.py
├── tests/                   # Unit tests
│   └── test_calculations.py
├── requirements.txt
└── .env.example
```

### Frontend (React + TypeScript)
```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout.tsx       # Main layout with navigation
│   │   └── KPICard.tsx      # Reusable KPI card component
│   ├── pages/
│   │   ├── Dashboard.tsx    # Main dashboard with charts
│   │   ├── DataInput.tsx    # Manual data entry page
│   │   └── Settings.tsx     # Configuration page
│   ├── services/
│   │   └── api.ts           # API service layer
│   ├── types/
│   │   └── api.ts           # TypeScript types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.9+**
- **Node.js 18+** and npm
- **Git**

### 1. Clone Repository
```bash
cd "c:\Users\omara\OneDrive\Desktop\Capstone Project"
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env

# Run backend server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: **http://localhost:8000**
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### 3. Frontend Setup

Open a **new terminal** (keep backend running):

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: **http://localhost:5173**

---

## 📊 Usage

### Dashboard
Visit http://localhost:5173/dashboard to see:
- Real-time power generation and consumption
- Battery state of charge
- Today's energy totals and savings
- Time-series charts
- 7/14/30-day forecasts

### Manual Data Entry
Visit http://localhost:5173/data-input to:
- Manually enter telemetry readings
- View API integration examples
- Reset database (danger zone)

### Settings
Visit http://localhost:5173/settings to:
- Adjust electricity rates
- Configure CO₂ intensity
- View regional reference values
- See system hardware specs

---

## 🔌 API Endpoints

### Telemetry

**POST /api/telemetry** - Create a new reading
```bash
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

**GET /api/telemetry** - Get readings with filters
```bash
# Last 24 hours
curl "http://localhost:8000/api/telemetry"

# Custom time range
curl "http://localhost:8000/api/telemetry?from_time=2026-01-20T00:00:00&to_time=2026-01-21T00:00:00"

# Downsampled (1 per 5 minutes)
curl "http://localhost:8000/api/telemetry?interval_minutes=5"
```

### Summaries

**GET /api/summary/today** - Today's statistics
```bash
curl "http://localhost:8000/api/summary/today"
```

**GET /api/summary/range** - Custom date range
```bash
curl "http://localhost:8000/api/summary/range?from_date=2026-01-01T00:00:00&to_date=2026-01-31T23:59:59"
```

### Forecast

**GET /api/forecast** - Energy and savings forecast
```bash
# 7-day forecast based on last 7 days
curl "http://localhost:8000/api/forecast?days=7&based_on_last_n_days=7"

# 30-day forecast
curl "http://localhost:8000/api/forecast?days=30&based_on_last_n_days=14"
```

### Settings

**GET /api/settings** - Get current settings
```bash
curl "http://localhost:8000/api/settings"
```

**PUT /api/settings** - Update settings
```bash
curl -X PUT http://localhost:8000/api/telemetry/settings \
  -H "Content-Type: application/json" \
  -d '{
    "electricity_rate_cad_per_kwh": 0.20,
    "co2_intensity_kg_per_kwh": 0.040
  }'
```

---

## ⚙️ Configuration

### Backend Configuration (.env)

Edit `backend/.env`:

```env
# Database
DATABASE_URL=sqlite:///./energy_system.db

# Calculation Constants
ELECTRICITY_RATE_CAD_PER_KWH=0.18      # Electricity cost
CO2_INTENSITY_KG_PER_KWH=0.03          # Grid CO2 emissions

# Simulation Settings
SIMULATION_ENABLED=true                 # Auto-generate data
SIMULATION_INTERVAL_SECONDS=60         # Generate every 60 seconds

# Hardware Specs (for simulation)
BATTERY_CAPACITY_WH=10000              # 10 kWh battery
BATTERY_MAX_CHARGE_POWER_W=3000       # 3 kW max charge
BATTERY_MAX_DISCHARGE_POWER_W=3000    # 3 kW max discharge
SOLAR_PEAK_POWER_W=5000               # 5 kW solar array
WIND_PEAK_POWER_W=3000                # 3 kW wind turbine
```

### Simulation Behavior

The simulator generates realistic data patterns:
- **Solar**: Follows daylight curve (6am-8pm), peak at noon
- **Wind**: More random, slightly higher at night
- **Load**: Typical residential pattern (high evening, low night)
- **Battery**: Charges during excess renewable, discharges during deficit

---

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
pytest tests/ -v
```

Tests cover:
- ✅ Energy integration calculations (trapezoidal rule)
- ✅ Battery discharge calculations
- ✅ CO₂ and money savings
- ✅ Variable power profiles
- ✅ Edge cases (no data, single readings)

### Manual Testing
1. Start backend and frontend
2. Visit http://localhost:5173
3. Check dashboard loads with simulated data
4. Try manual data entry
5. Adjust settings and verify calculations

---

## 📈 Data Model

### Telemetry Reading (Time-Series)
```python
{
  "id": 1,
  "timestamp": "2026-01-21T14:30:00",
  "solar_power_w": 3500.0,           # Solar generation
  "wind_power_w": 1200.0,            # Wind generation
  "load_power_w": 2000.0,            # Consumption
  "battery_soc_pct": 75.0,           # State of charge (0-100%)
  "battery_energy_wh": 7500.0,       # Stored energy
  "battery_charge_power_w": 700.0,   # +charging / -discharging
  "grid_import_power_w": 0.0,        # Import from grid
  "grid_export_power_w": 0.0         # Export to grid
}
```

### Daily Summary
```python
{
  "date": "2026-01-21",
  "solar_energy_wh_today": 25000.0,           # Solar generated today
  "wind_energy_wh_today": 15000.0,            # Wind generated today
  "load_energy_wh_today": 30000.0,            # Total consumption
  "battery_discharge_energy_wh_today": 5000.0, # Energy from battery
  "renewable_energy_used_wh": 40000.0,        # Total renewable used
  "co2_saved_kg_today": 1.2,                  # CO2 avoided
  "money_saved_cad_today": 7.20,              # Cost savings
  "current_solar_power_w": 3500.0,            # Current readings...
  "current_wind_power_w": 1200.0,
  "current_load_power_w": 2000.0,
  "current_battery_soc_pct": 75.0,
  "current_battery_energy_wh": 7500.0
}
```

---

## 🔧 Hardware Integration

The system is **ready for real hardware** via the REST API:

### Example: Arduino/ESP32 Integration
```cpp
#include <WiFi.h>
#include <HTTPClient.h>

void sendTelemetry(float solar, float wind, float load, float batterySOC) {
  HTTPClient http;
  http.begin("http://your-server:8000/api/telemetry");
  http.addHeader("Content-Type", "application/json");
  
  String json = "{";
  json += "\"solar_power_w\":" + String(solar) + ",";
  json += "\"wind_power_w\":" + String(wind) + ",";
  json += "\"load_power_w\":" + String(load) + ",";
  json += "\"battery_soc_pct\":" + String(batterySOC);
  json += "}";
  
  int httpCode = http.POST(json);
  http.end();
}
```

### Example: Python Sensor Script
```python
import requests
import time

API_URL = "http://localhost:8000/api/telemetry"

def read_sensors():
    # Replace with actual sensor readings
    return {
        "solar_power_w": read_solar_sensor(),
        "wind_power_w": read_wind_sensor(),
        "load_power_w": read_load_sensor(),
        "battery_soc_pct": read_battery_soc(),
        "battery_energy_wh": read_battery_energy(),
        "battery_charge_power_w": read_battery_power(),
    }

while True:
    data = read_sensors()
    response = requests.post(API_URL, json=data)
    print(f"Sent: {response.status_code}")
    time.sleep(60)  # Send every minute
```

---

## 🎓 Project Context

This dashboard was developed for an **Electrical Engineering capstone project** focused on:
- Renewable energy integration
- Battery energy storage systems (BESS)
- Smart energy management
- Grid interaction and optimization

### Key Technical Concepts
- **Energy Integration**: Uses trapezoidal rule to calculate energy from power readings
- **Power Flow**: Models solar/wind → load → battery → grid hierarchy
- **Forecasting**: Rolling average method with confidence intervals
- **Real-time Monitoring**: WebSocket-ready architecture (polling for simplicity)

---

## 🛠️ Tech Stack Details

### Backend
- **FastAPI**: Modern async Python web framework
- **SQLAlchemy**: ORM for database operations
- **Pydantic**: Data validation and settings management
- **SQLite**: Lightweight embedded database
- **Pytest**: Testing framework

### Frontend
- **React 18**: UI library with hooks
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **Recharts**: React charting library
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client

---

## 📝 Future Enhancements

### Planned Features
- [ ] Real-time WebSocket updates (replace polling)
- [ ] User authentication and multi-user support
- [ ] Advanced forecasting (ARIMA, ML models)
- [ ] Weather data integration
- [ ] Mobile app (React Native)
- [ ] Docker containerization
- [ ] Export data to CSV/Excel
- [ ] Alerts and notifications
- [ ] Historical comparison views
- [ ] Grid interaction optimization algorithms

### Hardware Integration
- [ ] MQTT support for IoT devices
- [ ] Modbus TCP/RTU for industrial sensors
- [ ] Direct PLC integration
- [ ] Battery BMS communication protocols

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Python version
python --version  # Should be 3.9+

# Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall

# Check port availability
netstat -an | findstr :8000
```

### Frontend won't start
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 18+
```

### No data showing
1. Check backend is running (http://localhost:8000/health)
2. Verify simulation is enabled (.env: `SIMULATION_ENABLED=true`)
3. Wait 60 seconds for first simulated reading
4. Check browser console for errors (F12)

### CORS errors
- Ensure backend is running on port 8000
- Frontend proxy is configured in `vite.config.ts`
- Check CORS settings in `app/main.py`

---

## 📄 License

This project is part of an academic capstone project. For educational and demonstration purposes.

---

## 👥 Contributors

- **Capstone Team** - Electrical Engineering Students
- Built with ❤️ for renewable energy optimization

---

## 📞 Support

For questions or issues:
1. Check the `/docs` endpoint: http://localhost:8000/docs
2. Review logs in terminal
3. Consult this README
4. Contact project supervisor

---

## 🌟 Acknowledgments

- FastAPI documentation and community
- React and Recharts teams
- Tailwind CSS
- Ontario electricity rate data
- Renewable energy research community

---

**Built January 2026 | Python + FastAPI + React + TypeScript**
