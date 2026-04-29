import numpy as np
from pathlib import Path
from panns_inference import AudioTagging
import librosa


class RecommendationEngine:

    def __init__(self, embeddings_dir):
        self.embeddings_dir = Path(embeddings_dir)

        self.main_npz = self.embeddings_dir / "track_embeddings_panns.npz"
        self.upload_npz = self.embeddings_dir / "track_embeddings_uploads_panns.npz"

        self.model = None

        self.main_embs = None
        self.main_ids = []

        self.upload_embs = None
        self.upload_ids = []

        self.load_embeddings()

    def _load_model(self):
        if self.model is None:
            print("🚀 Loading REAL PANN CNN14 model...")
            self.model = AudioTagging(checkpoint_path=None, device="cpu")
            print("✅ PANN Ready")

    def load_embeddings(self):
        if self.main_npz.exists():
            z = np.load(self.main_npz, allow_pickle=True)
            self.main_embs = z["embeddings"].astype("float32")
            self.main_ids = list(z["track_ids"])

        if self.upload_npz.exists():
            z = np.load(self.upload_npz, allow_pickle=True)
            self.upload_embs = z["embeddings"].astype("float32")
            self.upload_ids = list(z["track_ids"])

        print("Dataset:", len(self.main_ids))
        print("Uploads:", len(self.upload_ids))

    def is_duplicate(self, embedding):
        if self.upload_embs is None:
            return False
        embedding = embedding.reshape(1, -1)
        sims = self.upload_embs @ embedding.T
        return bool(np.max(sims) > 0.995)

    def get_existing_id(self, embedding):
        if self.upload_embs is None:
            return None
        embedding = embedding.reshape(1, -1)
        sims = self.upload_embs @ embedding.T
        idx = int(np.argmax(sims))
        return self.upload_ids[idx]

    def embed_audio(self, filepath):
        self._load_model()

        audio, sr = librosa.load(filepath, sr=32000, mono=True)

        if len(audio) > sr * 30:
            audio = audio[:sr * 30]

        audio = audio[np.newaxis, :]

        _, embedding = self.model.inference(audio)

        embedding = embedding[0]
        embedding /= np.linalg.norm(embedding) + 1e-10

        mel = librosa.feature.melspectrogram(
            y=audio.flatten(),
            sr=sr,
            n_mels=128
        )

        vis = np.mean(mel, axis=1)
        vis = (vis - vis.min()) / (vis.max() - vis.min() + 1e-10)

        return embedding.astype("float32"), vis.tolist()

    def add_upload(self, track_id, embedding):
        embedding = embedding.reshape(1, -1)

        if self.upload_embs is None:
            self.upload_embs = embedding
            self.upload_ids = [track_id]
        else:
            sims = self.upload_embs @ embedding.T

            if np.max(sims) > 0.995:
                print("⚠ Duplicate skipped")
                return

            self.upload_embs = np.vstack([self.upload_embs, embedding])
            self.upload_ids.append(track_id)

        np.savez(
            self.upload_npz,
            track_ids=np.array(self.upload_ids, dtype=object),
            embeddings=self.upload_embs
        )

        print("✅ Upload stored")

    def recommend(self, query, query_id=None, k=5):
        results = []

        q = query.astype("float32")
        q_cos = q / (np.linalg.norm(q) + 1e-10)

        SELF_SIM_THRESHOLD = 0.9995

        # Extract base filename from query_id to exclude same file
        query_basename = None
        if query_id:
            parts = query_id.split('_', 1)
            query_basename = parts[1] if len(parts) > 1 else query_id

        if self.main_embs is not None:
            sims_cos = self.main_embs @ q_cos
            dists_euc = np.linalg.norm(self.main_embs - q_cos, axis=1)

            q_mean = q.mean()
            q_centered = q - q_mean
            q_ss = (q_centered ** 2).sum()

            main_means = self.main_embs.mean(axis=1)
            main_centered = self.main_embs - main_means[:, None]
            main_ss = (main_centered ** 2).sum(axis=1)

            numer = (main_centered * q_centered).sum(axis=1)
            denom = np.sqrt(main_ss * q_ss) + 1e-10
            pearson = numer / denom

            for tid, sc, eu, pc in zip(self.main_ids, sims_cos, dists_euc, pearson):
                if sc >= SELF_SIM_THRESHOLD:
                    continue

                results.append({
                    "id": tid,
                    "title": Path(tid).name,
                    "artist": "GTZAN Dataset",
                    "previewUrl": f"/datasets/{tid}",
                    "matchScore_cosine": float(sc),
                    "matchScore": float(sc),
                    "euclidean": float(eu),
                    "pearson": float(pc)
                })

        if self.upload_embs is not None:
            sims_cos_u = self.upload_embs @ q_cos
            dists_euc_u = np.linalg.norm(self.upload_embs - q_cos, axis=1)

            upload_means = self.upload_embs.mean(axis=1)
            upload_centered = self.upload_embs - upload_means[:, None]
            upload_ss = (upload_centered ** 2).sum(axis=1)

            numer_u = (upload_centered * q_centered).sum(axis=1)
            denom_u = np.sqrt(upload_ss * q_ss) + 1e-10
            pearson_u = numer_u / denom_u

            for tid, sc, eu, pc in zip(self.upload_ids, sims_cos_u, dists_euc_u, pearson_u):
                if sc >= SELF_SIM_THRESHOLD:
                    continue

                # Extract basename of this track
                tid_parts = tid.split('_', 1)
                tid_basename = tid_parts[1] if len(tid_parts) > 1 else tid

                # Skip if same original filename
                if query_basename and tid_basename == query_basename:
                    continue

                results.append({
                    "id": tid,
                    "title": Path(tid).name,
                    "artist": "User Upload",
                    "previewUrl": f"/uploads/{tid}",
                    "matchScore_cosine": float(sc),
                    "matchScore": float(sc),
                    "euclidean": float(eu),
                    "pearson": float(pc)
                })

        results.sort(key=lambda x: -(x.get("matchScore_cosine") if x.get("matchScore_cosine") is not None else x.get("matchScore", 0)))

        # Filter: each unique basename only once
        seen_basenames = set()
        unique_results = []
        for r in results:
            rid = r.get("id", "")
            parts = rid.split('_', 1)
            basename = parts[1] if len(parts) > 1 else rid
            if basename not in seen_basenames:
                seen_basenames.add(basename)
                unique_results.append(r)

        return unique_results[:k]