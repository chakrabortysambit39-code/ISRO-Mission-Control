"use strict";

let arduinoPort = null;
let arduinoWriter = null;
let arduinoReader = null;
let arduinoReading = false;
let arduinoBuffer = "";


/* ==========================================================
   ARDUINO LOG
   ========================================================== */

function arduinoLog(message) {

  const box =
    document.getElementById(
      "arduinoConsole"
    );

  if (box) {

    const row =
      document.createElement(
        "div"
      );

    row.textContent =
      message;

    box.appendChild(
      row
    );

    box.scrollTop =
      box.scrollHeight;
  }

  if (
    typeof window.arduinoPanelLog ===
    "function"
  ) {

    window.arduinoPanelLog(
      message
    );
  }
}


/* ==========================================================
   CONNECTION STATUS
   ========================================================== */

function setArduinoConnected(
  connected,
  message = ""
) {

  const status =
    document.getElementById(
      "arduinoStatus"
    );

  const serial =
    document.getElementById(
      "serialStatus"
    );

  if (status) {

    status.textContent =
      connected
        ? "CONNECTED"
        : "DISCONNECTED";

    status.classList.toggle(
      "status-connected",
      connected
    );

    status.classList.toggle(
      "status-error",
      !connected
    );
  }

  if (serial) {

    serial.textContent =
      connected
        ? "ONLINE"
        : "OFFLINE";
  }

  if (message) {

    arduinoLog(
      message
    );
  }
}


/* ==========================================================
   EMERGENCY WEBSITE DISPLAY
   ========================================================== */

function createEmergencyDisplay() {

  let display =
    document.getElementById(
      "arduinoEmergencyDisplay"
    );

  if (display) {
    return display;
  }


  display =
    document.createElement(
      "div"
    );

  display.id =
    "arduinoEmergencyDisplay";

  display.innerHTML = `

    <div
      id="arduinoEmergencyBackdrop"
    ></div>

    <div
      id="arduinoEmergencyCard"
    >

      <div
        id="arduinoEmergencyIcon"
      >
        🚨
      </div>

      <div
        id="arduinoEmergencyTitle"
      >
        EMERGENCY ALARM
      </div>

      <div
        id="arduinoEmergencyMessage"
      >
        PHYSICAL EMERGENCY BUTTON ACTIVATED
      </div>

      <div
        id="arduinoEmergencyStatus"
      >
        ARDUINO EMERGENCY SYSTEM ACTIVE
      </div>

    </div>
  `;


  document.body.appendChild(
    display
  );


  const style =
    document.createElement(
      "style"
    );

  style.id =
    "arduinoEmergencyDisplayStyle";


  style.textContent = `

    #arduinoEmergencyDisplay {
      position: fixed;
      inset: 0;
      z-index: 1000000;
      display: none;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      font-family: inherit;
    }

    #arduinoEmergencyBackdrop {
      position: absolute;
      inset: 0;
      background: rgba(130, 0, 0, 0.28);
      animation: emergencyFlash 0.55s infinite alternate;
    }

    #arduinoEmergencyCard {
      position: relative;
      width: min(620px, calc(100vw - 40px));
      padding: 32px;
      text-align: center;
      border: 2px solid #ff3636;
      background: rgba(8, 8, 12, 0.97);
      box-shadow:
        0 0 30px rgba(255, 30, 30, 0.7),
        0 0 90px rgba(255, 30, 30, 0.35);
      animation: emergencyCardPulse 0.7s infinite alternate;
    }

    #arduinoEmergencyIcon {
      font-size: 54px;
      margin-bottom: 8px;
    }

    #arduinoEmergencyTitle {
      font-size: 30px;
      font-weight: 900;
      letter-spacing: 0.16em;
      color: #ff4b4b;
      margin-bottom: 12px;
    }

    #arduinoEmergencyMessage {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 12px;
    }

    #arduinoEmergencyStatus {
      font-size: 12px;
      letter-spacing: 0.12em;
      color: #ffb2b2;
    }

    @keyframes emergencyFlash {
      from {
        opacity: 0.18;
      }

      to {
        opacity: 0.42;
      }
    }

    @keyframes emergencyCardPulse {
      from {
        transform: scale(1);
      }

      to {
        transform: scale(1.015);
      }
    }

    body.arduino-emergency-active
      #arduinoEmergencyDisplay {
      display: flex;
    }
  `;


  document.head.appendChild(
    style
  );


  return display;
}


/* ==========================================================
   SHOW EMERGENCY
   ========================================================== */

function showArduinoEmergency(
  source = "PHYSICAL_BUTTON"
) {

  createEmergencyDisplay();

  document.body.classList.add(
    "arduino-emergency-active"
  );


  const message =
    document.getElementById(
      "arduinoEmergencyMessage"
    );

  const status =
    document.getElementById(
      "arduinoEmergencyStatus"
    );


  if (message) {

    message.textContent =
      source === "PHYSICAL_BUTTON"
        ? "PHYSICAL EMERGENCY BUTTON ACTIVATED"
        : `EMERGENCY SOURCE: ${source}`;
  }


  if (status) {

    status.textContent =
      "ARDUINO EMERGENCY SYSTEM ACTIVE";
  }


  arduinoLog(
    `[SAFETY] 🚨 EMERGENCY ACTIVE — ${source}`
  );


  /*
    Keep the mission itself held in the
    emergency state.

    We do NOT automatically abort here.
    The user's double press performs the abort.
  */

  if (
    typeof window.handleSafetyArduinoEvent ===
    "function"
  ) {

    window.handleSafetyArduinoEvent(
      `EVENT:EMERGENCY:${source}`
    );
  }
}


/* ==========================================================
   HIDE EMERGENCY
   ========================================================== */

function hideArduinoEmergency(
  statusText = "EMERGENCY CLEARED"
) {

  document.body.classList.remove(
    "arduino-emergency-active"
  );


  const status =
    document.getElementById(
      "arduinoEmergencyStatus"
    );


  if (status) {

    status.textContent =
      statusText;
  }
}


/* ==========================================================
   SHOW ABORTED STATE
   ========================================================== */

function showArduinoAbort(
  source = "ARDUINO"
) {

  const display =
    createEmergencyDisplay();

  document.body.classList.add(
    "arduino-emergency-active"
  );


  const title =
    document.getElementById(
      "arduinoEmergencyTitle"
    );

  const message =
    document.getElementById(
      "arduinoEmergencyMessage"
    );

  const status =
    document.getElementById(
      "arduinoEmergencyStatus"
    );


  if (title) {

    title.textContent =
      "MISSION ABORTED";
  }


  if (message) {

    message.textContent =
      "EMERGENCY ABORT FROM ARDUINO";
  }


  if (status) {

    status.textContent =
      `ABORT SOURCE: ${source}`;
  }


  /*
    Turn the overlay into an aborted
    mission notification after a moment.
  */

  setTimeout(
    () => {

      document.body.classList.remove(
        "arduino-emergency-active"
      );

    },
    4000
  );
}


/* ==========================================================
   CONNECT ARDUINO
   ========================================================== */

async function connectArduino() {

  if (
    !("serial" in navigator)
  ) {

    arduinoLog(
      "[ARDUINO] Web Serial is not supported in this browser"
    );

    setArduinoConnected(
      false
    );

    return false;
  }


  try {

    if (
      arduinoPort &&
      arduinoPort.readable &&
      arduinoWriter
    ) {

      setArduinoConnected(
        true,
        "[ARDUINO] Already connected"
      );

      return true;
    }


    arduinoPort =
      await navigator.serial.requestPort();


    await arduinoPort.open({
      baudRate: 9600
    });


    arduinoWriter =
      arduinoPort.writable.getWriter();


    setArduinoConnected(
      true,
      "[ARDUINO] Serial link established"
    );


    startArduinoReader();


    return true;

  } catch (error) {

    arduinoLog(
      `[ARDUINO] Connection failed: ${
        error?.message ||
        error
      }`
    );


    arduinoPort =
      null;

    arduinoWriter =
      null;


    setArduinoConnected(
      false
    );


    return false;
  }
}


/* ==========================================================
   SERIAL READER
   ========================================================== */

async function startArduinoReader() {

  if (
    !arduinoPort?.readable ||
    arduinoReading
  ) {

    return;
  }


  arduinoReading =
    true;


  try {

    arduinoReader =
      arduinoPort.readable.getReader();


    const decoder =
      new TextDecoder();


    while (
      arduinoReading
    ) {

      const {
        value,
        done
      } =
        await arduinoReader.read();


      if (done) {
        break;
      }


      if (!value) {
        continue;
      }


      arduinoBuffer +=
        decoder.decode(
          value,
          {
            stream: true
          }
        );


      const lines =
        arduinoBuffer.split(
          /\r?\n/
        );


      arduinoBuffer =
        lines.pop() ||
        "";


      for (
        const raw of lines
      ) {

        const line =
          raw.trim();


        if (line) {

          handleArduinoResponse(
            line
          );
        }
      }
    }

  } catch (error) {

    if (arduinoReading) {

      arduinoLog(
        `[ARDUINO] Reader error: ${
          error?.message ||
          error
        }`
      );
    }

  } finally {

    try {

      arduinoReader
        ?.releaseLock();

    } catch (_) {}


    arduinoReader =
      null;

    arduinoReading =
      false;
  }
}


/* ==========================================================
   SEND TO ARDUINO
   ========================================================== */

async function sendArduino(
  command
) {

  const cmd =
    String(
      command ||
      ""
    ).trim();


  if (!cmd) {
    return false;
  }


  if (!arduinoWriter) {

    arduinoLog(
      `[ARDUINO] Cannot send ${cmd}: controller offline`
    );

    return false;
  }


  try {

    await arduinoWriter.write(
      new TextEncoder().encode(
        cmd + "\n"
      )
    );


    arduinoLog(
      `[ARDUINO] TX → ${cmd}`
    );


    return true;

  } catch (error) {

    arduinoLog(
      `[ARDUINO] TX error: ${
        error?.message ||
        error
      }`
    );


    return false;
  }
}


/* ==========================================================
   PROCESS ARDUINO RESPONSE
   ========================================================== */

function handleArduinoResponse(
  line
) {

  arduinoLog(
    `[ARDUINO] RX ← ${line}`
  );


  const upper =
    line.toUpperCase();


  /* ========================================================
     EMERGENCY EVENT
     ======================================================== */

  if (
    upper.startsWith(
      "EVENT:EMERGENCY"
    )
  ) {

    let source =
      "PHYSICAL_BUTTON";


    const parts =
      line.split(":");


    if (
      parts.length >= 3 &&
      parts[2]
    ) {

      source =
        parts
          .slice(2)
          .join(":")
          .trim();
    }


    showArduinoEmergency(
      source
    );


    return;
  }


  /* ========================================================
     ABORT EVENT
     ======================================================== */

  if (
    upper.startsWith(
      "EVENT:ABORT"
    )
  ) {

    const parts =
      line.split(":");


    const source =
      parts.length >= 3
        ? parts
            .slice(2)
            .join(":")
            .trim()
        : "ARDUINO";


    showArduinoAbort(
      source
    );


    if (
      typeof window.abortFromEmergency ===
      "function"
    ) {

      window.abortFromEmergency(
        line
      );

    } else if (
      typeof window.abortMission ===
      "function"
    ) {

      window.abortMission(
        "ARDUINO_EMERGENCY"
      );
    }


    return;
  }


  /* ========================================================
     ABORT CONFIRMATION
     ======================================================== */

  if (
    upper ===
    "ABORT_OK"
  ) {

    showArduinoAbort(
      "ARDUINO"
    );


    return;
  }


  /* ========================================================
     OTHER EVENT
     ======================================================== */

  if (
    upper.startsWith(
      "EVENT:"
    )
  ) {

    if (
      typeof window.handleSafetyArduinoEvent ===
      "function"
    ) {

      window.handleSafetyArduinoEvent(
        line
      );
    }


    return;
  }


  /* ========================================================
     NORMAL SAFETY EVENTS
     ======================================================== */

  if (
    upper ===
      "READY_OK" ||
    upper.startsWith(
      "COUNTDOWN_OK:"
    ) ||
    upper ===
      "IGNITION_OK" ||
    upper ===
      "LIFTOFF_OK" ||
    upper ===
      "ASCENT_OK" ||
    upper ===
      "ORBIT_OK" ||
    upper ===
      "DEPLOY_OK" ||
    upper ===
      "SUCCESS_OK" ||
    upper ===
      "WARNING_OK"
  ) {

    if (
      typeof window.handleSafetyArduinoEvent ===
      "function"
    ) {

      window.handleSafetyArduinoEvent(
        line
      );
    }


    return;
  }
}


/* ==========================================================
   DISCONNECT
   ========================================================== */

async function disconnectArduino() {

  arduinoReading =
    false;


  try {

    await arduinoReader?.cancel();

  } catch (_) {}


  try {

    arduinoWriter?.releaseLock();

  } catch (_) {}


  arduinoReader =
    null;

  arduinoWriter =
    null;


  try {

    await arduinoPort?.close();

  } catch (_) {}


  arduinoPort =
    null;


  setArduinoConnected(
    false,
    "[ARDUINO] Serial link closed"
  );
}


/* ==========================================================
   GLOBAL API
   ========================================================== */

window.connectArduino =
  connectArduino;

window.sendArduino =
  sendArduino;

window.disconnectArduino =
  disconnectArduino;

window.handleArduinoResponse =
  handleArduinoResponse;

window.showArduinoEmergency =
  showArduinoEmergency;

window.hideArduinoEmergency =
  hideArduinoEmergency;

window.showArduinoAbort =
  showArduinoAbort;


/* ==========================================================
   PHYSICAL SERIAL DISCONNECT
   ========================================================== */

if (
  "serial" in navigator
) {

  navigator.serial.addEventListener(
    "disconnect",
    event => {

      if (
        arduinoPort &&
        event.target ===
        arduinoPort
      ) {

        arduinoReading =
          false;


        try {

          arduinoWriter
            ?.releaseLock();

        } catch (_) {}


        arduinoReader =
          null;

        arduinoWriter =
          null;

        arduinoPort =
          null;


        setArduinoConnected(
          false,
          "[ARDUINO] UNO disconnected"
        );
      }
    }
  );
}
