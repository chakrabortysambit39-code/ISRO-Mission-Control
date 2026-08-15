from pathlib import Path
import json
from datetime import datetime, timezone
from flask import Flask, jsonify, render_template, request

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
MISSIONS_FILE = DATA_DIR / "missions.json"

app = Flask(__name__, template_folder="templates", static_folder="static")


def load_missions():
    try:
        return json.loads(MISSIONS_FILE.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def save_missions(records):
    MISSIONS_FILE.write_text(json.dumps(records, indent=2), encoding="utf-8")


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/missions")
def get_missions():
    return jsonify(load_missions())


@app.post("/api/missions")
def create_mission():
    payload = request.get_json(silent=True) or {}
    record = {
        "timestamp": payload.get("timestamp") or datetime.now(timezone.utc).isoformat(),
        "status": str(payload.get("status", "UNKNOWN")),
        "duration": float(payload.get("duration", 0) or 0),
        "maxAltitude": float(payload.get("maxAltitude", 0) or 0),
        "maxVelocity": float(payload.get("maxVelocity", 0) or 0),
        "maxTemperature": float(payload.get("maxTemperature", 0) or 0),
    }
    records = load_missions()
    records.insert(0, record)
    save_missions(records[:100])
    return jsonify({"ok": True, "mission": record}), 201


@app.get("/health")
def health():
    return jsonify({"ok": True, "service": "mission-control"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
