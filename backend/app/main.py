"""FastAPI application entry point."""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db, get_db
from app.routers import telemetry_router
from app.services.ingestor import get_simulator
from app.config import get_settings


# Background task for simulation
simulation_task = None


async def run_simulation():
    """Background task to generate simulated data."""
    settings = get_settings()
    simulator = get_simulator()
    
    while True:
        try:
            # Get a database session
            db = next(get_db())
            try:
                # Generate a simulated reading
                simulator.ingest_reading(db)
            finally:
                db.close()
            
            # Wait for next interval
            await asyncio.sleep(settings.simulation_interval_seconds)
        except Exception as e:
            print(f"Simulation error: {e}")
            await asyncio.sleep(5)  # Wait a bit before retrying


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    print("Initializing database...")
    init_db()
    
    settings = get_settings()
    if settings.simulation_enabled:
        print(f"Starting simulation (interval: {settings.simulation_interval_seconds}s)...")
        global simulation_task
        simulation_task = asyncio.create_task(run_simulation())
    
    yield
    
    # Shutdown
    if simulation_task:
        simulation_task.cancel()
        try:
            await simulation_task
        except asyncio.CancelledError:
            pass
    print("Shutting down...")


# Create FastAPI app
app = FastAPI(
    title="Hybrid Energy System Dashboard API",
    description="API for monitoring and controlling a hybrid Solar + Wind + Battery energy system",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

# Allow additional origins from environment variable (e.g. your public frontend URL)
import os
extra_origin = os.environ.get("ALLOWED_ORIGIN", "")
if extra_origin:
    allowed_origins.append(extra_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(telemetry_router)


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Hybrid Energy System Dashboard API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.post("/api/simulation/pause")
async def pause_simulation():
    """Pause the simulation."""
    global simulation_task
    if simulation_task and not simulation_task.done():
        simulation_task.cancel()
        try:
            await simulation_task
        except asyncio.CancelledError:
            pass
        simulation_task = None
        return {"status": "paused", "message": "Simulation has been paused"}
    return {"status": "already_paused", "message": "Simulation is not running"}


@app.post("/api/simulation/start")
async def start_simulation():
    """Start or resume the simulation."""
    global simulation_task
    if simulation_task is None or simulation_task.done():
        simulation_task = asyncio.create_task(run_simulation())
        return {"status": "running", "message": "Simulation has been started"}
    return {"status": "already_running", "message": "Simulation is already running"}


@app.get("/api/simulation/status")
def get_simulation_status():
    """Get the current simulation status."""
    global simulation_task
    is_running = simulation_task is not None and not simulation_task.done()
    return {
        "status": "running" if is_running else "paused",
        "enabled": get_settings().simulation_enabled,
        "interval_seconds": get_settings().simulation_interval_seconds
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
