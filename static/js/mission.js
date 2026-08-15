"use strict";

let running = false;
let phase = "IDLE";

// Public read-only mission state for safety/Arduino modules.
// Other scripts must use window.missionPhase instead of accessing the
// private `phase` binding directly.
Object.defineProperty(window, "missionPhase", {
  configurable: true,
  enumerable: false,
  get: () => phase
});
let countdown = 10;
let altitude = 0;
let velocity = 0;
let fuel = 100;
let temperature = 28;
let signal = 100;
let latency = 38;
let packetLoss = 0.01;
let gLoad = 1;
let pressure = 101.3;
let roll = 0;
let pitch = 0;
let yaw = 0;
let battery = 100;
let busVoltage = 28;
let thrust = 0;
let fuelFlow = 0;
let dataRate = 0;
let orbitSeconds = 0;
let missionSeconds = 0;
let timer = null;
let audioContext = null;
let soundEnabled = true;
let eventCount = 0;

// ==========================================================
// V10 FEATURE STATE
// ==========================================================

let v10Armed = false;
let v10Hold = false;
let v10Failure = false;
let v10ReplayTimer = null;
let v10Archive = [];
let v10GroundTrackAngle = 0;
let v10MaxAltitude = 0;
let v10MaxVelocity = 0;
let v10MaxTemperature = 28;


const audio = {
  ignition: new Audio("/static/assets/ignition.mp3"),
  liftoff: new Audio("/static/assets/liftoff.mp3"),
  orbit: new Audio("/static/assets/orbit_confirmed.mp3"),
  deployment: new Audio("/static/assets/satellite_deployed.mp3"),
  success: new Audio("/static/assets/mission_accomplished.mp3"),
  song: new Audio("/static/assets/maa_tujhe_salaam.mp3")
};

Object.values(audio).forEach(a => {
  a.preload = "auto";
  a.volume = 1;
});

const $ = id => document.getElementById(id);

const el = {
  missionTime: $("missionTime"),
  altitude: $("altitude"),
  velocity: $("velocity"),
  fuel: $("fuel"),
  temperature: $("temperature"),
  fuelPercent: $("fuelPercent"),
  fuelBar: $("fuelBar"),
  countdown: $("countdown"),
  flightStatus: $("flightStatus"),
  phase: $("phase"),
  phaseTop: null,
  vehicle: $("rocket"),
  vehicleState: $("vehicleState"),
  vehicleReadout: $("vehicleReadout"),
  sceneAltitude: $("sceneAltitude"),
  sceneCaption: $("vehicleReadout"),
  guidance: $("guidance"),
  orbitState: $("orbitState"),
  orbitalCraft: $("orbitalCraft"),
  satellite: $("satellite"),
  linkState: $("linkState"),
  signal: $("signal"),
  latency: $("latency"),
  missionLog: $("missionLog"),
  eventCount: $("eventCount"),
  subGuidance: $("subGuidance"),
  subPropulsion: $("subPropulsion"),
  subThermal: $("subThermal"),
  subAvionics: $("subAvionics"),
  subComms: $("subComms")
};

const adv = {
  gLoad: $("gLoad"),
  pressure: $("pressure"),
  roll: $("roll"),
  pitch: $("pitch"),
  yaw: $("yaw"),
  battery: $("battery"),
  busVoltage: $("busVoltage"),
  thrust: $("thrust"),
  fuelFlow: $("fuelFlow"),
  groundSignal: $("groundSignal"),
  groundLatency: $("groundLatency"),
  groundLoss: $("groundLoss"),
  groundPrimary: $("groundPrimary"),
  groundBengaluru: $("groundBengaluru"),
  groundPune: $("groundPune"),
  phase1State: $("phase1State")
};


/* ==========================================================
   AUDIO
   ========================================================== */

function initAudio() {
  if (!soundEnabled) return;

  try {
    if (!audioContext) {
      audioContext =
        new (window.AudioContext ||
        window.webkitAudioContext)();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
  } catch (_) {}
}


function beep() {
  if (!soundEnabled) return;

  initAudio();

  if (!audioContext) return;

  const osc =
    audioContext.createOscillator();

  const gain =
    audioContext.createGain();

  osc.type = "square";
  osc.frequency.value = 950;

  gain.gain.setValueAtTime(
    0.0001,
    audioContext.currentTime
  );

  gain.gain.exponentialRampToValueAtTime(
    0.15,
    audioContext.currentTime + 0.01
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    audioContext.currentTime + 0.11
  );

  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.start();

  osc.stop(
    audioContext.currentTime + 0.12
  );
}


function effectTone() {
  if (!soundEnabled) return;

  initAudio();

  if (!audioContext) return;

  const osc =
    audioContext.createOscillator();

  const gain =
    audioContext.createGain();

  osc.type = "sawtooth";
  osc.frequency.value = 240;

  gain.gain.setValueAtTime(
    0.0001,
    audioContext.currentTime
  );

  gain.gain.exponentialRampToValueAtTime(
    0.22,
    audioContext.currentTime + 0.05
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    audioContext.currentTime + 0.75
  );

  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.start();

  osc.stop(
    audioContext.currentTime + 0.8
  );
}


function playClip(name) {
  if (!soundEnabled || !audio[name]) return;

  const clip = audio[name];

  try {
    clip.pause();
    clip.currentTime = 0;

    const p = clip.play();

    if (p?.catch) {
      p.catch(() =>
        log(
          "AUDIO",
          `${name}.mp3 playback blocked`
        )
      );
    }

  } catch (_) {}
}


function stopAudio() {
  Object.values(audio).forEach(a => {
    try {
      a.pause();
      a.currentTime = 0;
    } catch (_) {}
  });
}


/* ==========================================================
   LOGGING
   ========================================================== */

function log(source, message) {

  eventCount += 1;

  const row =
    document.createElement("div");

  row.textContent =
    `[${source}] ${message}`;

  el.missionLog.appendChild(row);

  el.missionLog.scrollTop =
    el.missionLog.scrollHeight;

  el.eventCount.textContent =
    `${eventCount} EVENTS`;
}


/* ==========================================================
   CLOCK
   ========================================================== */

function updateClock() {

  const h =
    Math.floor(
      missionSeconds / 3600
    );

  const m =
    Math.floor(
      (missionSeconds % 3600) / 60
    );

  const s =
    missionSeconds % 60;

  el.missionTime.textContent =
    `T+ ${String(h).padStart(2,"0")}:` +
    `${String(m).padStart(2,"0")}:` +
    `${String(s).padStart(2,"0")}`;
}


/* ==========================================================
   TELEMETRY
   ========================================================== */

function updateTelemetry() {

  el.altitude.textContent =
    altitude.toFixed(1);

  el.velocity.textContent =
    velocity.toFixed(2);

  el.fuel.textContent =
    fuel.toFixed(1);

  el.temperature.textContent =
    temperature.toFixed(1);

  el.fuelPercent.textContent =
    `${Math.max(0, fuel).toFixed(0)}%`;

  el.fuelBar.style.width =
    `${Math.max(
      0,
      Math.min(100, fuel)
    )}%`;

  el.sceneAltitude.textContent =
    `ALT ${altitude.toFixed(1)} KM`;

  el.signal.textContent =
    `${signal.toFixed(0)}%`;

  el.latency.textContent =
    `${latency.toFixed(0)} MS`;


  if (adv.gLoad)
    adv.gLoad.textContent =
      `${gLoad.toFixed(2)} G`;

  if (adv.pressure)
    adv.pressure.textContent =
      `${pressure.toFixed(1)} KPA`;

  if (adv.roll)
    adv.roll.textContent =
      `${roll.toFixed(2)}°`;

  if (adv.pitch)
    adv.pitch.textContent =
      `${pitch.toFixed(2)}°`;

  if (adv.yaw)
    adv.yaw.textContent =
      `${yaw.toFixed(2)}°`;

  if (adv.battery)
    adv.battery.textContent =
      `${battery.toFixed(0)}%`;

  if (adv.busVoltage)
    adv.busVoltage.textContent =
      `${busVoltage.toFixed(1)} V`;

  if (adv.thrust)
    adv.thrust.textContent =
      `${thrust.toFixed(0)}%`;

  if (adv.fuelFlow)
    adv.fuelFlow.textContent =
      `${fuelFlow.toFixed(1)} KG/S`;

  if (adv.groundSignal)
    adv.groundSignal.textContent =
      `${signal.toFixed(0)}%`;

  if (adv.groundLatency)
    adv.groundLatency.textContent =
      `${latency.toFixed(0)} MS`;

  if (adv.groundLoss)
    adv.groundLoss.textContent =
      `${packetLoss.toFixed(2)}%`;

  if (adv.phase1State) {
    adv.phase1State.textContent =
      running
        ? "LIVE"
        : (
            phase === "ABORTED"
              ? "ABORTED"
              : "STANDBY"
          );
  }

  updateGroundNetwork();
  setSubsystems();
}


/* ==========================================================
   GROUND NETWORK
   ========================================================== */

function updateGroundNetwork() {

  if (!adv.groundPrimary) return;

  const state = {

    IDLE:
      ["ONLINE", "STANDBY", "STANDBY"],

    COUNTDOWN:
      ["LOCKED", "STANDBY", "STANDBY"],

    IGNITION:
      ["LOCKED", "STANDBY", "STANDBY"],

    LIFTOFF:
      ["TRACKING", "TRACKING", "STANDBY"],

    ASCENT:
      ["TRACKING", "TRACKING", "STANDBY"],

    ORBIT:
      ["PRIMARY", "ONLINE", "ONLINE"],

    "SATELLITE DEPLOYED":
      ["PRIMARY", "ONLINE", "ONLINE"],

    "MISSION SUCCESS":
      ["PRIMARY", "ONLINE", "ONLINE"],

    ABORTED:
      ["HOLD", "STANDBY", "STANDBY"]

  }[phase] ||
    ["ONLINE", "STANDBY", "STANDBY"];


  adv.groundPrimary.textContent =
    state[0];

  adv.groundBengaluru.textContent =
    state[1];

  adv.groundPune.textContent =
    state[2];
}


/* ==========================================================
   SUBSYSTEMS
   ========================================================== */

function setSubsystems() {

  el.subGuidance.textContent =
    running &&
    phase !== "ABORTED"
      ? "NOMINAL"
      : "STANDBY";

  el.subPropulsion.textContent =
    fuel < 20
      ? "ATTENTION"
      : "NOMINAL";

  el.subThermal.textContent =
    temperature > 80
      ? "ATTENTION"
      : "NOMINAL";

  el.subAvionics.textContent =
    "NOMINAL";

  el.subComms.textContent =
    signal < 80
      ? "ATTENTION"
      : "NOMINAL";
}


/* ==========================================================
   VEHICLE SCENE
   ========================================================== */

function updateScene() {

  const stateClass =
    phase === "IDLE"
      ? "PRE-LAUNCH"
      : phase;

  el.vehicle.className =
    `rocket ${phase}`;

  el.vehicleState.textContent =
    stateClass.replaceAll(
      "-",
      " "
    );

  el.vehicleReadout.textContent =
    phase === "IDLE"
      ? "VEHICLE READY"
      : stateClass;

  el.guidance.textContent =
    phase === "IDLE"
      ? "STANDBY"
      : "NOMINAL";


  if (
    phase === "ORBIT" ||
    phase === "SATELLITE DEPLOYED" ||
    phase === "MISSION SUCCESS"
  ) {

    el.orbitState.textContent =
      "ORBIT";

    el.orbitalCraft.style.opacity =
      "1";

  } else {

    el.orbitState.textContent =
      "GROUND";

    el.orbitalCraft.style.opacity =
      "0";
  }


  if (
    phase === "SATELLITE DEPLOYED" ||
    phase === "MISSION SUCCESS"
  ) {

    el.satellite.classList.add(
      "deployed"
    );

  } else {

    el.satellite.classList.remove(
      "deployed"
    );
  }
}


/* ==========================================================
   STATUS
   ========================================================== */

function updateStatus() {

  const labels = {

    IDLE:
      "READY FOR LAUNCH",

    COUNTDOWN:
      "COUNTDOWN INITIATED",

    IGNITION:
      "ENGINE IGNITION",

    LIFTOFF:
      "LIFTOFF CONFIRMED",

    ASCENT:
      "ASCENT NOMINAL",

    ORBIT:
      "ORBIT INSERTION",

    "SATELLITE DEPLOYED":
      "SATELLITE DEPLOYED",

    "MISSION SUCCESS":
      "MISSION SUCCESS",

    ABORTED:
      "MISSION ABORTED"
  };


  el.flightStatus.textContent =
    labels[phase] || phase;


  el.phase.textContent =
    phase === "SATELLITE DEPLOYED"
      ? "DEPLOYMENT"
      : phase === "MISSION SUCCESS"
        ? "MISSION COMPLETE"
        : phase;
}


function updateAll() {

  updateClock();
  updateTelemetry();
  updateStatus();
  updateScene();
}


/* ==========================================================
   RESET
   ========================================================== */

function resetMission() {

  running = false;

  clearInterval(timer);

  timer = null;

  stopAudio();


  phase = "IDLE";
  countdown = 10;
  altitude = 0;
  velocity = 0;
  fuel = 100;
  temperature = 28;
  signal = 100;
  latency = 38;
  packetLoss = 0.01;
  gLoad = 1;
  pressure = 101.3;
  roll = 0;
  pitch = 0;
  yaw = 0;
  battery = 100;
  busVoltage = 28;
  thrust = 0;
  fuelFlow = 0;
  dataRate = 0;
  orbitSeconds = 0;
  missionSeconds = 0;
  eventCount = 0;


  window.missionAscentAuthorized =
    false;

  window.missionAscentPermissionOpen =
    false;

  window.missionEmergencyActive =
    false;


  if (
    typeof v10Hold !==
    "undefined"
  ) {

    v10Hold = false;
  }


  if (
    typeof v10Failure !==
    "undefined"
  ) {

    v10Failure = false;
  }


  el.missionLog.innerHTML =
    "";

  el.eventCount.textContent =
    "0 EVENTS";

  el.countdown.textContent =
    "T−10";


  closeAscentPermission();

  updateAll();


  log(
    "SYSTEM",
    "Mission control initialized"
  );

  log(
    "SYSTEM",
    "Telemetry link established"
  );

  log(
    "SYSTEM",
    "Launch vehicle awaiting command"
  );
}


/* ==========================================================
   START MISSION
   ========================================================== */

function startMission() {

  // Never allow a second launch loop.
  if (running) return;

  initAudio();
  stopAudio();

  clearInterval(timer);

  timer = null;

  running = true;

  phase = "COUNTDOWN";

  countdown = 10;

  missionSeconds = 0;

  orbitSeconds = 0;

  altitude = 0;
  velocity = 0;
  fuel = 100;
  temperature = 28;
  signal = 100;
  latency = 38;

  // Show launch immediately
  el.countdown.textContent = "T−10";

  log(
    "FLIGHT",
    "Launch sequence initiated"
  );

  log(
    "COUNTDOWN",
    "T−10"
  );

  updateAll();

  // THIS WAS MISSING
  timer = setInterval(
    tick,
    1000
  );
}

/* ==========================================================
   ASCENT PERMISSION
   ========================================================== */

function requestAscentPermission() {

  if (
    !running ||
    phase !== "LIFTOFF"
  ) {

    return;
  }


  if (
    window.missionAscentAuthorized
  ) {

    return;
  }


  if (
    window.missionAscentPermissionOpen
  ) {

    return;
  }


  window.missionAscentPermissionOpen =
    true;


  log(
    "SAFETY",
    "Ascent permission required"
  );


  let modal =
    document.getElementById(
      "missionAscentPermission"
    );


  if (!modal) {

    modal =
      document.createElement(
        "div"
      );

    modal.id =
      "missionAscentPermission";


    modal.innerHTML = `

      <div
        class="mission-permission-backdrop"
      ></div>

      <div
        class="mission-permission-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="missionPermissionTitle"
      >

        <div
          class="mission-permission-alert"
        >
          ASCENT AUTHORIZATION REQUIRED
        </div>

        <h2
          id="missionPermissionTitle"
        >
          🚀 Permission to Ascent
        </h2>

        <p>
          Vehicle is stable after liftoff.
          Operator authorization is required
          before ascent can continue.
        </p>

        <div
          class="mission-permission-readout"
        >

          <span>
            FLIGHT PHASE
          </span>

          <strong>
            LIFTOFF
          </strong>

          <span>
            VEHICLE STATUS
          </span>

          <strong>
            NOMINAL
          </strong>

        </div>

        <div
          class="mission-permission-actions"
        >

          <button
            id="missionAuthorizeAscent"
            type="button"
          >
            AUTHORIZE ASCENT
          </button>

          <button
            id="missionAbortFromPermission"
            type="button"
          >
            ABORT MISSION
          </button>

        </div>

      </div>
    `;


    document.body.appendChild(
      modal
    );


    const styleId =
      "missionPermissionStyle";


    if (
      !document.getElementById(
        styleId
      )
    ) {

      const style =
        document.createElement(
          "style"
        );


      style.id =
        styleId;


      style.textContent = `

        #missionAscentPermission{
          position:fixed;
          inset:0;
          z-index:99999;
          display:grid;
          place-items:center;
          font-family:inherit;
        }

        .mission-permission-backdrop{
          position:absolute;
          inset:0;
          background:rgba(0,0,0,.78);
          backdrop-filter:blur(4px);
        }

        .mission-permission-card{
          position:relative;
          width:min(560px,calc(100vw - 32px));
          padding:28px;
          border:1px solid rgba(255,190,80,.7);
          background:#090d14;
          color:#eef4ff;
          box-shadow:0 0 50px rgba(255,150,40,.2);
        }

        .mission-permission-alert{
          font-size:12px;
          letter-spacing:.18em;
          color:#ffb454;
          margin-bottom:10px;
        }

        .mission-permission-card h2{
          margin:0 0 10px;
          font-size:28px;
        }

        .mission-permission-card p{
          color:#aeb9c9;
          line-height:1.5;
        }

        .mission-permission-readout{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:8px;
          margin:20px 0;
          padding:14px;
          background:#0e1520;
        }

        .mission-permission-readout span{
          font-size:10px;
          color:#728097;
          letter-spacing:.12em;
        }

        .mission-permission-readout strong{
          text-align:right;
          font-size:12px;
        }

        .mission-permission-actions{
          display:flex;
          gap:10px;
          justify-content:flex-end;
          flex-wrap:wrap;
        }

        .mission-permission-actions button{
          border:0;
          padding:12px 18px;
          font-weight:700;
          cursor:pointer;
        }

        #missionAuthorizeAscent{
          background:#d9ff72;
          color:#071008;
        }

        #missionAbortFromPermission{
          background:#ff4d4d;
          color:white;
        }
      `;


      document.head.appendChild(
        style
      );
    }


    document
      .getElementById(
        "missionAuthorizeAscent"
      )
      .addEventListener(
        "click",
        authorizeAscent
      );


    document
      .getElementById(
        "missionAbortFromPermission"
      )
      .addEventListener(
        "click",
        () =>
          abortMission(
            "OPERATOR_ASCENT_PERMISSION"
          )
      );
  }


  modal.style.display =
    "grid";


  updateAll();
}


/* ==========================================================
   AUTHORIZE ASCENT
   ========================================================== */

function authorizeAscent() {

  if (
    !running ||
    phase !== "LIFTOFF"
  ) {

    return;
  }


  window.missionAscentAuthorized =
    true;

  window.missionAscentPermissionOpen =
    false;


  closeAscentPermission();


  log(
    "SAFETY",
    "Ascent authorization granted"
  );


  if (
    typeof sendArduino ===
    "function"
  ) {

    sendArduino(
      "ASCENT_AUTHORIZED"
    ).catch?.(
      () => {}
    );
  }


  updateAll();
}


/* ==========================================================
   CLOSE ASCENT PERMISSION
   ========================================================== */

function closeAscentPermission() {

  const modal =
    document.getElementById(
      "missionAscentPermission"
    );


  if (modal) {

    modal.style.display =
      "none";
  }


  window.missionAscentPermissionOpen =
    false;
}


/* ==========================================================
   MAIN MISSION TICK
   ========================================================== */

function tick() {

  if (!running) return;


  // Safety hold freezes flight progression.
  if (
    typeof v10Hold !==
    "undefined" &&
    v10Hold
  ) {

    updateAll();

    return;
  }


  missionSeconds++;


  /* ========================================================
     COUNTDOWN
     ======================================================== */

  if (
    phase === "COUNTDOWN"
  ) {

    countdown--;


    if (
      countdown >= 1
    ) {

      el.countdown.textContent =
        `T−${countdown}`;


      log(
        "COUNTDOWN",
        `T−${countdown}`
      );


      beep();


      // Physical Arduino countdown.
      if (
        typeof sendArduino ===
        "function"
      ) {

        sendArduino(
          `COUNTDOWN:${countdown}`
        ).catch?.(
          () => {}
        );
      }

    }

    else {

      el.countdown.textContent =
        "T−0";


      phase =
        "IGNITION";


      effectTone();

      playClip(
        "ignition"
      );


      log(
        "ENGINE",
        "Main engine ignition"
      );


      if (
        typeof sendArduino ===
        "function"
      ) {

        sendArduino(
          "IGNITION"
        ).catch?.(
          () => {}
        );
      }
    }
  }


  /* ========================================================
     IGNITION
     ======================================================== */

  else if (
    phase === "IGNITION"
  ) {

    phase =
      "LIFTOFF";


    playClip(
      "liftoff"
    );


    log(
      "FLIGHT",
      "Vehicle clear of launch tower"
    );


    if (
      typeof sendArduino ===
      "function"
    ) {

      sendArduino(
        "LIFTOFF"
      ).catch?.(
        () => {}
      );
    }


    requestAscentPermission();
  }


  /* ========================================================
     LIFTOFF HOLD
     ======================================================== */

  else if (
    phase === "LIFTOFF"
  ) {

    /*
    IMPORTANT:
    Never automatically advance to ASCENT.

    The operator must authorize it.
    */

    if (
      !window.missionAscentAuthorized
    ) {

      requestAscentPermission();

      updateAll();

      return;
    }


    phase =
      "ASCENT";


    log(
      "FLIGHT",
      "Ascent authorized and initiated"
    );


    if (
      typeof sendArduino ===
      "function"
    ) {

      sendArduino(
        "ASCENT"
      ).catch?.(
        () => {}
      );
    }
  }


  /* ========================================================
     ASCENT
     ======================================================== */

  else if (
    phase === "ASCENT"
  ) {

    /*
    Stable bounded telemetry model.

    The old simulation used much larger
    random changes which caused the display
    to look like violent turbulence.

    These values change gradually.
    */

    const altitudeStep =
      14.5 +
      Math.random() * 2.5;


    const velocityStep =
      0.42 +
      Math.random() * 0.08;


    altitude +=
      altitudeStep;


    velocity +=
      velocityStep;


    fuel =
      Math.max(
        0,
        fuel -
          (
            1.2 +
            Math.random() * 0.15
          )
      );


    temperature +=
      (
        Math.random() -
        0.5
      ) * 0.7;


    signal =
      Math.max(
        82,
        signal -
          0.25 -
          Math.random() * 0.25
      );


    latency =
      38 +
      altitude * 0.035;


    gLoad =
      Math.max(
        1.7,
        Math.min(
          2.7,
          gLoad +
            (
              Math.random() -
              0.5
            ) * 0.16
        )
      );


    pressure =
      Math.max(
        18,
        101.3 -
          altitude * 0.78
      );


    roll =
      Math.max(
        -1.2,
        Math.min(
          1.2,
          roll +
            (
              Math.random() -
              0.5
            ) * 0.16
        )
      );


    pitch =
      Math.max(
        -2.5,
        Math.min(
          2.5,
          pitch +
            (
              Math.random() -
              0.5
            ) * 0.45
        )
      );


    yaw =
      Math.max(
        -1.0,
        Math.min(
          1.0,
          yaw +
            (
              Math.random() -
              0.5
            ) * 0.14
        )
      );


    battery =
      Math.max(
        88,
        battery - 0.05
      );


    busVoltage =
      27.8 +
      Math.random() * 0.35;


    thrust =
      96 +
      Math.random() * 3;


    fuelFlow =
      72 +
      Math.random() * 8;


    packetLoss =
      Math.max(
        0.01,
        (100 - signal) * 0.01
      );


    dataRate =
      2.5 +
      Math.random() * 1.5;


    if (
      altitude >= 110
    ) {

      phase =
        "ORBIT";


      orbitSeconds =
        0;


      playClip(
        "orbit"
      );


      log(
        "FLIGHT",
        "Stable orbital trajectory achieved"
      );


      if (
        typeof sendArduino ===
        "function"
      ) {

        sendArduino(
          "ORBIT"
        ).catch?.(
          () => {}
        );
      }
    }
  }


  /* ========================================================
     ORBIT
     ======================================================== */

  else if (
    phase === "ORBIT"
  ) {

    orbitSeconds++;


    altitude +=
      (
        Math.random() -
        0.5
      ) * 0.5;


    velocity +=
      (
        Math.random() -
        0.5
      ) * 0.015;


    fuel =
      Math.max(
        0,
        fuel - 0.12
      );


    temperature +=
      (
        Math.random() -
        0.5
      ) * 0.15;


    signal =
      94 +
      Math.random() * 4;


    latency =
      48 +
      Math.random() * 6;


    gLoad =
      0.98 +
      Math.random() * 0.05;


    pressure =
      18 +
      Math.random() * 1.5;


    roll =
      (
        Math.random() -
        0.5
      ) * 0.04;


    pitch =
      (
        Math.random() -
        0.5
      ) * 0.06;


    yaw =
      (
        Math.random() -
        0.5
      ) * 0.04;


    battery =
      Math.max(
        80,
        battery - 0.02
      );


    busVoltage =
      27.8 +
      Math.random() * 0.3;


    thrust =
      2 +
      Math.random() * 1.5;


    fuelFlow =
      1 +
      Math.random() * 0.5;


    packetLoss =
      0.01 +
      Math.random() * 0.03;


    dataRate =
      4 +
      Math.random() * 4;


    log(
      "ORBIT",
      `Orbital operations T+${orbitSeconds}s`
    );


    if (
      orbitSeconds >= 5
    ) {

      deploySatellite();
    }
  }


  updateAll();
}


/* ==========================================================
   SATELLITE DEPLOYMENT
   ========================================================== */

function deploySatellite() {

  running =
    false;


  clearInterval(
    timer
  );


  timer =
    null;


  phase =
    "SATELLITE DEPLOYED";


  playClip(
    "deployment"
  );


  log(
    "MISSION",
    "Satellite deployment successful"
  );


  if (
    typeof sendArduino ===
    "function"
  ) {

    sendArduino(
      "DEPLOY"
    ).catch?.(
      () => {}
    );
  }


  updateAll();


  setTimeout(
    () => {

      phase =
        "MISSION SUCCESS";


      playClip(
        "success"
      );


      log(
        "SUCCESS",
        "Mission accomplished"
      );


      if (
        typeof sendArduino ===
        "function"
      ) {

        sendArduino(
          "SUCCESS"
        ).catch?.(
          () => {}
        );
      }


      updateAll();


      setTimeout(
        () =>
          playClip(
            "song"
          ),
        3500
      );

    },
    3000
  );
}


/* ==========================================================
   ABORT
   ========================================================== */

function abortMission(
  reason = "MISSION_ABORT"
) {

  /*
  IMPORTANT:
  Abort must work even if the mission
  is paused at ascent permission.
  */

  running =
    false;


  clearInterval(
    timer
  );


  timer =
    null;


  window.missionEmergencyActive =
    false;


  window.missionAscentAuthorized =
    false;


  closeAscentPermission();


  stopAudio();


  phase =
    "ABORTED";


  log(
    "WARNING",
    `Mission abort command received${
      reason
        ? ` (${reason})`
        : ""
    }`
  );


  if (
    typeof sendArduino ===
    "function"
  ) {

    sendArduino(
      "ABORT"
    ).catch?.(
      () => {}
    );
  }


  updateAll();
}


/* ==========================================================
   EXTERNAL SAFETY HOOKS
   ========================================================== */

window.authorizeAscent =
  authorizeAscent;

window.requestAscentPermission =
  requestAscentPermission;

window.abortMission =
  abortMission;

window.resetMission =
  resetMission;


/* ==========================================================
   MAIN BUTTONS
   ========================================================== */

$("launchButton")
  .addEventListener(
    "click",
    startMission
  );


$("abortButton")
  .addEventListener(
    "click",
    abortMission
  );


$("fullscreenButton")
  .addEventListener(
    "click",
    () => {

      if (
        !document.fullscreenElement
      ) {

        document.documentElement
          .requestFullscreen();

      } else {

        document.exitFullscreen();
      }
    }
  );


resetMission();


/* ==========================================================
   V10 FEATURE LAYER
   ========================================================== */



const V10_PHASES = [

  "PRE-LAUNCH",
  "SYSTEM CHECK",
  "COUNTDOWN",
  "IGNITION",
  "LIFTOFF",
  "MAX-Q",
  "BOOSTER EVENT",
  "ASCENT",
  "ORBIT INSERTION",
  "ORBIT STABILIZATION",
  "PAYLOAD DEPLOYMENT",
  "PAYLOAD CHECK",
  "MISSION SUCCESS"

];


function v10Log(
  source,
  text
) {

  if (
    typeof logEvent ===
    "function"
  ) {

    logEvent(
      source,
      text
    );
  }


  const h =
    document.getElementById(
      "consoleHistory"
    );


  if (h) {

    const row =
      document.createElement(
        "div"
      );


    row.textContent =
      `[${source}] ${text}`;


    h.appendChild(
      row
    );


    h.scrollTop =
      h.scrollHeight;
  }
}


function v10SetPhase(
  newPhase
) {

  phase =
    newPhase;


  if (
    typeof updateAll ===
    "function"
  ) {

    updateAll();
  }


  if (
    document.getElementById(
      "eventState"
    )
  ) {

    document.getElementById(
      "eventState"
    ).textContent =
      newPhase;
  }
}


function v10RecalcHealth() {

  let health =
    100;


  if (v10Failure)
    health -= 35;


  if (
    typeof temperature !==
    "undefined" &&
    temperature > 80
  ) {

    health -= 15;
  }


  if (
    typeof signal !==
    "undefined" &&
    signal < 80
  ) {

    health -= 8;
  }


  if (
    typeof fuel !==
    "undefined" &&
    fuel < 20
  ) {

    health -= 8;
  }


  if (
    typeof battery !==
    "undefined" &&
    battery < 90
  ) {

    health -= 5;
  }


  health =
    Math.max(
      0,
      Math.min(
        100,
        health
      )
    );


  const hs =
    document.getElementById(
      "missionHealth"
    );


  if (hs) {

    hs.textContent =
      `${health.toFixed(0)}%`;
  }
}


function v10UpdateOrbitalData() {

  const alt =
    Number(
      typeof altitude ===
      "number"
        ? altitude
        : 0
    );


  const apo =
    Math.max(
      0,
      alt + 2
    );


  const peri =
    Math.max(
      0,
      alt - 2
    );


  const lat =
    (
      Math.sin(
        v10GroundTrackAngle
      ) * 80
    );


  const lon =
    (
      (
        v10GroundTrackAngle *
        180 /
        Math.PI
      ) +
      180
    ) % 360 - 180;


  const pairs = {

    apogee:
      `${apo.toFixed(0)} KM`,

    perigee:
      `${peri.toFixed(0)} KM`,

    inclination:
      `${(
        28.5 +
        (
          typeof pitch ===
          "number"
            ? pitch
            : 0
        ) * 0.05
      ).toFixed(1)}°`,

    orbitPeriod:
      alt > 0
        ? `${Math.max(
            1.5,
            Math.sqrt(
              Math.max(
                1,
                alt
              )
            ) * 1.6
          ).toFixed(1)} MIN`
        : "--",

    latitude:
      `${lat.toFixed(1)}°`,

    longitude:
      `${lon.toFixed(1)}°`
  };


  Object.entries(
    pairs
  ).forEach(
    ([id, value]) => {

      const element =
        document.getElementById(
          id
        );


      if (element) {

        element.textContent =
          value;
      }
    }
  );


  const track =
    document.getElementById(
      "groundTrack"
    );


  if (
    track &&
    (
      phase.includes("ORBIT") ||
      phase ===
        "PAYLOAD DEPLOYMENT" ||
      phase ===
        "PAYLOAD CHECK" ||
      phase ===
        "MISSION SUCCESS"
    )
  ) {

    track.classList.add(
      "active"
    );
  }
}


function v10UpdateRecorder() {

  if (
    typeof altitude ===
    "number"
  ) {

    v10MaxAltitude =
      Math.max(
        v10MaxAltitude,
        altitude
      );
  }


  if (
    typeof velocity ===
    "number"
  ) {

    v10MaxVelocity =
      Math.max(
        v10MaxVelocity,
        velocity
      );
  }


  if (
    typeof temperature ===
    "number"
  ) {

    v10MaxTemperature =
      Math.max(
        v10MaxTemperature,
        temperature
      );
  }


  window.chartLabels =
    window.chartLabels ||
    [];


  window.altitudeData =
    window.altitudeData ||
    [];


  window.velocityData =
    window.velocityData ||
    [];


  window.fuelData =
    window.fuelData ||
    [];


  window.chartLabels.push(
    `T+${missionSeconds}`
  );


  window.altitudeData.push(
    altitude
  );


  window.velocityData.push(
    velocity
  );


  window.fuelData.push(
    fuel
  );


  if (
    window.chartLabels.length >
    600
  ) {

    window.chartLabels.shift();
    window.altitudeData.shift();
    window.velocityData.shift();
    window.fuelData.shift();
  }


  v10GroundTrackAngle +=
    0.015;
}


function v10ArchiveLoad() {

  try {

    const saved =
      localStorage.getItem(
        "missionArchiveV10"
      );


    if (saved) {

      v10Archive =
        JSON.parse(
          saved
        );
    }

  } catch (_) {

    v10Archive =
      [];
  }


  v10RenderArchive();
}


function v10ArchiveSave() {

  const record = {

    timestamp:
      new Date().toISOString(),

    status:
      phase,

    duration:
      typeof missionSeconds ===
      "number"
        ? missionSeconds
        : 0,

    maxAltitude:
      Number(
        v10MaxAltitude.toFixed(2)
      ),

    maxVelocity:
      Number(
        v10MaxVelocity.toFixed(3)
      ),

    maxTemperature:
      Number(
        v10MaxTemperature.toFixed(1)
      )
  };


  v10Archive.unshift(
    record
  );


  v10Archive =
    v10Archive.slice(
      0,
      25
    );


  try {

    localStorage.setItem(
      "missionArchiveV10",
      JSON.stringify(
        v10Archive
      )
    );

  } catch {}


  v10RenderArchive();
}


function v10RenderArchive() {

  const list =
    document.getElementById(
      "archiveList"
    );


  if (!list) return;


  list.innerHTML =
    v10Archive.map(
      (r, i) =>
        `<div class="archive-card">
          SIM-${String(i + 1).padStart(3,"0")}
          • ${r.status}
          • ALT ${r.maxAltitude} KM
          • ${r.timestamp.slice(0,19).replace("T"," ")}
        </div>`
    ).join("");
}


function v10Replay() {

  if (v10ReplayTimer)
    return;


  const labels =
    window.chartLabels ||
    [];


  const altData =
    window.altitudeData ||
    [];


  const velData =
    window.velocityData ||
    [];


  const fuelData =
    window.fuelData ||
    [];


  if (!labels.length) {

    v10Log(
      "REPLAY",
      "No recorded telemetry in current session"
    );

    return;
  }


  let i = 0;


  v10Log(
    "REPLAY",
    "Mission replay started"
  );


  v10ReplayTimer =
    setInterval(
      () => {

        if (
          i >=
          labels.length
        ) {

          clearInterval(
            v10ReplayTimer
          );


          v10ReplayTimer =
            null;


          v10Log(
            "REPLAY",
            "Mission replay complete"
          );


          return;
        }


        const match =
          String(
            labels[i]
          ).match(
            /(\d+)/
          );


        const t =
          match
            ? match[1]
            : "0";


        const c =
          document.getElementById(
            "countdown"
          );


        if (c) {

          c.textContent =
            `T+${t}`;
        }


        if (
          document.getElementById(
            "altitude"
          ) &&
          altData[i] != null
        ) {

          document.getElementById(
            "altitude"
          ).textContent =
            Number(
              altData[i]
            ).toFixed(1);
        }


        if (
          document.getElementById(
            "velocity"
          ) &&
          velData[i] != null
        ) {

          document.getElementById(
            "velocity"
          ).textContent =
            Number(
              velData[i]
            ).toFixed(2);
        }


        if (
          document.getElementById(
            "fuel"
          ) &&
          fuelData[i] != null
        ) {

          document.getElementById(
            "fuel"
          ).textContent =
            Number(
              fuelData[i]
            ).toFixed(1);
        }


        i++;

      },
      300
    );
}


async function v10SaveToServer() {

  const payload = {

    timestamp:
      new Date().toISOString(),

    status:
      phase,

    duration:
      typeof missionSeconds ===
      "number"
        ? missionSeconds
        : 0,

    maxAltitude:
      Number(
        v10MaxAltitude.toFixed(2)
      ),

    maxVelocity:
      Number(
        v10MaxVelocity.toFixed(3)
      ),

    maxTemperature:
      Number(
        v10MaxTemperature.toFixed(1)
      )
  };


  try {

    const response =
      await fetch(
        "/api/missions",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body:
            JSON.stringify(
              payload
            )
        }
      );


    if (response.ok) {

      v10Log(
        "ARCHIVE",
        "Mission saved to server archive"
      );

    } else {

      v10Log(
        "ARCHIVE",
        "Server archive rejected the record"
      );
    }

  } catch {

    v10Log(
      "ARCHIVE",
      "Server archive unavailable; local archive retained"
    );
  }
}


function v10Console(
  command
) {

  const cmd =
    command
      .trim()
      .toUpperCase();


  if (!cmd) return;


  v10Log(
    "CMD",
    `> ${cmd}`
  );


  const send =
    async c => {

      if (
        typeof sendArduino ===
        "function"
      ) {

        await sendArduino(c);
      }
    };


  if (
    cmd === "HELP"
  ) {

    v10Log(
      "CMD",
      "ARM  LAUNCH  HOLD  RESUME  ABORT  RESET  FAILURE  STATUS  REPLAY"
    );


  } else if (
    cmd === "ARM"
  ) {

    v10Armed =
      true;


    v10Log(
      "OPERATOR",
      "Launch system armed"
    );


    send(
      "READY"
    );


  } else if (
    cmd === "LAUNCH"
  ) {

    if (
      typeof startMission ===
      "function"
    ) {

      startMission();
    }


  } else if (
    cmd === "HOLD"
  ) {

    v10Hold =
      true;


    if (
      typeof onHold !==
      "undefined"
    ) {

      onHold =
        true;
    }


    v10Log(
      "OPERATOR",
      "Mission hold requested"
    );


  } else if (
    cmd === "RESUME"
  ) {

    v10Hold =
      false;


    if (
      typeof onHold !==
      "undefined"
    ) {

      onHold =
        false;
    }


    v10Log(
      "OPERATOR",
      "Mission resumed"
    );


  } else if (
    cmd === "ABORT"
  ) {

    if (
      typeof abortMission ===
      "function"
    ) {

      abortMission();
    }


  } else if (
    cmd === "RESET"
  ) {

    if (
      typeof resetMission ===
      "function"
    ) {

      resetMission();
    }


  } else if (
    cmd === "FAILURE"
  ) {

    v10Failure =
      true;


    v10RecalcHealth();


    const msg =
      document.getElementById(
        "failureMessage"
      );


    if (msg) {

      msg.textContent =
        "SIMULATED FAILURE ACTIVE";
    }


    v10Log(
      "WARNING",
      "Simulated failure injected"
    );


  } else if (
    cmd === "STATUS"
  ) {

    v10Log(
      "STATUS",
      `PHASE=${phase} ` +
      `ALT=${Number(
        altitude || 0
      ).toFixed(1)}KM ` +
      `FUEL=${Number(
        fuel || 0
      ).toFixed(1)}%`
    );


  } else if (
    cmd === "REPLAY"
  ) {

    v10Replay();


  } else {

    v10Log(
      "CMD",
      "UNKNOWN COMMAND"
    );
  }
}


function v10Bind() {

  document
    .getElementById(
      "armButton"
    )
    ?.addEventListener(
      "click",
      async () => {

        v10Armed =
          true;


        const state =
          document.getElementById(
            "operatorState"
          );


        if (state) {

          state.textContent =
            "ARMED";
        }


        await (
          typeof sendArduino ===
          "function"
            ? sendArduino(
                "READY"
              )
            : Promise.resolve()
        );


        v10Log(
          "OPERATOR",
          "Launch system armed"
        );
      }
    );


  document
    .getElementById(
      "holdButton"
    )
    ?.addEventListener(
      "click",
      () => {

        v10Hold =
          true;


        if (
          typeof onHold !==
          "undefined"
        ) {

          onHold =
            true;
        }


        v10Log(
          "OPERATOR",
          "Mission hold"
        );
      }
    );


  document
    .getElementById(
      "resumeButton"
    )
    ?.addEventListener(
      "click",
      () => {

        v10Hold =
          false;


        if (
          typeof onHold !==
          "undefined"
        ) {

          onHold =
            false;
        }


        v10Log(
          "OPERATOR",
          "Mission resumed"
        );
      }
    );


  document
    .getElementById(
      "failureButton"
    )
    ?.addEventListener(
      "click",
      () => {

        v10Failure =
          true;


        const msg =
          document.getElementById(
            "failureMessage"
          );


        if (msg) {

          msg.textContent =
            "SIMULATED FAILURE ACTIVE";
        }


        v10RecalcHealth();


        v10Log(
          "WARNING",
          "Simulated failure injected"
        );
      }
    );


  document
    .getElementById(
      "consoleSend"
    )
    ?.addEventListener(
      "click",
      () => {

        const input =
          document.getElementById(
            "consoleInput"
          );


        v10Console(
          input?.value ||
          ""
        );


        if (input) {

          input.value =
            "";
        }
      }
    );


  document
    .getElementById(
      "consoleInput"
    )
    ?.addEventListener(
      "keydown",
      e => {

        if (
          e.key ===
          "Enter"
        ) {

          const input =
            e.target;


          v10Console(
            input.value
          );


          input.value =
            "";
        }
      }
    );


  document
    .getElementById(
      "saveMissionButton"
    )
    ?.addEventListener(
      "click",
      () => {

        v10ArchiveSave();

        v10SaveToServer();
      }
    );


  document
    .getElementById(
      "replayButton"
    )
    ?.addEventListener(
      "click",
      v10Replay
    );


  document
    .getElementById(
      "modeButton"
    )
    ?.addEventListener(
      "click",
      () => {

        document.body
          .classList
          .toggle(
            "exhibition"
          );
      }
    );
}


/* ==========================================================
   ADDITIVE V10 UPDATE WRAPPERS
   ========================================================== */

const oldUpdateTelemetry =
  window.updateTelemetry;


window.updateTelemetry =
  function () {

    if (
      typeof oldUpdateTelemetry ===
      "function"
    ) {

      oldUpdateTelemetry();
    }


    v10UpdateOrbitalData();

    v10UpdateRecorder();

    v10RecalcHealth();
  };


const oldUpdateAll =
  window.updateAll;


window.updateAll =
  function () {

    if (
      typeof oldUpdateAll ===
      "function"
    ) {

      oldUpdateAll();
    }


    v10UpdateOrbitalData();

    v10UpdateRecorder();

    v10RecalcHealth();
  };


v10ArchiveLoad();

v10Bind();


/* ==========================================================
   ARDUINO HARDWARE PANEL
   ========================================================== */

function arduinoPanelLog(
  message
) {

  const box =
    document.getElementById(
      "arduinoConsole"
    );


  if (!box) return;


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


function updateArduinoPanel(
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

    arduinoPanelLog(
      message
    );
  }
}


async function connectArduinoPanel() {

  if (
    typeof connectArduino !==
    "function"
  ) {

    return false;
  }


  const ok =
    await connectArduino();


  updateArduinoPanel(

    ok,

    ok
      ? "[HARDWARE] Arduino UNO connected"
      : "[HARDWARE] Connection failed or cancelled"
  );


  return ok;
}


async function hardwarePanelCommand(
  command,
  label
) {

  if (
    typeof sendArduino !==
    "function"
  ) {

    return false;
  }


  const ok =
    await sendArduino(
      command
    );


  arduinoPanelLog(
    `[HARDWARE] ${
      label ||
      command
    }`
  );


  return ok;
}


document
  .getElementById(
    "connectArduinoButton"
  )
  ?.addEventListener(
    "click",
    connectArduinoPanel
  );


document
  .getElementById(
    "hardwareReadyButton"
  )
  ?.addEventListener(
    "click",
    async () => {

      const ok =
        await hardwarePanelCommand(
          "READY",
          "READY signal sent"
        );


      const led =
        document.getElementById(
          "ledStatus"
        );


      const buzzer =
        document.getElementById(
          "buzzerStatus"
        );


      if (led) {

        led.textContent =
          ok
            ? "READY"
            : "OFFLINE";
      }


      if (buzzer) {

        buzzer.textContent =
          ok
            ? "STANDBY"
            : "OFFLINE";
      }
    }
  );


document
  .getElementById(
    "hardwareAbortButton"
  )
  ?.addEventListener(
    "click",
    async () => {

      const ok =
        await hardwarePanelCommand(
          "ABORT",
          "ABORT signal sent"
        );


      const led =
        document.getElementById(
          "ledStatus"
        );


      const buzzer =
        document.getElementById(
          "buzzerStatus"
        );


      if (led) {

        led.textContent =
          "OFF";
      }


      if (buzzer) {

        buzzer.textContent =
          ok
            ? "OFF"
            : "OFFLINE";
      }
    }
  );


if (
  "serial" in navigator
) {

  navigator.serial.addEventListener(
    "disconnect",
    event => {

      if (
        typeof arduinoPort !==
        "undefined" &&
        arduinoPort ===
        event.target
      ) {

        arduinoPanelLog(
          "[HARDWARE] Arduino UNO disconnected"
        );


        updateArduinoPanel(
          false
        );
      }
    }
  );
}


document
  .getElementById(
    "launchButton"
  )
  ?.addEventListener(
    "click",
    () => {

      setTimeout(
        () => {

          if (
            typeof arduinoWriter !==
              "undefined" &&
            arduinoWriter
          ) {

            updateArduinoPanel(
              true
            );


            const led =
              document.getElementById(
                "ledStatus"
              );


            if (led) {

              led.textContent =
                "ACTIVE";
            }
          }

        },
        250
      );
    }
  );