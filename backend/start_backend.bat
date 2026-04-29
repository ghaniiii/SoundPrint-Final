@echo off
:: Removed hard-coded absolute path for portability
:: Change to the directory where this script is located
cd /d "%~dp0"
:: Run the virtualenv python if present, otherwise try system python
if exist ".venv\Scripts\python.exe" (
	.venv\Scripts\python.exe app.py
) else (
	echo ".venv\Scripts\python.exe not found. Trying system python..."
	python app.py
)
pause
