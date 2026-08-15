# Mission Control Project V3.1

Upgrade: Advanced telemetry + ground station network, built on the previously working GUI.

Keep the existing visual design as the baseline.

Run locally:
python -m pip install -r requirements.txt
python app.py

Render:
Build: pip install -r requirements.txt
Start: gunicorn app:app

Audio files belong in static/assets/: ignition.mp3, liftoff.mp3, orbit_confirmed.mp3, satellite_deployed.mp3, mission_accomplished.mp3, maa_tujhe_salaam.mp3

Hardware sketch: hardware/mission_control_arduino.ino
