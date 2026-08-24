import os
import sys
import numpy as np
import librosa
import torch
from tqdm import tqdm
from pathlib import Path


# =====================================================
# PROJECT ROOT
# =====================================================
ROOT = Path(__file__).resolve().parent.parent

print("Project Root:", ROOT)

# -----------------------------------------------------
# ADD PANN PATHS
# -----------------------------------------------------
sys.path.append(str(ROOT / "audioset_tagging_cnn"))
sys.path.append(str(ROOT / "audioset_tagging_cnn" / "pytorch"))

from pytorch.models import Cnn14


# =====================================================
# CONFIGURATION
# =====================================================

GTZAN_PATH = ROOT / "datasets" / "GTZAN" / "genres_original"
OUTPUT_FILE = ROOT / "embeddings" / "track_embeddings_panns.npz"

MODEL_PATH = ROOT / "Cnn14_mAP=0.431.pth"

DEVICE = "cpu"

print("Dataset Path:", GTZAN_PATH)


# =====================================================
# LOAD PANN MODEL
# =====================================================
print("\n🚀 Loading PANN CNN14 model...")

model = Cnn14(
    sample_rate=32000,
    window_size=1024,
    hop_size=320,
    mel_bins=64,
    fmin=50,
    fmax=14000,
    classes_num=527
)

checkpoint = torch.load(MODEL_PATH, map_location=DEVICE)
model.load_state_dict(checkpoint["model"])

model.to(DEVICE)
model.eval()

print("✅ Model Loaded Successfully")


# =====================================================
# AUDIO → EMBEDDING
# =====================================================
def extract_embedding(audio_path):

    y, sr = librosa.load(audio_path, sr=32000, mono=True)

    # limit 30 seconds
    if len(y) > sr * 30:
        y = y[:sr * 30]

    waveform = torch.tensor(y).float().unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        output = model(waveform)

    embedding = output["embedding"].cpu().numpy()[0]

    # normalize
    embedding = embedding / (np.linalg.norm(embedding) + 1e-10)

    return embedding.astype("float32")


# =====================================================
# SCAN GTZAN DATASET
# =====================================================
audio_files = []

for root, _, files in os.walk(GTZAN_PATH):
    for f in files:
        if f.lower().endswith(".wav"):
            audio_files.append(os.path.join(root, f))

audio_files.sort()

print(f"\n🎵 Total GTZAN files found: {len(audio_files)}")


# =====================================================
# GENERATE EMBEDDINGS
# =====================================================
embeddings = []
track_ids = []

print("\n⚡ Generating embeddings...\n")

for file in tqdm(audio_files):

    try:
        emb = extract_embedding(file)

        embeddings.append(emb)

        # store relative path
        rel_id = os.path.relpath(file, GTZAN_PATH)
        track_ids.append(rel_id)

    except Exception as e:
        print("Skipped:", file, e)


embeddings = np.vstack(embeddings)


# =====================================================
# SAVE EMBEDDINGS
# =====================================================
OUTPUT_FILE.parent.mkdir(exist_ok=True)

np.savez(
    OUTPUT_FILE,
    track_ids=np.array(track_ids, dtype=object),
    embeddings=embeddings
)

print("\n✅ GTZAN PANN embeddings created!")
print("Saved at:", OUTPUT_FILE)
print("Embedding shape:", embeddings.shape)