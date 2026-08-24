# SoundPrint

Frequency-based music recommendation: Angular UI + Flask API. Upload a clip, get similar tracks from PANNs embeddings.

You do **not** need to edit absolute machine paths after a clone. Folders are resolved from the repo (`backend/`, `frontend/ui/`). The only URL you might change is the API base (see below).

## Requirements

- Python 3.11+ (3.14 works with the current `requirements.txt`; Flask 3.x is required)
- Node.js 20+ and npm
- ~2 GB disk (PyTorch + PANNs CNN14 checkpoint ~327 MB)
- Optional: [Git LFS](https://git-lfs.com) if you want the bundled `backend/Cnn14_mAP=0.431.pth` instead of an automatic download

## Clone

```bash
git clone https://github.com/khubaib6970/SoundPrint-Final.git
cd SoundPrint-Final
```

## Paths you might edit

| What | File | Default | When to change |
|------|------|---------|----------------|
| API URL used by the UI | `frontend/ui/src/app/tokens/api-base-url.token.ts` | `http://localhost:5000/api` | Backend on another host/port, or a deployed API |
| Backend port | env `PORT` (see `backend/app.py`) | `5000` | Port 5000 already in use |
| GTZAN audio for play previews | `backend/datasets/GTZAN/genres_original/` | missing in this tree | Only if you want play buttons on dataset tracks |
| Embeddings | `backend/embeddings/track_embeddings_panns.npz` | required | Replace only if you regenerate embeddings |
| PANNs checkpoint | `%USERPROFILE%\panns_data\Cnn14_mAP=0.431.pth` (Windows) or `~/panns_data/` | auto-created | First backend start downloads it if missing |

No other hardcoded user paths. Uploads go to `backend/uploads/` (created automatically).

## Run locally

Use **two terminals**. Start the backend first.

### 1. Backend

**Windows (PowerShell)**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:PYTHONUTF8 = "1"
python app.py
```

If `Activate.ps1` is blocked: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

**macOS / Linux**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Backend: [http://127.0.0.1:5000](http://127.0.0.1:5000)  
Health: [http://127.0.0.1:5000/api/health](http://127.0.0.1:5000/api/health)

The first start may download the CNN14 weights (~327 MB) into `panns_data` under your home folder. The first **Analyze** request then loads the model (often 1–2 minutes on CPU). Later requests are faster.

### 2. Frontend

```bash
cd frontend/ui
npm install
npm start
```

UI: [http://localhost:4200](http://localhost:4200)

Default API target is already local (`http://localhost:5000/api`). Only edit `api-base-url.token.ts` if that is wrong for your machine.

## Use the app

1. Open [http://localhost:4200](http://localhost:4200)
2. Go to **Analyze**, upload MP3/WAV/FLAC/OGG/M4A
3. Drag the 30s window, then **Analyze 30s selection**

Play appears only when the audio file exists on disk (`backend/uploads/...`). GTZAN names can still show as recommendations without a play button if `backend/datasets/` is not present.

## Project layout

```
backend/
  app.py                 Flask API
  recommend_server.py    PANNs embeddings + similarity
  requirements.txt
  embeddings/            precomputed .npz library
  uploads/               user files (created at runtime)
  datasets/              optional GTZAN wavs for previews
frontend/ui/             Angular 21 app
```

API:

- `GET /api/health`
- `POST /api/recommend` (multipart: `file` = clip, optional `original` = full track)

## Troubleshooting

- **UI loads, Analyze fails:** backend not running, or `api-base-url.token.ts` still pointing at a remote host.
- **Port 5000 taken:** `$env:PORT=5001; python app.py` and set the token to `http://localhost:5001/api`.
- **Torch / pip errors:** install a CPU wheel from https://pytorch.org/get-started/locally then `pip install -r requirements.txt` again.
- **Play missing on dataset tracks:** add GTZAN files under `backend/datasets/GTZAN/genres_original/<genre>/<file>.wav` matching embedding IDs (for example `classical/classical.00068.wav`).
- **First run “stuck”:** wait for the checkpoint download and model load; check the backend terminal.

## Notes

- CORS is open for local development.
- `backend/Cnn14_mAP=0.431.pth` in git may be an LFS pointer (~hundreds of bytes). If so, the app downloads a real checkpoint automatically.
- Theme (light/dark) is stored in `localStorage` as `theme`.
