"use strict";

let arduinoPort = null;
let arduinoWriter = null;
let arduinoReader = null;
let arduinoReading = false;
let arduinoBuffer = "";

function arduinoLog(message) {
  const box = document.getElementById("arduinoConsole");
  if (box) {
    const row = document.createElement("div");
    row.textContent = message;
    box.appendChild(row);
    box.scrollTop = box.scrollHeight;
  }
  if (typeof window.arduinoPanelLog === "function") {
    window.arduinoPanelLog(message);
  }
}

function setArduinoConnected(connected, message = "") {
  const status = document.getElementById("arduinoStatus");
  const serial = document.getElementById("serialStatus");
  if (status) {
    status.textContent = connected ? "CONNECTED" : "DISCONNECTED";
    status.classList.toggle("status-connected", connected);
    status.classList.toggle("status-error", !connected);
  }
  if (serial) serial.textContent = connected ? "ONLINE" : "OFFLINE";
  if (message) arduinoLog(message);
}

async function connectArduino() {
  if (!("serial" in navigator)) {
    arduinoLog("[ARDUINO] Web Serial is not supported in this browser");
    setArduinoConnected(false);
    return false;
  }

  try {
    if (arduinoPort && arduinoPort.readable && arduinoWriter) {
      setArduinoConnected(true, "[ARDUINO] Already connected");
      return true;
    }

    arduinoPort = await navigator.serial.requestPort();
    await arduinoPort.open({ baudRate: 9600 });

    arduinoWriter = arduinoPort.writable.getWriter();
    setArduinoConnected(true, "[ARDUINO] Serial link established");
    startArduinoReader();
    return true;
  } catch (error) {
    arduinoLog(`[ARDUINO] Connection failed: ${error?.message || error}`);
    arduinoPort = null;
    arduinoWriter = null;
    setArduinoConnected(false);
    return false;
  }
}

async function startArduinoReader() {
  if (!arduinoPort?.readable || arduinoReading) return;
  arduinoReading = true;

  try {
    arduinoReader = arduinoPort.readable.getReader();
    const decoder = new TextDecoder();

    while (arduinoReading) {
      const { value, done } = await arduinoReader.read();
      if (done) break;
      if (!value) continue;

      arduinoBuffer += decoder.decode(value, { stream: true });
      const lines = arduinoBuffer.split(/\r?\n/);
      arduinoBuffer = lines.pop() || "";

      for (const raw of lines) {
        const line = raw.trim();
        if (line) handleArduinoResponse(line);
      }
    }
  } catch (error) {
    if (arduinoReading) {
      arduinoLog(`[ARDUINO] Reader error: ${error?.message || error}`);
    }
  } finally {
    try { arduinoReader?.releaseLock(); } catch (_) {}
    arduinoReader = null;
    arduinoReading = false;
  }
}

async function sendArduino(command) {
  const cmd = String(command || "").trim();
  if (!cmd) return false;

  if (!arduinoWriter) {
    arduinoLog(`[ARDUINO] Cannot send ${cmd}: controller offline`);
    return false;
  }

  try {
    await arduinoWriter.write(new TextEncoder().encode(cmd + "\n"));
    arduinoLog(`[ARDUINO] TX → ${cmd}`);
    return true;
  } catch (error) {
    arduinoLog(`[ARDUINO] TX error: ${error?.message || error}`);
    return false;
  }
}

function handleArduinoResponse(line) {
  arduinoLog(`[ARDUINO] RX ← ${line}`);

  const upper = line.toUpperCase();

  // Emergency button/event from the Arduino. Never access the mission.js
  // private `phase` variable here; safety.js reads window.missionPhase.
  if (upper.startsWith("EVENT:ABORT")) {
    if (typeof window.abortFromEmergency === "function") {
      window.abortFromEmergency(line);
    } else if (typeof window.abortMission === "function") {
      window.abortMission("ARDUINO_EMERGENCY");
    }
    return;
  }

  if (upper.startsWith("EVENT:")) {
    if (typeof window.handleSafetyArduinoEvent === "function") {
      window.handleSafetyArduinoEvent(line);
    }
  }
}

async function disconnectArduino() {
  arduinoReading = false;
  try { await arduinoReader?.cancel(); } catch (_) {}
  try { arduinoWriter?.releaseLock(); } catch (_) {}
  arduinoReader = null;
  arduinoWriter = null;
  try { await arduinoPort?.close(); } catch (_) {}
  arduinoPort = null;
  setArduinoConnected(false, "[ARDUINO] Serial link closed");
}

window.connectArduino = connectArduino;
window.sendArduino = sendArduino;
window.disconnectArduino = disconnectArduino;
window.handleArduinoResponse = handleArduinoResponse;

if ("serial" in navigator) {
  navigator.serial.addEventListener("disconnect", event => {
    if (arduinoPort && event.target === arduinoPort) {
      arduinoReading = false;
      try { arduinoWriter?.releaseLock(); } catch (_) {}
      arduinoReader = null;
      arduinoWriter = null;
      arduinoPort = null;
      setArduinoConnected(false, "[ARDUINO] UNO disconnected");
    }
  });
}
