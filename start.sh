#!/bin/bash

echo "========================================"
echo " Hybrid Energy System Dashboard"
echo " Starting Backend and Frontend..."
echo "========================================"
echo ""

# Start backend in background
echo "Starting Backend (Python FastAPI)..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Start frontend in background
echo "Starting Frontend (React + Vite)..."
cd frontend
npm install
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo " Both services are running!"
echo "========================================"
echo ""
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both services"
echo ""

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
