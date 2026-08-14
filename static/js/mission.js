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
  setSubsystems();
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
  running = false; clearInterval(timer); stopAudio(); phase="IDLE"; countdown=10; altitude=0; velocity=0; fuel=100; temperature=28; signal=100; latency=38; orbitSeconds=0; missionSeconds=0; eventCount=0;
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
    altitude += 14 + Math.random()*6; velocity += .4 + Math.random()*.2; fuel -= 1.2 + Math.random()*.4; temperature += (Math.random()-.25)*2; signal=Math.max(78,100-altitude*.04); latency=38+altitude*.04;
    if (altitude >= 110) { phase="ORBIT"; orbitSeconds=0; playClip("orbit"); log("FLIGHT","Stable orbital trajectory achieved"); }
  } else if (phase === "ORBIT") {
    orbitSeconds++; altitude+=(Math.random()-.5)*1.2; velocity+=(Math.random()-.5)*.03; fuel-=.12; temperature+=(Math.random()-.5)*.4; signal=94+Math.random()*5; latency=48+Math.random()*10; log("ORBIT",`Orbital operations T+${orbitSeconds}s`); if (orbitSeconds>=5) deploySatellite();
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
