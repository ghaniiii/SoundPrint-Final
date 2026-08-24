# SoundPrint — Final Year Project Explanation

## Project Overview
- SoundPrint is a music similarity and recommendation system that analyzes an uploaded audio track's frequency profile and returns a ranked list of similar tracks. It combines audio feature extraction, precomputed embeddings from the PANNs model, and a lightweight similarity search to provide recommendations.

## Architecture
- Backend: Python Flask application (`backend/app.py`, `backend/recommend_server.py`). Responsible for handling uploads, extracting features, embedding audio via a PANNs-based extractor, and computing nearest neighbors against precomputed track embeddings stored in `backend/embeddings`.
- Model: Uses a pre-trained PANNs audio tagging model for embedding extraction; a checkpoint (`Cnn14_mAP=0.431.pth`) and embeddings (`track_embeddings_panns.npz`) are provided.
- Frontend: Angular SPA (`frontend/ui`) that allows users to upload audio, view a frequency profile visualization, and play recommended tracks. The frontend communicates with backend APIs at `/api/recommend` and `/api/health`.

## Main Components and Data Flow
1. User uploads an audio file via the frontend UI. The file is POSTed to `POST /api/recommend`.
2. Backend saves the file to `backend/uploads`, extracts a short frequency profile and computes a PANNs embedding for the audio.
3. Recommendation engine compares the upload embedding to the precomputed embeddings using cosine similarity and returns the top-K similar tracks along with a normalized frequency profile for visualization.
4. Frontend renders the frequency profile (bars) and a list of recommended tracks with preview URLs served by the backend.

## Theming & UI Work (What I changed)
- Implemented variable-driven theming using CSS custom properties in `frontend/ui/src/styles.scss`. Variables include `--accent`, `--accent-2`, `--card-bg`, `--text-color`, `--placeholder-start`, and more, with light and dark theme overrides.
- Converted component styles in `hero`, `features`, `how-it-works`, `analyzer`, and `app-footer` to reference theme variables so the UI supports dark mode reliably.
- Added a theme toggle persisted to `localStorage` (in the app TypeScript files) so users can switch between light/dark. This ensures visual consistency and is presentation-ready.

## Experiments and Results
- The backend demo is configured to run inference using a CPU PyTorch wheel; embeddings and a small test set (GTZAN) are included for quick evaluation.
- During development I verified end-to-end functionality by submitting an uploaded MP3 to `/api/recommend` and confirming the backend returned a `frequencyProfile` and a list of `similarTracks` (5 recommendations with preview URLs). This demonstrates the recommendation pipeline is functioning.

## How to Run Locally (short)
1. Backend setup
   - Create and activate a Python virtual environment in `backend` and install requirements: `pip install -r requirements.txt` (or the listed packages: `flask, flask-cors, numpy, scipy, librosa, soundfile, panns-inference, torch` — CPU wheel recommended for machines without CUDA).
   - Start the backend: `python app.py` (serves API on `http://127.0.0.1:5000`).

2. Frontend setup
   - From `frontend/ui`, run `npm install` then `npm run start` and open `http://localhost:4200`.

3. Quick test
   - Use the UI to upload an audio file. The frontend will POST to `/api/recommend`; results include a frequency profile and recommended tracks with previews.

## Evaluation & Limitations
- Accuracy depends on the quality of the PANNs embeddings and the coverage of the precomputed embedding dataset. For better real-world results, larger and more diverse embeddings are required.
- Current implementation uses CPU inference for portability; for large-scale or low-latency production use, move to a GPU-backed environment and consider optimized nearest-neighbor libraries (Faiss, Annoy).
- Chart coloring and some JS-driven visuals may still need explicit theme updates in JavaScript configs; I updated SCSS to use CSS variables — chart library options (if present) should sample CSS variables on theme changes.

## Future Work (presentation talking points)
- Replace naive in-memory similarity search with an ANN index (Faiss/HNSW) for scalability.
- Add user feedback loop to refine recommendations (implicit/explicit feedback).
- Expand dataset and include track metadata (genre, mood) to allow hybrid recommendations.
- Add more visual analytic tools: spectrogram overlays, segment-level similarity, and time-synchronized playback.

## For the Presentation
- Live demo steps: start backend, start frontend, upload a song, show the frequency profile update and the recommended tracks list, play previews.
- Show architecture diagram (Backend: Flask + PANNs → Embeddings; Frontend: Angular UI + Theme). Explain trade-offs (CPU vs GPU, in-memory similarity vs ANN).
- Discuss evaluation metrics used during development (qualitative matching, nearest-neighbor precision, human-in-the-loop adjustments).

---

If you want, I can expand this `EXPLAIN.md` with a slide-ready diagram SVG and suggested speaker notes. I did not commit any changes yet; tell me when to commit.
SoundPrint — Layman's overview

What this project does
- You upload a song (or choose one from the bundled dataset).
- The backend converts the audio into a numeric fingerprint (an embedding) using a pretrained audio model.
- The backend compares that fingerprint against a library of existing track fingerprints and returns the most similar tracks as recommendations.
- The frontend (web UI) lets you upload audio, plays short previews, and displays recommended tracks and a simple frequency visualization.

Why it matters
- This is an example of content-based recommendation for music: instead of relying on user ratings, it uses the audio itself to find similar songs.

How the pieces fit together (simple):
- Frontend: Angular app serving the user interface and talking to the backend via HTTP (POST `/api/recommend` with the uploaded file).
- Backend: Flask app that embeds audio, searches the precomputed embeddings (`embeddings/`), and returns similar tracks.
- Models & data: Pretrained model checkpoints and `.npz` embeddings are stored under the backend folder; large historical archives are saved in `cleanup_removed/_archives`.

How to run (simple):
1. Start the backend server.
2. Start the frontend server.
3. Open your browser to `http://localhost:4200` and try uploading a short audio clip.

Who to contact
- If you need help running this locally, share any error output from your terminal and I (or a teammate) can help debug.
