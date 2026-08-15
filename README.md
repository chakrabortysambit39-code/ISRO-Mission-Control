# Mission Control

Mission-control simulation with Arduino UNO Web Serial integration.

## Run locally

```powershell
py -m pip install -r requirements.txt
py app.py
```

Open `http://localhost:5000` in Chrome or Edge.

## Arduino

1. Connect the Arduino UNO by USB.
2. Open the site in Chrome/Edge.
3. Click **CONNECT ARDUINO**.
4. Choose the Arduino serial port.
5. The browser receives Arduino events through Web Serial.

The emergency ABORT path is intentionally separated into `arduino.js` and `safety.js`. `safety.js` never accesses the private `phase` variable from `mission.js`; it uses `window.missionPhase` and calls `window.abortMission()`.
