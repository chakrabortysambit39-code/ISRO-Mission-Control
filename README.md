# Mission Control Project

Standalone Flask mission-control simulator with a fixed three-panel GUI.

## Local

```powershell
python -m pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5000

## Render

Build command: `pip install -r requirements.txt`

Start command: `gunicorn app:app`

## Audio

Place these files in `static/assets/`:

- ignition.mp3
- liftoff.mp3
- orbit_confirmed.mp3
- satellite_deployed.mp3
- mission_accomplished.mp3
- maa_tujhe_salaam.mp3

The countdown remains electronic. Mission announcements use the recorded audio files above.
