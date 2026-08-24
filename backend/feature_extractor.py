import numpy as np
import librosa

def extract_features(audio_path: str, sr: int = 22050, n_mels: int = 128) -> dict:
    """
    Extract frequency features from an audio file.

    Args:
        audio_path: Path to the audio file
        sr: Sample rate (default 22050 Hz)
        n_mels: Number of mel-frequency bins (default 32)

    Returns:
        Dictionary with frequency bins (normalized 0-1)
    """
    try:
        # Load audio file (mono)
        y, sr = librosa.load(audio_path, sr=sr, mono=True)

        if y is None or len(y) == 0:
            raise ValueError("Empty or invalid audio file")

        # Extract mel-spectrogram
        S = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=n_mels)

        # Convert to dB scale
        S_db = librosa.power_to_db(S, ref=np.max)

        # Get mean energy across time for each mel bin
        bins = np.mean(S_db, axis=1)

        # Normalize safely
        min_val = bins.min()
        max_val = bins.max()

        if max_val - min_val < 1e-6:
            bins = np.zeros_like(bins)
        else:
            bins = (bins - min_val) / (max_val - min_val)

        bins = np.clip(bins, 0, 1).astype(np.float32).tolist()

        return {
            "bins": bins,
            "n_mels": n_mels,
            "sample_rate": sr,
        }

    except Exception as e:
        raise Exception(f"Error extracting features: {str(e)}")
