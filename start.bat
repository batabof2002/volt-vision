@echo off
echo ========================================
echo  Hybrid Energy System Dashboard
echo  Starting Backend and Frontend...
echo ========================================
echo.

REM Start backend in a new window
echo Starting Backend (Python FastAPI)...
start "Energy Dashboard - Backend" cmd /k "cd backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Wait a bit for backend to start
timeout /t 5 /nobreak > nul

REM Start frontend in a new window
echo Starting Frontend (React + Vite)...
start "Energy Dashboard - Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo ========================================
echo  Both services are starting!
echo ========================================
echo.
echo Backend will be at: http://localhost:8000
echo Frontend will be at: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
echo Close this window when done.
echo.
pause
