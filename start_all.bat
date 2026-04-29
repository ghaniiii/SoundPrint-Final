@echo off
REM Start backend and frontend in separate windows (workspace-root relative)
echo Starting SoundPrint (backend + frontend)...

REM Start backend (uses backend\start_backend.bat if present)
if exist "backend\start_backend.bat" (
  start "SoundPrint Backend" cmd /k "cd /d %~dp0backend && start_backend.bat"
) else (
  start "SoundPrint Backend" cmd /k "cd /d %~dp0backend && if exist .venv\Scripts\python.exe (.venv\Scripts\python.exe app.py) else (python app.py)"
)

REM Give backend a moment
timeout /t 2 /nobreak >nul

REM Start frontend
start "SoundPrint Frontend" cmd /k "cd /d %~dp0frontend\ui && npm start"

echo Launch commands issued. Backend: http://127.0.0.1:5000 | Frontend: http://localhost:4200
echo.
pause