"use strict";

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
let audioContext = null;
let soundEnabled = true;
let eventCount = 0;

const audio = {
  ignition: new Audio("/static/assets/ignition.mp3"),
  liftoff: new Audio("/static/assets/liftoff.mp3"),
  orbit: new Audio("/static/assets/orbit_confirmed.mp3"),
  deployment: new Audio("/static/assets/satellite_deployed.mp3"),
  success: new Audio("/static/assets/mission_accomplished.mp3"),
  song: new Audio("/static/assets/maa_tujhe_salaam.mp3")
};
Object.values(audio).forEach(a => { a.preload = "auto"; a.volume = 1; });

const $ = id => document.getElementById(id);
const el = {
  missionTime: $("missionTime"), altitude: $("altitude"), velocity: $("velocity"), fuel: $("fuel"),
  temperature: $("temperature"), fuelPercent: $("fuelPercent"), fuelBar: $("fuelBar"),
  countdown: $("countdown"), flightStatus: $("flightStatus"), phase: $("phase"), phaseTop: null,
  vehicle: $("rocket"), vehicleState: $("vehicleState"), vehicleReadout: $("vehicleReadout"),
  sceneAltitude: $("sceneAltitude"), sceneCaption: $("vehicleReadout"), guidance: $("guidance"),
  orbitState: $("orbitState"), orbitalCraft: $("orbitalCraft"), satellite: $("satellite"),
  linkState: $("linkState"), signal: $("signal"), latency: $("latency"), missionLog: $("missionLog"),
  eventCount: $("eventCount"), fuelBar: $("fuelBar"), fuelPercent: $("fuelPercent"),
  subGuidance: $("subGuidance"), subPropulsion: $("subPropulsion"), subThermal: $("subThermal"),
  subAvionics: $("subAvionics"), subComms: $("subComms")
};

const adv = {
  gLoad: $("gLoad"), pressure: $("pressure"), roll: $("roll"), pitch: $("pitch"), yaw: $("yaw"),
  battery: $("battery"), busVoltage: $("busVoltage"), thrust: $("thrust"), fuelFlow: $("fuelFlow"),
  groundSignal: $("groundSignal"), groundLatency: $("groundLatency"), groundLoss: $("groundLoss"),
  groundPrimary: $("groundPrimary"), groundBengaluru: $("groundBengaluru"), groundPune: $("groundPune"), phase1State: $("phase1State")
};

function initAudio() {
  if (!soundEnabled) return;
  try {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();
  } catch (_) {}
}
function beep() {
  if (!soundEnabled) return;
  initAudio();
  if (!audioContext) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = "square";
  osc.frequency.value = 950;
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.15, audioContext.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.11);
  osc.connect(gain); gain.connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime + 0.12);
}
function effectTone() {
  if (!soundEnabled) return;
  initAudio();
  if (!audioContext) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = "sawtooth"; osc.frequency.value = 240;
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.22, audioContext.currentTime + .05);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + .75);
  osc.connect(gain); gain.connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime + .8);
}
function playClip(name) {
  if (!soundEnabled || !audio[name]) return;
  const clip = audio[name];
  try { clip.pause(); clip.currentTime = 0; const p = clip.play(); if (p?.catch) p.catch(() => log("AUDIO", `${name}.mp3 playback blocked`)); } catch (_) {}
}
function stopAudio() { Object.values(audio).forEach(a => { try { a.pause(); a.currentTime = 0; } catch (_) {} }); }
function log(source, message) {
  eventCount += 1;
  const row = document.createElement("div");
  row.textContent = `[${source}] ${message}`;
  el.missionLog.appendChild(row);
  el.missionLog.scrollTop = el.missionLog.scrollHeight;
  el.eventCount.textContent = `${eventCount} EVENTS`;
}
function updateClock() {
  const h = Math.floor(missionSeconds / 3600);
  const m = Math.floor((missionSeconds % 3600) / 60);
  const s = missionSeconds % 60;
  el.missionTime.textContent = `T+ ${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
function updateTelemetry() {
  el.altitude.textContent = altitude.toFixed(1);
  el.velocity.textContent = velocity.toFixed(2);
  el.fuel.textContent = fuel.toFixed(1);
  el.temperature.textContent = temperature.toFixed(1);
  el.fuelPercent.textContent = `${Math.max(0, fuel).toFixed(0)}%`;
  el.fuelBar.style.width = `${Math.max(0, Math.min(100, fuel))}%`;
  el.sceneAltitude.textContent = `ALT ${altitude.toFixed(1)} KM`;
  el.signal.textContent = `${signal.toFixed(0)}%`;
  el.latency.textContent = `${latency.toFixed(0)} MS`;
  if (adv.gLoad) adv.gLoad.textContent = `${gLoad.toFixed(2)} G`;
  if (adv.pressure) adv.pressure.textContent = `${pressure.toFixed(1)} KPA`;
  if (adv.roll) adv.roll.textContent = `${roll.toFixed(2)}°`;
  if (adv.pitch) adv.pitch.textContent = `${pitch.toFixed(2)}°`;
  if (adv.yaw) adv.yaw.textContent = `${yaw.toFixed(2)}°`;
  if (adv.battery) adv.battery.textContent = `${battery.toFixed(0)}%`;
  if (adv.busVoltage) adv.busVoltage.textContent = `${busVoltage.toFixed(1)} V`;
  if (adv.thrust) adv.thrust.textContent = `${thrust.toFixed(0)}%`;
  if (adv.fuelFlow) adv.fuelFlow.textContent = `${fuelFlow.toFixed(1)} KG/S`;
  if (adv.groundSignal) adv.groundSignal.textContent = `${signal.toFixed(0)}%`;
  if (adv.groundLatency) adv.groundLatency.textContent = `${latency.toFixed(0)} MS`;
  if (adv.groundLoss) adv.groundLoss.textContent = `${packetLoss.toFixed(2)}%`;
  if (adv.phase1State) adv.phase1State.textContent = running ? "LIVE" : (phase === "ABORTED" ? "ABORTED" : "STANDBY");
  updateGroundNetwork();
  setSubsystems();
}

function updateGroundNetwork() {
  if (!adv.groundPrimary) return;
  const state = {
    IDLE: ["ONLINE", "STANDBY", "STANDBY"],
    COUNTDOWN: ["LOCKED", "STANDBY", "STANDBY"],
    IGNITION: ["LOCKED", "STANDBY", "STANDBY"],
    LIFTOFF: ["TRACKING", "TRACKING", "STANDBY"],
    ASCENT: ["TRACKING", "TRACKING", "STANDBY"],
    ORBIT: ["PRIMARY", "ONLINE", "ONLINE"],
    "SATELLITE DEPLOYED": ["PRIMARY", "ONLINE", "ONLINE"],
    "MISSION SUCCESS": ["PRIMARY", "ONLINE", "ONLINE"],
    ABORTED: ["HOLD", "STANDBY", "STANDBY"]
  }[phase] || ["ONLINE", "STANDBY", "STANDBY"];
  adv.groundPrimary.textContent = state[0];
  adv.groundBengaluru.textContent = state[1];
  adv.groundPune.textContent = state[2];
}

function setSubsystems() {
  el.subGuidance.textContent = running && phase !== "ABORTED" ? "NOMINAL" : "STANDBY";
  el.subPropulsion.textContent = fuel < 20 ? "ATTENTION" : "NOMINAL";
  el.subThermal.textContent = temperature > 80 ? "ATTENTION" : "NOMINAL";
  el.subAvionics.textContent = "NOMINAL";
  el.subComms.textContent = signal < 80 ? "ATTENTION" : "NOMINAL";
}
function updateScene() {
  const stateClass = phase === "IDLE" ? "PRE-LAUNCH" : phase;
  el.vehicle.className = `rocket ${phase}`;
  el.vehicleState.textContent = stateClass.replaceAll("-", " ");
  el.vehicleReadout.textContent = phase === "IDLE" ? "VEHICLE READY" : stateClass;
  el.guidance.textContent = phase === "IDLE" ? "STANDBY" : "NOMINAL";
  if (phase === "ORBIT" || phase === "SATELLITE DEPLOYED" || phase === "MISSION SUCCESS") {
    el.orbitState.textContent = "ORBIT";
    el.orbitalCraft.style.opacity = "1";
  } else {
    el.orbitState.textContent = "GROUND";
    el.orbitalCraft.style.opacity = "0";
  }
  if (phase === "SATELLITE DEPLOYED" || phase === "MISSION SUCCESS") el.satellite.classList.add("deployed");
  else el.satellite.classList.remove("deployed");
}
function updateStatus() {
  const labels = {
    IDLE: "READY FOR LAUNCH", COUNTDOWN: "COUNTDOWN INITIATED", IGNITION: "ENGINE IGNITION",
    LIFTOFF: "LIFTOFF CONFIRMED", ASCENT: "ASCENT NOMINAL", ORBIT: "ORBIT INSERTION",
    "SATELLITE DEPLOYED": "SATELLITE DEPLOYED", "MISSION SUCCESS": "MISSION SUCCESS", ABORTED: "MISSION ABORTED"
  };
  el.flightStatus.textContent = labels[phase] || phase;
  el.phase.textContent = phase === "SATELLITE DEPLOYED" ? "DEPLOYMENT" : phase === "MISSION SUCCESS" ? "MISSION COMPLETE" : phase;
}
function updateAll() { updateClock(); updateTelemetry(); updateStatus(); updateScene(); }
function resetMission() {
  running = false; clearInterval(timer); stopAudio(); phase="IDLE"; countdown=10; altitude=0; velocity=0; fuel=100; temperature=28; signal=100; latency=38; packetLoss=.01; gLoad=1; pressure=101.3; roll=0; pitch=0; yaw=0; battery=100; busVoltage=28; thrust=0; fuelFlow=0; dataRate=0; orbitSeconds=0; missionSeconds=0; eventCount=0;
  el.missionLog.innerHTML = ""; el.eventCount.textContent = "0 EVENTS"; el.countdown.textContent = "T−10";
  updateAll(); log("SYSTEM","Mission control initialized"); log("SYSTEM","Telemetry link established"); log("SYSTEM","Launch vehicle awaiting command");
}
function startMission() {
  if (running) return;
  initAudio(); stopAudio(); running=true; phase="COUNTDOWN"; countdown=10; missionSeconds=0; orbitSeconds=0; altitude=0; velocity=0; fuel=100; temperature=28; signal=100; latency=38; el.countdown.textContent="T−10";
  log("FLIGHT","Launch sequence initiated"); log("COUNTDOWN","T−10"); beep(); updateAll();
  clearInterval(timer); timer=setInterval(tick,1000);
}
function tick() {
  if (!running) return;
  missionSeconds++;
  if (phase === "COUNTDOWN") {
    countdown--;
    if (countdown >= 1) { el.countdown.textContent=`T−${countdown}`; log("COUNTDOWN",`T−${countdown}`); beep(); }
    else { el.countdown.textContent="T−0"; phase="IGNITION"; effectTone(); playClip("ignition"); log("ENGINE","Main engine ignition"); }
  } else if (phase === "IGNITION") {
    phase="LIFTOFF"; playClip("liftoff"); log("FLIGHT","Vehicle clear of launch tower");
  } else if (phase === "LIFTOFF") {
    phase="ASCENT"; log("FLIGHT","Ascent initiated");
  } else if (phase === "ASCENT") {
    altitude += 14 + Math.random()*6; velocity += .4 + Math.random()*.2; fuel -= 1.2 + Math.random()*.4; temperature += (Math.random()-.25)*2; signal=Math.max(78,100-altitude*.04); latency=38+altitude*.04; gLoad=1.7+Math.random()*1.4; pressure=Math.max(18,101.3-altitude*.78); roll=(Math.random()-.5)*.5; pitch=(Math.random()-.5)*2; yaw=(Math.random()-.5)*.7; battery=Math.max(88,battery-.05); busVoltage=27.5+Math.random()*.8; thrust=95+Math.random()*5; fuelFlow=70+Math.random()*18; packetLoss=Math.max(.01,(100-signal)*.01); dataRate=2+Math.random()*3;
    if (altitude >= 110) { phase="ORBIT"; orbitSeconds=0; playClip("orbit"); log("FLIGHT","Stable orbital trajectory achieved"); }
  } else if (phase === "ORBIT") {
    orbitSeconds++; altitude+=(Math.random()-.5)*1.2; velocity+=(Math.random()-.5)*.03; fuel-=.12; temperature+=(Math.random()-.5)*.4; signal=94+Math.random()*5; latency=48+Math.random()*10; gLoad=.98+Math.random()*.08; pressure=18+Math.random()*2; roll=(Math.random()-.5)*.08; pitch=(Math.random()-.5)*.1; yaw=(Math.random()-.5)*.08; battery=Math.max(80,battery-.02); busVoltage=27.8+Math.random()*.5; thrust=2+Math.random()*2; fuelFlow=1+Math.random()*.8; packetLoss=.01+Math.random()*.04; dataRate=4+Math.random()*5; log("ORBIT",`Orbital operations T+${orbitSeconds}s`); if (orbitSeconds>=5) deploySatellite();
  }
  updateAll();
}
function deploySatellite() {
  running=false; clearInterval(timer); phase="SATELLITE DEPLOYED"; playClip("deployment"); log("MISSION","Satellite deployment successful"); updateAll();
  setTimeout(() => { phase="MISSION SUCCESS"; playClip("success"); log("SUCCESS","Mission accomplished"); updateAll(); setTimeout(() => playClip("song"),3500); },3000);
}
function abortMission() { if(!running)return; running=false; clearInterval(timer); phase="ABORTED"; stopAudio(); log("WARNING","Mission abort command received"); updateAll(); }
$("launchButton").addEventListener("click", startMission);
$("abortButton").addEventListener("click", abortMission);
$("fullscreenButton").addEventListener("click", () => { if(!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); });
resetMission();


/* ==========================================================
   V10 FEATURE LAYER
   Phases included: 1,2,3,4,5,7,8,9,10
   Phase 6 intentionally excluded.
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

const V10_PHASES = [
    "PRE-LAUNCH","SYSTEM CHECK","COUNTDOWN","IGNITION","LIFTOFF",
    "MAX-Q","BOOSTER EVENT","ASCENT","ORBIT INSERTION",
    "ORBIT STABILIZATION","PAYLOAD DEPLOYMENT","PAYLOAD CHECK",
    "MISSION SUCCESS"
];

function v10Log(source, text) {
    if (typeof logEvent === "function") logEvent(source, text);
    const h = document.getElementById("consoleHistory");
    if (h) {
        const row = document.createElement("div");
        row.textContent = `[${source}] ${text}`;
        h.appendChild(row);
        h.scrollTop = h.scrollHeight;
    }
}

function v10SetPhase(newPhase) {
    phase = newPhase;
    if (typeof updateAll === "function") updateAll();
    if (document.getElementById("eventState")) document.getElementById("eventState").textContent = newPhase;
}

function v10RecalcHealth() {
    let health = 100;
    if (v10Failure) health -= 35;
    if (typeof temperature !== "undefined" && temperature > 80) health -= 15;
    if (typeof signal !== "undefined" && signal < 80) health -= 8;
    if (typeof fuel !== "undefined" && fuel < 20) health -= 8;
    if (typeof battery !== "undefined" && battery < 90) health -= 5;
    health = Math.max(0, Math.min(100, health));
    const hs = document.getElementById("missionHealth");
    if (hs) hs.textContent = `${health.toFixed(0)}%`;
}

function v10UpdateOrbitalData() {
    const alt = Number(typeof altitude === "number" ? altitude : 0);
    const apo = Math.max(0, alt + 2);
    const peri = Math.max(0, alt - 2);
    const lat = ((Math.sin(v10GroundTrackAngle) * 80));
    const lon = (((v10GroundTrackAngle * 180 / Math.PI) + 180) % 360) - 180;

    const pairs = {
        apogee: `${apo.toFixed(0)} KM`,
        perigee: `${peri.toFixed(0)} KM`,
        inclination: `${(28.5 + ((typeof pitch === "number" ? pitch : 0) * 0.05)).toFixed(1)}°`,
        orbitPeriod: alt > 0 ? `${Math.max(1.5, Math.sqrt(Math.max(1, alt)) * 1.6).toFixed(1)} MIN` : "--",
        latitude: `${lat.toFixed(1)}°`,
        longitude: `${lon.toFixed(1)}°`
    };

    Object.entries(pairs).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });

    const track = document.getElementById("groundTrack");
    if (track && (phase.includes("ORBIT") || phase === "PAYLOAD DEPLOYMENT" || phase === "PAYLOAD CHECK" || phase === "MISSION SUCCESS")) {
        track.classList.add("active");
    }
}

function v10UpdateRecorder() {
    v10MaxAltitude = Math.max(v10MaxAltitude, Number(altitude || 0));
    v10MaxVelocity = Math.max(v10MaxVelocity, Number(velocity || 0));
    v10MaxTemperature = Math.max(v10MaxTemperature, Number(temperature || 0));

    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    set("maxAltitude", `${v10MaxAltitude.toFixed(1)} KM`);
    set("maxVelocity", `${v10MaxVelocity.toFixed(2)} KM/S`);
    set("maxTemperature", `${v10MaxTemperature.toFixed(1)} °C`);
    set("finalStatus", phase);
}

function v10ArchiveLoad() {
    try {
        v10Archive = JSON.parse(localStorage.getItem("missionArchiveV10") || "[]");
    } catch {
        v10Archive = [];
    }
    v10RenderArchive();
}

function v10ArchiveSave() {
    const record = {
        timestamp: new Date().toISOString(),
        status: phase,
        duration: typeof missionSeconds === "number" ? missionSeconds : 0,
        maxAltitude: Number(v10MaxAltitude.toFixed(2)),
        maxVelocity: Number(v10MaxVelocity.toFixed(3)),
        maxTemperature: Number(v10MaxTemperature.toFixed(1))
    };
    v10Archive.unshift(record);
    v10Archive = v10Archive.slice(0, 25);
    try {
        localStorage.setItem("missionArchiveV10", JSON.stringify(v10Archive));
    } catch {}
    v10RenderArchive();
}

function v10RenderArchive() {
    const list = document.getElementById("archiveList");
    if (!list) return;
    list.innerHTML = v10Archive.map((r, i) =>
        `<div class="archive-card">SIM-${String(i + 1).padStart(3,"0")} • ${r.status} • ALT ${r.maxAltitude} KM • ${r.timestamp.slice(0,19).replace("T"," ")}</div>`
    ).join("");
}

function v10Replay() {
    if (v10ReplayTimer) return;
    const labels = window.chartLabels || [];
    const altData = window.altitudeData || [];
    const velData = window.velocityData || [];
    const fuelData = window.fuelData || [];
    if (!labels.length) {
        v10Log("REPLAY", "No recorded telemetry in current session");
        return;
    }

    let i = 0;
    v10Log("REPLAY", "Mission replay started");

    v10ReplayTimer = setInterval(() => {
        if (i >= labels.length) {
            clearInterval(v10ReplayTimer);
            v10ReplayTimer = null;
            v10Log("REPLAY", "Mission replay complete");
            return;
        }
        const match = String(labels[i]).match(/(\d+)/);
        const t = match ? match[1] : "0";
        const c = document.getElementById("countdown");
        if (c) c.textContent = `T+${t}`;
        if (document.getElementById("altitude") && altData[i] != null) document.getElementById("altitude").textContent = Number(altData[i]).toFixed(1);
        if (document.getElementById("velocity") && velData[i] != null) document.getElementById("velocity").textContent = Number(velData[i]).toFixed(2);
        if (document.getElementById("fuel") && fuelData[i] != null) document.getElementById("fuel").textContent = Number(fuelData[i]).toFixed(1);
        i++;
    }, 300);
}

async function v10SaveToServer() {
    const payload = {
        timestamp: new Date().toISOString(),
        status: phase,
        duration: typeof missionSeconds === "number" ? missionSeconds : 0,
        maxAltitude: Number(v10MaxAltitude.toFixed(2)),
        maxVelocity: Number(v10MaxVelocity.toFixed(3)),
        maxTemperature: Number(v10MaxTemperature.toFixed(1))
    };
    try {
        const response = await fetch("/api/missions", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(payload)
        });
        if (response.ok) v10Log("ARCHIVE", "Mission saved to server archive");
        else v10Log("ARCHIVE", "Server archive rejected the record");
    } catch {
        v10Log("ARCHIVE", "Server archive unavailable; local archive retained");
    }
}

function v10Console(command) {
    const cmd = command.trim().toUpperCase();
    if (!cmd) return;

    v10Log("CMD", `> ${cmd}`);

    const send = async (c) => {
        if (typeof sendArduino === "function") await sendArduino(c);
    };

    if (cmd === "HELP") {
        v10Log("CMD", "ARM  LAUNCH  HOLD  RESUME  ABORT  RESET  FAILURE  STATUS  REPLAY");
    } else if (cmd === "ARM") {
        v10Armed = true;
        v10Log("OPERATOR", "Launch system armed");
        send("READY");
    } else if (cmd === "LAUNCH") {
        if (typeof startMission === "function") startMission();
    } else if (cmd === "HOLD") {
        v10Hold = true;
        if (typeof onHold !== "undefined") onHold = true;
        v10Log("OPERATOR", "Mission hold requested");
    } else if (cmd === "RESUME") {
        v10Hold = false;
        if (typeof onHold !== "undefined") onHold = false;
        v10Log("OPERATOR", "Mission resumed");
    } else if (cmd === "ABORT") {
        if (typeof abortMission === "function") abortMission();
    } else if (cmd === "RESET") {
        if (typeof resetMission === "function") resetMission();
    } else if (cmd === "FAILURE") {
        v10Failure = true;
        v10RecalcHealth();
        const msg = document.getElementById("failureMessage");
        if (msg) msg.textContent = "SIMULATED FAILURE ACTIVE";
        v10Log("WARNING", "Simulated failure injected");
    } else if (cmd === "STATUS") {
        v10Log("STATUS", `PHASE=${phase} ALT=${Number(altitude || 0).toFixed(1)}KM FUEL=${Number(fuel || 0).toFixed(1)}%`);
    } else if (cmd === "REPLAY") {
        v10Replay();
    } else {
        v10Log("CMD", "UNKNOWN COMMAND");
    }
}

function v10Bind() {
    document.getElementById("armButton")?.addEventListener("click", async () => {
        v10Armed = true;
        document.getElementById("operatorState").textContent = "ARMED";
        await (typeof sendArduino === "function" ? sendArduino("READY") : Promise.resolve());
        v10Log("OPERATOR", "Launch system armed");
    });

    document.getElementById("holdButton")?.addEventListener("click", () => {
        v10Hold = true;
        if (typeof onHold !== "undefined") onHold = true;
        v10Log("OPERATOR", "Mission hold");
    });

    document.getElementById("resumeButton")?.addEventListener("click", () => {
        v10Hold = false;
        if (typeof onHold !== "undefined") onHold = false;
        v10Log("OPERATOR", "Mission resumed");
    });

    document.getElementById("failureButton")?.addEventListener("click", () => {
        v10Failure = true;
        const msg = document.getElementById("failureMessage");
        if (msg) msg.textContent = "SIMULATED FAILURE ACTIVE";
        v10RecalcHealth();
        v10Log("WARNING", "Simulated failure injected");
    });

    document.getElementById("consoleSend")?.addEventListener("click", () => {
        const input = document.getElementById("consoleInput");
        v10Console(input?.value || "");
        if (input) input.value = "";
    });

    document.getElementById("consoleInput")?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const input = e.target;
            v10Console(input.value);
            input.value = "";
        }
    });

    document.getElementById("saveMissionButton")?.addEventListener("click", () => {
        v10ArchiveSave();
        v10SaveToServer();
    });

    document.getElementById("replayButton")?.addEventListener("click", v10Replay);

    document.getElementById("modeButton")?.addEventListener("click", () => {
        document.body.classList.toggle("exhibition");
    });
}

/* Keep this feature layer additive and non-destructive. */
const oldUpdateTelemetry = window.updateTelemetry;
window.updateTelemetry = function () {
    if (typeof oldUpdateTelemetry === "function") oldUpdateTelemetry();
    v10UpdateOrbitalData();
    v10UpdateRecorder();
    v10RecalcHealth();
};

const oldUpdateAll = window.updateAll;
window.updateAll = function () {
    if (typeof oldUpdateAll === "function") oldUpdateAll();
    v10UpdateOrbitalData();
    v10UpdateRecorder();
    v10RecalcHealth();
};

v10ArchiveLoad();
v10Bind();
