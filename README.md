# SoundPrint — Fullstack Audio Recommendation

This workspace contains a front-end Angular app and a Python Flask backend that together provide audio recommendation functionality.

Quick start (development):

- Backend:
  1. Open PowerShell, go to `backend` folder.
  2. Activate virtualenv: `backend\.venv\Scripts\Activate.ps1` (or run `backend\start_backend.bat`).
  3. Run: `python app.py` (server listens at http://127.0.0.1:5000).

- Frontend:
  1. Open a new terminal, go to `frontend\soundprint-ui`.
  1. Open a new terminal, go to `frontend\ui`.
  2. Install dependencies (once): `npm install`.
  3. Start dev server: `npm run start` (serves at http://localhost:4200).

One-step start:
- Use `start_all.bat` at the workspace root to launch both servers in separate command windows.

Notes:
- Large historical archives have been moved to `cleanup_removed/_archives` (safe, reversible).
- If you need to rebuild the backend venv, run `python -m venv backend\.venv` and then install dependencies from the project (see `backend/audioset_tagging_cnn/requirements.txt`).

Files moved to `cleanup_removed/` are preserved in case you need them back.
