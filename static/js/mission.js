"use strict";

/* ==========================================================
   MISSION STATE
   ========================================================== */

let running = false;
let phase = "IDLE";

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
let eventCount = 0;


/* ==========================================================
   V10 STATE
   ========================================================== */

let v10Armed = false;
let v10Hold = false;
let v10Failure = false;
let v10ReplayTimer = null;

let v10Archive = [];

let v10GroundTrackAngle = 0;

let v10MaxAltitude = 0;
let v10MaxVelocity = 0;
let v10MaxTemperature = 28;


/* ==========================================================
   AUDIO
   ========================================================== */

let audioContext = null;
let soundEnabled = true;


/*
  IMPORTANT:
  Your actual MP3 files are expected here:

  static/assets/audio/
      ignition.mp3
      liftoff.mp3
      orbit_confirmed.mp3
      satellite_deployed.mp3
      mission_accomplished.mp3
      maa_tujhe_salaam.mp3
*/

const audio = {

  ignition:
    new Audio(
      "/static/assets/audio/ignition.mp3"
    ),

  liftoff:
    new Audio(
      "/static/assets/audio/liftoff.mp3"
    ),

  orbit:
    new Audio(
      "/static/assets/audio/orbit_confirmed.mp3"
    ),

  deployment:
    new Audio(
      "/static/assets/audio/satellite_deployed.mp3"
    ),

  success:
    new Audio(
      "/static/assets/audio/mission_accomplished.mp3"
    ),

  song:
    new Audio(
      "/static/assets/audio/maa_tujhe_salaam.mp3"
    )
};


Object.values(audio).forEach(
  sound => {

    sound.preload = "auto";
    sound.volume = 1;
  }
);


/* ==========================================================
   ELEMENT HELPER
   ========================================================== */

const $ =
  id =>
    document.getElementById(id);


/* ==========================================================
   ELEMENTS
   ========================================================== */

const el = {

  missionTime:
    $("missionTime"),

  altitude:
    $("altitude"),

  velocity:
    $("velocity"),

  fuel:
    $("fuel"),

  temperature:
    $("temperature"),

  fuelPercent:
    $("fuelPercent"),

  fuelBar:
    $("fuelBar"),

  countdown:
    $("countdown"),

  flightStatus:
    $("flightStatus"),

  phase:
    $("phase"),

  vehicle:
    $("rocket"),

  vehicleState:
    $("vehicleState"),

  vehicleReadout:
    $("vehicleReadout"),

  sceneAltitude:
    $("sceneAltitude"),

  guidance:
    $("guidance"),

  orbitState:
    $("orbitState"),

  orbitalCraft:
    $("orbitalCraft"),

  satellite:
    $("satellite"),

  linkState:
    $("linkState"),

  signal:
    $("signal"),

  latency:
    $("latency"),

  missionLog:
    $("missionLog"),

  eventCount:
    $("eventCount"),

  subGuidance:
    $("subGuidance"),

  subPropulsion:
    $("subPropulsion"),

  subThermal:
    $("subThermal"),

  subAvionics:
    $("subAvionics"),

  subComms:
    $("subComms")
};


/* ==========================================================
   ADVANCED TELEMETRY
   ========================================================== */

const adv = {

  gLoad:
    $("gLoad"),

  pressure:
    $("pressure"),

  roll:
    $("roll"),

  pitch:
    $("pitch"),

  yaw:
    $("yaw"),

  battery:
    $("battery"),

  busVoltage:
    $("busVoltage"),

  thrust:
    $("thrust"),

  fuelFlow:
    $("fuelFlow"),

  groundSignal:
    $("groundSignal"),

  groundLatency:
    $("groundLatency"),

  groundLoss:
    $("groundLoss"),

  groundPrimary:
    $("groundPrimary"),

  groundBengaluru:
    $("groundBengaluru"),

  groundPune:
    $("groundPune"),

  phase1State:
    $("phase1State")
};


/* ==========================================================
   AUDIO INITIALIZATION
   ========================================================== */

function initAudio() {

  if (!soundEnabled)
    return;

  try {

    if (!audioContext) {

      audioContext =
        new (
          window.AudioContext ||
          window.webkitAudioContext
        )();
    }


    if (
      audioContext.state ===
      "suspended"
    ) {

      audioContext.resume();
    }

  } catch (_) {}
}


/* ==========================================================
   UNLOCK MP3 AUDIO
   ========================================================== */

/*
  Chrome/Edge can block audio that starts automatically.

  The LAUNCH button is a real user interaction, so we use
  that click to unlock the audio elements.

  We immediately pause them again, so the MP3s don't actually
  play during the unlock process.
*/

async function unlockMissionAudio() {

  if (!soundEnabled)
    return;

  initAudio();


  for (
    const sound of Object.values(audio)
  ) {

    try {

      sound.muted = true;

      const promise =
        sound.play();

      if (promise) {

        await promise;
      }

      sound.pause();

      sound.currentTime = 0;

      sound.muted = false;

    } catch (_) {

      sound.muted = false;
    }
  }


  try {

    if (
      audioContext &&
      audioContext.state ===
        "suspended"
    ) {

      await audioContext.resume();
    }

  } catch (_) {}
}


/* ==========================================================
   BEEP
   ========================================================== */

function beep() {

  if (!soundEnabled)
    return;

  initAudio();

  if (!audioContext)
    return;


  try {

    const oscillator =
      audioContext.createOscillator();

    const gain =
      audioContext.createGain();


    oscillator.type =
      "square";

    oscillator.frequency.value =
      950;


    gain.gain.setValueAtTime(
      0.0001,
      audioContext.currentTime
    );


    gain.gain.exponentialRampToValueAtTime(
      0.15,
      audioContext.currentTime +
        0.01
    );


    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime +
        0.11
    );


    oscillator.connect(gain);

    gain.connect(
      audioContext.destination
    );


    oscillator.start();

    oscillator.stop(
      audioContext.currentTime +
        0.12
    );

  } catch (_) {}
}


/* ==========================================================
   EFFECT TONE
   ========================================================== */

function effectTone() {

  if (!soundEnabled)
    return;

  initAudio();

  if (!audioContext)
    return;


  try {

    const oscillator =
      audioContext.createOscillator();

    const gain =
      audioContext.createGain();


    oscillator.type =
      "sawtooth";

    oscillator.frequency.value =
      240;


    gain.gain.setValueAtTime(
      0.0001,
      audioContext.currentTime
    );


    gain.gain.exponentialRampToValueAtTime(
      0.2,
      audioContext.currentTime +
        0.05
    );


    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime +
        0.75
    );


    oscillator.connect(gain);

    gain.connect(
      audioContext.destination
    );


    oscillator.start();

    oscillator.stop(
      audioContext.currentTime +
        0.8
    );

  } catch (_) {}
}


/* ==========================================================
   PLAY MP3
   ========================================================== */

function playClip(name) {

  if (
    !soundEnabled ||
    !audio[name]
  ) {

    return;
  }


  const clip =
    audio[name];


  try {

    clip.pause();

    clip.currentTime = 0;

    clip.muted = false;

    clip.volume = 1;


    const promise =
      clip.play();


    if (promise) {

      promise.catch(
        error => {

          console.warn(
            `[AUDIO] ${name} blocked:`,
            error
          );


          log(
            "AUDIO",
            `${name}.mp3 could not play`
          );
        }
      );
    }

  } catch (error) {

    console.warn(
      `[AUDIO] ${name}:`,
      error
    );
  }
}


/* ==========================================================
   STOP AUDIO
   ========================================================== */

function stopAudio() {

  Object.values(audio)
    .forEach(
      sound => {

        try {

          sound.pause();

          sound.currentTime = 0;

        } catch (_) {}
      }
    );
}


/* ==========================================================
   LOGGING
   ========================================================== */

function log(
  source,
  message
) {

  eventCount++;


  if (!el.missionLog)
    return;


  const row =
    document.createElement(
      "div"
    );


  row.textContent =
    `[${source}] ${message}`;


  el.missionLog.appendChild(
    row
  );


  el.missionLog.scrollTop =
    el.missionLog.scrollHeight;


  if (el.eventCount) {

    el.eventCount.textContent =
      `${eventCount} EVENTS`;
  }
}


/* ==========================================================
   CLOCK
   ========================================================== */

function updateClock() {

  if (!el.missionTime)
    return;


  const hours =
    Math.floor(
      missionSeconds /
        3600
    );


  const minutes =
    Math.floor(
      (
        missionSeconds %
        3600
      ) / 60
    );


  const seconds =
    missionSeconds %
    60;


  el.missionTime.textContent =
    `T+ ${String(hours).padStart(2,"0")}:` +
    `${String(minutes).padStart(2,"0")}:` +
    `${String(seconds).padStart(2,"0")}`;
}


/* ==========================================================
   TELEMETRY
   ========================================================== */

function updateTelemetry() {

  if (el.altitude)
    el.altitude.textContent =
      altitude.toFixed(1);


  if (el.velocity)
    el.velocity.textContent =
      velocity.toFixed(2);


  if (el.fuel)
    el.fuel.textContent =
      fuel.toFixed(1);


  if (el.temperature)
    el.temperature.textContent =
      temperature.toFixed(1);


  if (el.fuelPercent)
    el.fuelPercent.textContent =
      `${Math.max(
        0,
        fuel
      ).toFixed(0)}%`;


  if (el.fuelBar)
    el.fuelBar.style.width =
      `${Math.max(
        0,
        Math.min(
          100,
          fuel
        )
      )}%`;


  if (el.sceneAltitude)
    el.sceneAltitude.textContent =
      `ALT ${altitude.toFixed(1)} KM`;


  if (el.signal)
    el.signal.textContent =
      `${signal.toFixed(0)}%`;


  if (el.latency)
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


  updateGroundNetwork();

  updateSubsystems();
}


/* ==========================================================
   GROUND NETWORK
   ========================================================== */

function updateGroundNetwork() {

  const states = {

    IDLE:
      [
        "ONLINE",
        "STANDBY",
        "STANDBY"
      ],

    COUNTDOWN:
      [
        "LOCKED",
        "STANDBY",
        "STANDBY"
      ],

    IGNITION:
      [
        "LOCKED",
        "STANDBY",
        "STANDBY"
      ],

    LIFTOFF:
      [
        "TRACKING",
        "TRACKING",
        "STANDBY"
      ],

    ASCENT:
      [
        "TRACKING",
        "TRACKING",
        "STANDBY"
      ],

    ORBIT:
      [
        "PRIMARY",
        "ONLINE",
        "ONLINE"
      ],

    "SATELLITE DEPLOYED":
      [
        "PRIMARY",
        "ONLINE",
        "ONLINE"
      ],

    "MISSION SUCCESS":
      [
        "PRIMARY",
        "ONLINE",
        "ONLINE"
      ],

    ABORTED:
      [
        "HOLD",
        "STANDBY",
        "STANDBY"
      ]

  };


  const state =
    states[phase] ||
    states.IDLE;


  if (adv.groundPrimary)
    adv.groundPrimary.textContent =
      state[0];


  if (adv.groundBengaluru)
    adv.groundBengaluru.textContent =
      state[1];


  if (adv.groundPune)
    adv.groundPune.textContent =
      state[2];
}


/* ==========================================================
   SUBSYSTEMS
   ========================================================== */

function updateSubsystems() {

  if (el.subGuidance)
    el.subGuidance.textContent =
      running &&
      phase !== "ABORTED"
        ? "NOMINAL"
        : "STANDBY";


  if (el.subPropulsion)
    el.subPropulsion.textContent =
      fuel < 20
        ? "ATTENTION"
        : "NOMINAL";


  if (el.subThermal)
    el.subThermal.textContent =
      temperature > 80
        ? "ATTENTION"
        : "NOMINAL";


  if (el.subAvionics)
    el.subAvionics.textContent =
      "NOMINAL";


  if (el.subComms)
    el.subComms.textContent =
      signal < 80
        ? "ATTENTION"
        : "NOMINAL";
}


/* ==========================================================
   SCENE
   ========================================================== */

function updateScene() {

  if (
    el.vehicle
  ) {

    el.vehicle.className =
      `rocket ${phase}`;
  }


  if (
    el.vehicleState
  ) {

    el.vehicleState.textContent =
      phase
        .replaceAll(
          "-",
          " "
        );
  }


  if (
    el.vehicleReadout
  ) {

    el.vehicleReadout.textContent =
      phase === "IDLE"
        ? "VEHICLE READY"
        : phase;
  }


  if (
    el.guidance
  ) {

    el.guidance.textContent =
      phase === "IDLE"
        ? "STANDBY"
        : "NOMINAL";
  }


  if (
    el.orbitState
  ) {

    const orbital =
      phase === "ORBIT" ||
      phase ===
        "SATELLITE DEPLOYED" ||
      phase ===
        "MISSION SUCCESS";


    el.orbitState.textContent =
      orbital
        ? "ORBIT"
        : "GROUND";


    if (
      el.orbitalCraft
    ) {

      el.orbitalCraft.style.opacity =
        orbital
          ? "1"
          : "0";
    }
  }


  if (
    el.satellite
  ) {

    if (
      phase ===
        "SATELLITE DEPLOYED" ||
      phase ===
        "MISSION SUCCESS"
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


  if (el.flightStatus)
    el.flightStatus.textContent =
      labels[phase] ||
      phase;


  if (el.phase)
    el.phase.textContent =
      phase;
}


/* ==========================================================
   UPDATE EVERYTHING
   ========================================================== */

function updateAll() {

  updateClock();

  updateTelemetry();

  updateStatus();

  updateScene();

  updateV10Health();

  updateOrbitalData();
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


  v10Armed = false;
  v10Hold = false;
  v10Failure = false;

  v10MaxAltitude = 0;
  v10MaxVelocity = 0;
  v10MaxTemperature = 28;


  window.missionAscentAuthorized =
    false;

  window.missionAscentPermissionOpen =
    false;

  window.missionEmergencyActive =
    false;


  closeAscentPermission();


  if (el.missionLog)
    el.missionLog.innerHTML =
      "";


  if (el.eventCount)
    el.eventCount.textContent =
      "0 EVENTS";


  if (el.countdown)
    el.countdown.textContent =
      "T−10";


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

      <div class="mission-permission-backdrop"></div>

      <div class="mission-permission-card">

        <div class="mission-permission-alert">
          ASCENT AUTHORIZATION REQUIRED
        </div>

        <h2>
          🚀 Permission to Ascent
        </h2>

        <p>
          Vehicle is stable after liftoff.
          Operator authorization is required
          before ascent can continue.
        </p>

        <div class="mission-permission-readout">

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

        <div class="mission-permission-actions">

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


    const style =
      document.createElement(
        "style"
      );


    style.textContent = `

      #missionAscentPermission {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: grid;
        place-items: center;
      }

      .mission-permission-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,.78);
        backdrop-filter: blur(4px);
      }

      .mission-permission-card {
        position: relative;
        width: min(560px, calc(100vw - 32px));
        padding: 28px;
        border: 1px solid rgba(255,190,80,.7);
        background: #090d14;
        color: #eef4ff;
        box-shadow:
          0 0 50px rgba(255,150,40,.2);
      }

      .mission-permission-alert {
        color: #ffb454;
        font-size: 12px;
        letter-spacing: .18em;
      }

      .mission-permission-card h2 {
        margin: 10px 0;
        font-size: 28px;
      }

      .mission-permission-card p {
        color: #aeb9c9;
        line-height: 1.5;
      }

      .mission-permission-readout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        padding: 14px;
        margin: 20px 0;
        background: #0e1520;
      }

      .mission-permission-readout span {
        color: #728097;
        font-size: 10px;
      }

      .mission-permission-readout strong {
        text-align: right;
      }

      .mission-permission-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }

      .mission-permission-actions button {
        padding: 12px 18px;
        border: 0;
        font-weight: 700;
        cursor: pointer;
      }

      #missionAuthorizeAscent {
        background: #d9ff72;
        color: #071008;
      }

      #missionAbortFromPermission {
        background: #ff4d4d;
        color: white;
      }
    `;


    document.head.appendChild(
      style
    );


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
    ).catch(
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
   START MISSION
   ========================================================== */

async function startMission() {

  if (running)
    return;


  /*
    THIS IS THE IMPORTANT MP3 FIX.

    Because this function is called by the user's
    LAUNCH button click, the browser considers it
    a trusted user interaction and allows us to
    unlock audio playback.
  */

  await unlockMissionAudio();


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


  window.missionAscentAuthorized =
    false;

  window.missionAscentPermissionOpen =
    false;


  closeAscentPermission();


  if (el.countdown)
    el.countdown.textContent =
      "T−10";


  log(
    "FLIGHT",
    "Launch sequence initiated"
  );


  log(
    "COUNTDOWN",
    "T−10"
  );


  beep();


  if (
    typeof sendArduino ===
    "function"
  ) {

    sendArduino(
      "COUNTDOWN:10"
    ).catch(
      () => {}
    );
  }


  updateAll();


  timer =
    setInterval(
      tick,
      1000
    );
}


/* ==========================================================
   MAIN TICK
   ========================================================== */

function tick() {

  if (!running)
    return;


  if (v10Hold) {

    updateAll();

    return;
  }


  missionSeconds++;


  /* ========================================================
     COUNTDOWN
     ======================================================== */

  if (
    phase ===
    "COUNTDOWN"
  ) {

    countdown--;


    if (
      countdown >= 1
    ) {

      if (el.countdown)
        el.countdown.textContent =
          `T−${countdown}`;


      log(
        "COUNTDOWN",
        `T−${countdown}`
      );


      beep();


      if (
        typeof sendArduino ===
        "function"
      ) {

        sendArduino(
          `COUNTDOWN:${countdown}`
        ).catch(
          () => {}
        );
      }

    } else {

      if (el.countdown)
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
        ).catch(
          () => {}
        );
      }
    }
  }


  /* ========================================================
     IGNITION
     ======================================================== */

  else if (
    phase ===
    "IGNITION"
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
      ).catch(
        () => {}
      );
    }


    requestAscentPermission();
  }


  /* ========================================================
     LIFTOFF
     ======================================================== */

  else if (
    phase ===
    "LIFTOFF"
  ) {

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
      ).catch(
        () => {}
      );
    }
  }


  /* ========================================================
     ASCENT
     ======================================================== */

  else if (
    phase ===
    "ASCENT"
  ) {

    /*
      NORMAL ASCENT TELEMETRY.

      NO TURBULENCE FEATURE.
      NO TRIPLE-PRESS LOGIC.
    */


    altitude +=
      14 +
      Math.random() * 6;


    velocity +=
      0.4 +
      Math.random() * 0.2;


    fuel =
      Math.max(
        0,
        fuel -
          (
            1.2 +
            Math.random() * 0.4
          )
      );


    temperature +=
      (
        Math.random() -
        0.25
      ) * 2;


    signal =
      Math.max(
        78,
        100 -
          altitude * 0.04
      );


    latency =
      38 +
      altitude * 0.04;


    gLoad =
      1.7 +
      Math.random() * 1.4;


    pressure =
      Math.max(
        18,
        101.3 -
          altitude * 0.78
      );


    roll =
      (
        Math.random() -
        0.5
      ) * 0.5;


    pitch =
      (
        Math.random() -
        0.5
      ) * 2;


    yaw =
      (
        Math.random() -
        0.5
      ) * 0.7;


    battery =
      Math.max(
        88,
        battery -
          0.05
      );


    busVoltage =
      27.5 +
      Math.random() * 0.8;


    thrust =
      95 +
      Math.random() * 5;


    fuelFlow =
      70 +
      Math.random() * 18;


    packetLoss =
      Math.max(
        0.01,
        (
          100 -
          signal
        ) * 0.01
      );


    dataRate =
      2 +
      Math.random() * 3;


    if (
      altitude >=
      110
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
        ).catch(
          () => {}
        );
      }
    }
  }


  /* ========================================================
     ORBIT
     ======================================================== */

  else if (
    phase ===
    "ORBIT"
  ) {

    orbitSeconds++;


    altitude +=
      (
        Math.random() -
        0.5
      ) * 1.2;


    velocity +=
      (
        Math.random() -
        0.5
      ) * 0.03;


    fuel =
      Math.max(
        0,
        fuel -
          0.12
      );


    temperature +=
      (
        Math.random() -
        0.5
      ) * 0.4;


    signal =
      94 +
      Math.random() * 5;


    latency =
      48 +
      Math.random() * 10;


    gLoad =
      0.98 +
      Math.random() * 0.08;


    pressure =
      18 +
      Math.random() * 2;


    roll =
      (
        Math.random() -
        0.5
      ) * 0.08;


    pitch =
      (
        Math.random() -
        0.5
      ) * 0.1;


    yaw =
      (
        Math.random() -
        0.5
      ) * 0.08;


    battery =
      Math.max(
        80,
        battery -
          0.02
      );


    busVoltage =
      27.8 +
      Math.random() * 0.5;


    thrust =
      2 +
      Math.random() * 2;


    fuelFlow =
      1 +
      Math.random() * 0.8;


    packetLoss =
      0.01 +
      Math.random() * 0.04;


    dataRate =
      4 +
      Math.random() * 5;


    log(
      "ORBIT",
      `Orbital operations T+${orbitSeconds}s`
    );


    if (
      orbitSeconds >=
      5
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
    ).catch(
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
        ).catch(
          () => {}
        );
      }


      updateAll();


      setTimeout(
        () => {

          playClip(
            "song"
          );

        },
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
  reason =
    "MISSION_ABORT"
) {

  running =
    false;


  clearInterval(
    timer
  );


  timer =
    null;


  window.missionAscentAuthorized =
    false;


  window.missionEmergencyActive =
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
    ).catch(
      () => {}
    );
  }


  updateAll();
}


/* ==========================================================
   ARDUINO EMERGENCY HOOK
   ========================================================== */

function abortFromEmergency(
  source = ""
) {

  log(
    "SAFETY",
    `Arduino emergency abort${
      source
        ? `: ${source}`
        : ""
    }`
  );


  abortMission(
    "ARDUINO_EMERGENCY"
  );
}


window.abortFromEmergency =
  abortFromEmergency;


/* ==========================================================
   ARDUINO SAFETY EVENTS
   ========================================================== */

function handleSafetyArduinoEvent(
  line
) {

  if (!line)
    return;


  const upper =
    line.toUpperCase();


  log(
    "ARDUINO",
    line
  );


  if (
    upper.includes(
      "EMERGENCY"
    )
  ) {

    window.missionEmergencyActive =
      true;


    log(
      "SAFETY",
      "🚨 PHYSICAL EMERGENCY ACTIVE"
    );


    return;
  }


  if (
    upper.includes(
      "ABORT"
    )
  ) {

    abortFromEmergency(
      line
    );


    return;
  }
}


window.handleSafetyArduinoEvent =
  handleSafetyArduinoEvent;


/* ==========================================================
   V10 HEALTH
   ========================================================== */

function updateV10Health() {

  let health =
    100;


  if (v10Failure)
    health -= 35;


  if (
    temperature > 80
  )
    health -= 15;


  if (
    signal < 80
  )
    health -= 8;


  if (
    fuel < 20
  )
    health -= 8;


  if (
    battery < 90
  )
    health -= 5;


  health =
    Math.max(
      0,
      Math.min(
        100,
        health
      )
    );


  const element =
    document.getElementById(
      "missionHealth"
    );


  if (element) {

    element.textContent =
      `${health.toFixed(0)}%`;
  }
}


/* ==========================================================
   ORBITAL DATA
   ========================================================== */

function updateOrbitalData() {

  const alt =
    Number(
      altitude || 0
    );


  const apogee =
    Math.max(
      0,
      alt + 2
    );


  const perigee =
    Math.max(
      0,
      alt - 2
    );


  v10GroundTrackAngle +=
    0.015;


  const latitude =
    Math.sin(
      v10GroundTrackAngle
    ) * 80;


  const longitude =
    (
      (
        v10GroundTrackAngle *
        180 /
        Math.PI
      ) +
      180
    ) % 360 - 180;


  const values = {

    apogee:
      `${apogee.toFixed(0)} KM`,

    perigee:
      `${perigee.toFixed(0)} KM`,

    latitude:
      `${latitude.toFixed(1)}°`,

    longitude:
      `${longitude.toFixed(1)}°`
  };


  Object.entries(
    values
  ).forEach(
    ([id,value]) => {

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
}


/* ==========================================================
   V10 ARCHIVE
   ========================================================== */

function saveMissionArchive() {

  const record = {

    timestamp:
      new Date().toISOString(),

    status:
      phase,

    duration:
      missionSeconds,

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

  } catch (_) {}


  renderMissionArchive();
}


function renderMissionArchive() {

  const list =
    document.getElementById(
      "archiveList"
    );


  if (!list)
    return;


  list.innerHTML =
    v10Archive
      .map(
        (
          record,
          index
        ) =>
          `
          <div class="archive-card">

            SIM-${String(
              index + 1
            ).padStart(
              3,
              "0"
            )}

            • ${record.status}

            • ALT ${
              record.maxAltitude
            } KM

            • ${
              record.timestamp
                .slice(
                  0,
                  19
                )
                .replace(
                  "T",
                  " "
                )
            }

          </div>
          `
      )
      .join("");
}


function loadMissionArchive() {

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


  renderMissionArchive();
}


/* ==========================================================
   V10 CONSOLE
   ========================================================== */

function v10Console(
  command
) {

  const cmd =
    String(
      command || ""
    )
    .trim()
    .toUpperCase();


  if (!cmd)
    return;


  log(
    "CMD",
    `> ${cmd}`
  );


  if (
    cmd ===
    "ARM"
  ) {

    v10Armed =
      true;


    log(
      "OPERATOR",
      "Launch system armed"
    );


    if (
      typeof sendArduino ===
      "function"
    ) {

      sendArduino(
        "READY"
      );
    }


  } else if (
    cmd ===
    "LAUNCH"
  ) {

    startMission();


  } else if (
    cmd ===
    "HOLD"
  ) {

    v10Hold =
      true;


    log(
      "OPERATOR",
      "Mission hold requested"
    );


  } else if (
    cmd ===
    "RESUME"
  ) {

    v10Hold =
      false;


    log(
      "OPERATOR",
      "Mission resumed"
    );


  } else if (
    cmd ===
    "ABORT"
  ) {

    abortMission(
      "CONSOLE"
    );


  } else if (
    cmd ===
    "RESET"
  ) {

    resetMission();


  } else if (
    cmd ===
    "FAILURE"
  ) {

    v10Failure =
      true;


    updateV10Health();


    log(
      "WARNING",
      "Simulated failure injected"
    );


  } else if (
    cmd ===
    "STATUS"
  ) {

    log(
      "STATUS",
      `PHASE=${phase} ALT=${altitude.toFixed(1)}KM FUEL=${fuel.toFixed(1)}%`
    );


  } else if (
    cmd ===
    "SAVE"
  ) {

    saveMissionArchive();


  } else if (
    cmd ===
    "HELP"
  ) {

    log(
      "CMD",
      "ARM LAUNCH HOLD RESUME ABORT RESET FAILURE STATUS SAVE"
    );


  } else {

    log(
      "CMD",
      "UNKNOWN COMMAND"
    );
  }
}


/* ==========================================================
   V10 BINDINGS
   ========================================================== */

function bindV10Controls() {

  document
    .getElementById(
      "armButton"
    )
    ?.addEventListener(
      "click",
      () => {

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


        if (
          typeof sendArduino ===
          "function"
        ) {

          sendArduino(
            "READY"
          );
        }


        log(
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


        log(
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


        log(
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


        updateV10Health();


        log(
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
      event => {

        if (
          event.key ===
          "Enter"
        ) {

          v10Console(
            event.target.value
          );


          event.target.value =
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
      saveMissionArchive
    );
}


/* ==========================================================
   MAIN BUTTONS
   ========================================================== */

document
  .getElementById(
    "launchButton"
  )
  ?.addEventListener(
    "click",
    startMission
  );


document
  .getElementById(
    "abortButton"
  )
  ?.addEventListener(
    "click",
    () =>
      abortMission(
        "WEB_BUTTON"
      )
  );


document
  .getElementById(
    "fullscreenButton"
  )
  ?.addEventListener(
    "click",
    () => {

      try {

        if (
          !document.fullscreenElement
        ) {

          document.documentElement
            .requestFullscreen();

        } else {

          document.exitFullscreen();
        }

      } catch (_) {}
    }
  );


/* ==========================================================
   ARDUINO CONNECTION PANEL
   ========================================================== */

async function connectArduinoPanel() {

  if (
    typeof connectArduino !==
    "function"
  ) {

    log(
      "HARDWARE",
      "Arduino module not loaded"
    );


    return false;
  }


  const connected =
    await connectArduino();


  if (connected) {

    log(
      "HARDWARE",
      "Arduino UNO connected"
    );

  } else {

    log(
      "HARDWARE",
      "Arduino connection failed"
    );
  }


  return connected;
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

      if (
        typeof sendArduino !==
        "function"
      )
        return;


      const ok =
        await sendArduino(
          "READY"
        );


      if (ok) {

        if (
          document.getElementById(
            "ledStatus"
          )
        ) {

          document.getElementById(
            "ledStatus"
          ).textContent =
            "READY";
        }


        if (
          document.getElementById(
            "buzzerStatus"
          )
        ) {

          document.getElementById(
            "buzzerStatus"
          ).textContent =
            "STANDBY";
        }
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

      if (
        typeof sendArduino ===
        "function"
      ) {

        await sendArduino(
          "ABORT"
        );
      }


      abortMission(
        "HARDWARE_BUTTON"
      );
    }
  );


/* ==========================================================
   EXTERNAL GLOBAL HOOKS
   ========================================================== */

window.startMission =
  startMission;

window.abortMission =
  abortMission;

window.resetMission =
  resetMission;

window.authorizeAscent =
  authorizeAscent;

window.requestAscentPermission =
  requestAscentPermission;

window.handleSafetyArduinoEvent =
  handleSafetyArduinoEvent;

window.abortFromEmergency =
  abortFromEmergency;

window.v10Console =
  v10Console;


/* ==========================================================
   INITIALIZATION
   ========================================================== */

loadMissionArchive();

bindV10Controls();

resetMission();
