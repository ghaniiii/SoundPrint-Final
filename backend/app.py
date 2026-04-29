from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pathlib import Path
from werkzeug.utils import secure_filename
import traceback
import uuid
import os

from recommend_server import RecommendationEngine


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

BASE_DIR = Path(__file__).parent
UPLOAD_FOLDER = BASE_DIR / "uploads"
EMBEDDINGS_FOLDER = BASE_DIR / "embeddings"
DATASET_FOLDER = BASE_DIR / "datasets" / "GTZAN" / "genres_original"

UPLOAD_FOLDER.mkdir(exist_ok=True)

app.config["UPLOAD_FOLDER"] = str(UPLOAD_FOLDER)
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024

ALLOWED_EXTENSIONS = {"mp3", "wav", "flac", "ogg", "m4a"}

recommender = None

def get_recommender():
    global recommender
    if recommender is None:
        print("🚀 Loading Recommendation Engine...")
        recommender = RecommendationEngine(str(EMBEDDINGS_FOLDER))
        print("✅ Engine Ready")
    return recommender


def allowed_file(filename):
    return "." in filename and \
        filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def original_already_exists(filename):
    clean = secure_filename(filename)
    for f in UPLOAD_FOLDER.iterdir():
        parts = f.name.split('_', 1)
        existing_basename = parts[1] if len(parts) > 1 else f.name
        if existing_basename == clean:
            return f.name
    return None


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/uploads/<path:filename>")
def serve_upload(filename):
    return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=False)


@app.route("/datasets/<path:filename>")
def serve_dataset(filename):
    return send_from_directory(DATASET_FOLDER, filename, as_attachment=False)


@app.route("/api/recommend", methods=["POST"])
def recommend():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]

        if file.filename == "":
            return jsonify({"error": "Empty filename"}), 400

        if not allowed_file(file.filename):
            return jsonify({"error": "Unsupported file"}), 400

        # Save clip temporarily for processing
        unique_name = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
        filepath = UPLOAD_FOLDER / unique_name
        file.save(filepath)
        print("✅ Clip saved temporarily:", filepath)

        original_file = request.files.get('original')
        has_original = bool(original_file and original_file.filename and allowed_file(original_file.filename))

        engine = get_recommender()

        # Generate embedding from clip
        query_embedding, vis_bins = engine.embed_audio(str(filepath))

        # Delete temp clip
        try:
            os.remove(filepath)
            print("🗑 Temp clip deleted")
        except Exception:
            pass

        # Handle original file
        if has_original:
            display_name = original_file.filename
            existing = original_already_exists(original_file.filename)
            if existing:
                print("⚠ File already exists, skipping save:", existing)
                upload_name = existing
            else:
                original_name = f"{uuid.uuid4()}_{secure_filename(original_file.filename)}"
                original_path = UPLOAD_FOLDER / original_name
                original_file.save(original_path)
                print("✅ Original saved:", original_path)
                upload_name = original_name
        else:
            display_name = file.filename
            upload_name = f"{uuid.uuid4()}_{secure_filename(file.filename)}"

        recommendations = engine.recommend(
            query=query_embedding,
            query_id=upload_name,
            k=5
        )

        # Add to uploads embeddings only if not duplicate
        if not engine.is_duplicate(query_embedding):
            engine.add_upload(upload_name, query_embedding)
        else:
            print("⚠ Duplicate embedding, skipping add_upload")

        base_url = request.host_url.rstrip('/')
        track_preview = f"{base_url}/uploads/{upload_name}"

        response = {
            "track": {
                "id": upload_name,
                "title": display_name,
                "artist": "User Upload",
                "previewUrl": track_preview
            },
            "frequencyProfile": {
                "bins": vis_bins
            },
            "similarTracks": [
                {
                    **t,
                    "previewUrl":
                        t["previewUrl"]
                        if t["previewUrl"].startswith("http")
                        else f"{base_url}{t['previewUrl']}"
                }
                for t in recommendations
            ]
        }

        return jsonify(response)

    except Exception:
        print(traceback.format_exc())
        return jsonify({"error": "Recommendation failed"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)