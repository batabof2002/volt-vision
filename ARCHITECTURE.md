# 🏗️ System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                              │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  Dashboard   │  │  Data Input  │  │   Settings   │            │
│  │    Page      │  │     Page     │  │     Page     │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│           │                 │                 │                    │
│           └─────────────────┴─────────────────┘                    │
│                            │                                        │
│                    ┌───────▼────────┐                              │
│                    │  API Service   │                              │
│                    │   (Axios)      │                              │
│                    └───────┬────────┘                              │
│                            │                                        │
└────────────────────────────┼────────────────────────────────────────┘
                             │
                        HTTP/JSON
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                      BACKEND SERVER                                 │
│                     (FastAPI Python)                                │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                     API ROUTERS                             │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │
│  │  │Telemetry │  │ Summary  │  │ Forecast │  │ Settings │   │  │
│  │  │   POST   │  │   GET    │  │   GET    │  │ GET/PUT  │   │  │
│  │  │   GET    │  │          │  │          │  │          │   │  │
│  │  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘   │  │
│  └────────┼─────────────┼─────────────┼─────────────┼────────┘  │
│           │             │             │             │            │
│  ┌────────▼─────────────▼─────────────▼─────────────▼────────┐  │
│  │                    SERVICE LAYER                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │   Energy     │  │   Forecast   │  │   Ingestor   │    │  │
│  │  │ Calculator   │  │   Service    │  │   Service    │    │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │  │
│  └─────────┼──────────────────┼──────────────────┼───────────┘  │
│            │                  │                  │               │
│  ┌─────────▼──────────────────▼──────────────────▼───────────┐  │
│  │                    DATABASE LAYER                         │  │
│  │              (SQLAlchemy ORM + SQLite)                    │  │
│  │  ┌────────────────────────────────────────────────────┐   │  │
│  │  │         TelemetryReading Model                     │   │  │
│  │  │  - timestamp (indexed)                             │   │  │
│  │  │  - solar_power_w, wind_power_w, load_power_w      │   │  │
│  │  │  - battery_soc_pct, battery_energy_wh             │   │  │
│  │  │  - battery_charge_power_w                          │   │  │
│  │  │  - grid_import_power_w, grid_export_power_w       │   │  │
│  │  └────────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              BACKGROUND SIMULATION TASK                     │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │  SimulatedDataIngestor                               │   │  │
│  │  │  - Generates realistic solar/wind/load patterns     │   │  │
│  │  │  - Runs every 60 seconds                            │   │  │
│  │  │  - Calculates battery state                         │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             │
                    ┌────────▼────────┐
                    │  energy_system  │
                    │      .db        │
                    │   (SQLite)      │
                    └─────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATION                             │
│                      (Future Ready)                                 │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │    Solar     │  │     Wind     │  │   Battery    │            │
│  │   Sensors    │  │   Sensors    │  │     BMS      │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│         │                  │                  │                    │
│         └──────────────────┴──────────────────┘                    │
│                            │                                        │
│                   ┌────────▼────────┐                              │
│                   │  POST /api/     │                              │
│                   │   telemetry     │                              │
│                   └─────────────────┘                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Simulation Mode (Current)
```
SimulatedDataIngestor → TelemetryReading → Database
         ↓
   [Every 60s]
         ↓
   Calculate realistic patterns:
   - Solar: Sine curve (6AM-8PM, peak at noon)
   - Wind: Random with day/night variation
   - Load: Residential usage pattern
   - Battery: Charge/discharge based on net power
```

### 2. Manual Entry Mode
```
User Form → Frontend → API Service → POST /api/telemetry
                                           ↓
                               ManualDataIngestor → Database
```

### 3. Hardware Integration (Future)
```
Physical Sensors → Microcontroller/PLC → HTTP Client
                                              ↓
                                    POST /api/telemetry
                                              ↓
                                  ManualDataIngestor → Database
```

### 4. Dashboard Display
```
User loads page → Frontend → GET /api/summary/today
                                    ↓
                          EnergyCalculator reads Database
                                    ↓
                          Calculate daily totals:
                          - Energy integration (trapezoidal)
                          - CO₂ savings
                          - Money savings
                                    ↓
                          Return JSON → Frontend → Display
```

### 5. Charts Display
```
User selects time range → Frontend → GET /api/telemetry?from_time=...
                                              ↓
                                     Query database with filters
                                              ↓
                                     Optional downsampling
                                              ↓
                                     Return array → Frontend → Recharts
```

### 6. Forecast Generation
```
User requests forecast → Frontend → GET /api/forecast?days=7
                                            ↓
                                ForecastService:
                                1. Get last N days data
                                2. Calculate daily averages
                                3. Calculate std deviation
                                4. Project forward
                                5. Add confidence bands
                                            ↓
                                Return JSON → Frontend → Table
```

## Component Communication

### Backend Internal
```
Router Layer (telemetry.py)
    ↓
  Depends on: get_db() session
    ↓
Service Layer (calculations.py, forecast.py, ingestor.py)
    ↓
  Uses: Database session, Config settings
    ↓
Model Layer (telemetry.py)
    ↓
SQLAlchemy ORM → SQLite Database
```

### Frontend Internal
```
Page Component (Dashboard.tsx, DataInput.tsx, Settings.tsx)
    ↓
  useState/useEffect hooks
    ↓
API Service (api.ts)
    ↓
  Axios HTTP client
    ↓
Type Definitions (api.ts types)
    ↓
Backend REST API
```

## Calculation Pipeline

### Energy Integration
```
Raw Readings (Power in W, timestamped)
    ↓
Group by day
    ↓
For each adjacent pair of readings:
    Energy = (P₁ + P₂) / 2 × Δt
    ↓
Sum all intervals
    ↓
Total Energy (Wh)
    ↓
Convert to kWh (÷ 1000)
```

### CO₂ Savings
```
Total Renewable Energy (kWh)
    ↓
Multiply by CO₂ intensity (kg/kWh)
    ↓
CO₂ Saved (kg)
```

### Money Savings
```
Total Renewable Energy (kWh)
    ↓
Multiply by electricity rate (CAD/kWh)
    ↓
Money Saved (CAD)
```

## Technology Stack Details

### Backend Stack
```
┌─────────────────────────────────┐
│ FastAPI 0.109.0                 │  Web framework
├─────────────────────────────────┤
│ Uvicorn 0.27.0                  │  ASGI server
├─────────────────────────────────┤
│ SQLAlchemy 2.0.25               │  ORM
├─────────────────────────────────┤
│ Pydantic 2.5.3                  │  Validation
├─────────────────────────────────┤
│ Python 3.9+                     │  Language
├─────────────────────────────────┤
│ SQLite 3                        │  Database
└─────────────────────────────────┘
```

### Frontend Stack
```
┌─────────────────────────────────┐
│ React 18.2.0                    │  UI framework
├─────────────────────────────────┤
│ TypeScript 5.3.3                │  Language
├─────────────────────────────────┤
│ Vite 5.0.11                     │  Build tool
├─────────────────────────────────┤
│ Recharts 2.10.4                 │  Charts
├─────────────────────────────────┤
│ Tailwind CSS 3.4.1              │  Styling
├─────────────────────────────────┤
│ Axios 1.6.5                     │  HTTP client
├─────────────────────────────────┤
│ React Router 6.21.3             │  Routing
└─────────────────────────────────┘
```

## Scalability Considerations

### Current (Single User)
```
- SQLite database (local file)
- Single backend instance
- Single frontend instance
- Direct HTTP polling
- No authentication
```

### Production Scale (Future)
```
- PostgreSQL database (multi-user)
- Load balancer → Multiple backend instances
- CDN → Static frontend assets
- WebSocket connections (real-time)
- JWT authentication
- Redis cache for frequent queries
- Horizontal scaling ready
```

## Security Layers (Future)

```
┌─────────────────────────────────┐
│ HTTPS/TLS                       │  Transport security
├─────────────────────────────────┤
│ JWT Authentication              │  User identity
├─────────────────────────────────┤
│ Rate Limiting                   │  DOS protection
├─────────────────────────────────┤
│ Input Validation (Pydantic)     │  Data integrity
├─────────────────────────────────┤
│ CORS Policy                     │  Origin control
├─────────────────────────────────┤
│ SQL Injection Protected (ORM)   │  Query safety
└─────────────────────────────────┘
```

## Deployment Architecture (Docker - Future)

```
┌──────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │   Frontend       │  │    Backend       │            │
│  │   Container      │  │    Container     │            │
│  │   (nginx)        │  │    (uvicorn)     │            │
│  │   Port: 80       │  │    Port: 8000    │            │
│  └────────┬─────────┘  └─────────┬────────┘            │
│           │                      │                      │
│           └──────────────────────┘                      │
│                      │                                  │
│            ┌─────────▼─────────┐                        │
│            │   Volume Mount    │                        │
│            │  ./data/          │                        │
│            │  (SQLite DB)      │                        │
│            └───────────────────┘                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

**Architecture designed for: Development simplicity → Production scalability**
