#!/bin/bash

# JTTB Development Server (Linux/WSL)
# Runs frontend and backend concurrently

echo "========================================"
echo "  JTTB Dev Server"
echo "========================================"

# Set environment variables for backend
export JTTB_JWT_SECRET="dev-secret-key"
export JTTB_USER="admin"
export JTTB_PASSWORD="admin"

# Kill existing processes on ports
kill -9 $(lsof -t -i:3000) 2>/dev/null
kill -9 $(lsof -t -i:4200) 2>/dev/null

# Start backend
echo ""
echo "[Backend] Starting on http://localhost:3000"
cd jttb-back
npm start &
BACK_PID=$!

# Start frontend
echo "[Frontend] Starting on http://localhost:4200"
cd ../jttb-front
npm start &
FRONT_PID=$!

echo ""
echo "========================================"
echo "  Frontend: http://localhost:4200"
echo "  Backend:  http://localhost:3000"
echo "  User: admin / Password: admin"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait and cleanup on exit
trap "kill $BACK_PID $FRONT_PID 2>/dev/null; exit" INT TERM
wait
