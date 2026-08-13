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

let orbitSeconds = 0;
let missionSeconds = 0;

let timer = null;


/* ==========================================================
   AUDIO
   ========================================================== */

let audioContext = null;
let finalSong = null;


/* ==========================================================
   CHART DATA
   ========================================================== */

const chartLabels = [];
const altitudeData = [];
const velocityData = [];
const fuelData = [];

let altitudeChart = null;
let velocityChart = null;
let fuelChart = null;


/* ==========================================================
   DOM ELEMENTS
   ========================================================== */

const countdownElement =
    document.getElementById("countdown");

const flightStatus =
    document.getElementById("flightStatus");

const phaseIndicator =
    document.getElementById("phaseIndicator");

const altitudeElement =
    document.getElementById("altitude");

const velocityElement =
    document.getElementById("velocity");

const fuelElement =
    document.getElementById("fuel");

const temperatureElement =
    document.getElementById("temperature");

const fuelBar =
    document.getElementById("fuelBar");

const fuelPercent =
    document.getElementById("fuelPercent");

const missionTime =
    document.getElementById("missionTime");

const missionLog =
    document.getElementById("missionLog");

const graphStatus =
    document.getElementById("graphStatus");


/* ==========================================================
   V2.1 EARTH / ORBIT ELEMENTS
   ========================================================== */

const spaceRocket =
    document.getElementById("spaceRocket");

const satellite =
    document.getElementById("satellite");

const orbitPath =
    document.getElementById("orbitPath");

const orbitStatus =
    document.getElementById("orbitStatus");

const spaceAltitude =
    document.getElementById("spaceAltitude");


/* ==========================================================
   V2.3 VEHICLE ELEMENTS
   ========================================================== */

const vehicle =
    document.getElementById("vehicle");

const vehicleIndicator =
    document.getElementById("vehicleIndicator");

const vehicleStatusText =
    document.getElementById("vehicleStatusText");

const stageStatus =
    document.getElementById("stageStatus");

const launchTower =
    document.getElementById("launchTower");

const rocketExhaust =
    document.getElementById("rocketExhaust");


/* ==========================================================
   SAFE DOM HELPER
   ========================================================== */

function setText(element, value) {

    if (element) {
        element.textContent = value;
    }
}


/* ==========================================================
   AUDIO INITIALIZATION
   ========================================================== */

function initializeAudio() {

    try {

        if (!audioContext) {

            audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();
        }

        if (
            audioContext.state === "suspended"
        ) {

            audioContext.resume();
        }

    } catch (error) {

        console.error(
            "Audio initialization error:",
            error
        );
    }
}


/* ==========================================================
   ELECTRONIC COUNTDOWN BEEP
   ========================================================== */

function countdownBeep() {

    if (!audioContext) {
        return;
    }

    try {

        const oscillator =
            audioContext.createOscillator();

        const gain =
            audioContext.createGain();

        oscillator.type =
            "square";

        oscillator.frequency.setValueAtTime(
            950,
            audioContext.currentTime
        );

        gain.gain.setValueAtTime(
            0.0001,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.22,
            audioContext.currentTime + 0.01
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            audioContext.currentTime + 0.12
        );

        oscillator.connect(gain);
        gain.connect(
            audioContext.destination
        );

        oscillator.start();

        oscillator.stop(
            audioContext.currentTime + 0.13
        );

    } catch (error) {

        console.error(
            "Countdown beep error:",
            error
        );
    }
}


/* ==========================================================
   IGNITION SOUND
   ========================================================== */

function ignitionSound() {

    if (!audioContext) {
        return;
    }

    try {

        const oscillator =
            audioContext.createOscillator();

        const gain =
            audioContext.createGain();

        oscillator.type =
            "sawtooth";

        oscillator.frequency.setValueAtTime(
            220,
            audioContext.currentTime
        );

        oscillator.frequency.exponentialRampToValueAtTime(
            1100,
            audioContext.currentTime + 0.9
        );

        gain.gain.setValueAtTime(
            0.0001,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.36,
            audioContext.currentTime + 0.06
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            audioContext.currentTime + 0.95
        );

        oscillator.connect(gain);
        gain.connect(
            audioContext.destination
        );

        oscillator.start();

        oscillator.stop(
            audioContext.currentTime + 1.0
        );

    } catch (error) {

        console.error(
            "Ignition sound error:",
            error
        );
    }
}


/* ==========================================================
   DEPLOYMENT SOUND
   ========================================================== */

function deploymentSound() {

    if (!audioContext) {
        return;
    }

    try {

        const oscillator =
            audioContext.createOscillator();

        const gain =
            audioContext.createGain();

        oscillator.type =
            "sine";

        oscillator.frequency.setValueAtTime(
            450,
            audioContext.currentTime
        );

        oscillator.frequency.exponentialRampToValueAtTime(
            1500,
            audioContext.currentTime + 0.65
        );

        gain.gain.setValueAtTime(
            0.0001,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.24,
            audioContext.currentTime + 0.04
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            audioContext.currentTime + 0.75
        );

        oscillator.connect(gain);
        gain.connect(
            audioContext.destination
        );

        oscillator.start();

        oscillator.stop(
            audioContext.currentTime + 0.8
        );

    } catch (error) {

        console.error(
            "Deployment sound error:",
            error
        );
    }
}


/* ==========================================================
   FINAL SONG
   ========================================================== */

function prepareSong() {

    if (finalSong) {
        return;
    }

    finalSong =
        new Audio(
            "/static/assets/maa_tujhe_salaam.mp3"
        );

    finalSong.preload = "auto";
    finalSong.volume = 1.0;
}

function playFinalSong() {

    prepareSong();

    if (!finalSong) {
        return;
    }

    finalSong.currentTime = 0;

    const playback =
        finalSong.play();

    if (
        playback &&
        typeof playback.catch === "function"
    ) {

        playback.catch(error => {

            console.error(
                "Song playback blocked:",
                error
            );

            log(
                "AUDIO",
                "Patriotic audio playback was blocked by the browser."
            );
        });
    }

    log(
        "AUDIO",
        "PATRIOTIC AUDIO PLAYBACK STARTED"
    );
}

function stopFinalSong() {

    if (!finalSong) {
        return;
    }

    finalSong.pause();
    finalSong.currentTime = 0;
}


/* ==========================================================
   BROWSER VOICE
   ========================================================== */

function speak(text) {

    if (
        !("speechSynthesis" in window)
    ) {

        return;
    }

    window.speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(text);

    utterance.rate = 0.9;
    utterance.pitch = 0.95;
    utterance.volume = 1.0;

    const voices =
        window.speechSynthesis.getVoices();

    const preferredVoice =
        voices.find(
            voice =>
                voice.lang === "en-IN"
        ) ||
        voices.find(
            voice =>
                voice.lang &&
                voice.lang.startsWith("en")
        );

    if (preferredVoice) {
        utterance.voice =
            preferredVoice;
    }

    window.speechSynthesis.speak(
        utterance
    );
}


/* ==========================================================
   LOG
   ========================================================== */

function log(source, message) {

    if (!missionLog) {
        return;
    }

    const line =
        document.createElement("div");

    line.textContent =
        `[${source}] ${message}`;

    missionLog.appendChild(line);

    missionLog.scrollTop =
        missionLog.scrollHeight;
}


/* ==========================================================
   TELEMETRY
   ========================================================== */

function updateTelemetry() {

    setText(
        altitudeElement,
        altitude.toFixed(1)
    );

    setText(
        velocityElement,
        velocity.toFixed(2)
    );

    setText(
        fuelElement,
        fuel.toFixed(1)
    );

    setText(
        temperatureElement,
        temperature.toFixed(1)
    );

    const safeFuel =
        Math.max(
            0,
            Math.min(100, fuel)
        );

    if (fuelBar) {
        fuelBar.style.width =
            `${safeFuel}%`;
    }

    setText(
        fuelPercent,
        `${safeFuel.toFixed(0)}%`
    );

    setText(
        spaceAltitude,
        `ALT ${altitude.toFixed(1)} KM`
    );
}


/* ==========================================================
   MISSION CLOCK
   ========================================================== */

function updateMissionClock() {

    const hours =
        Math.floor(
            missionSeconds / 3600
        );

    const minutes =
        Math.floor(
            (missionSeconds % 3600) / 60
        );

    const seconds =
        missionSeconds % 60;

    setText(
        missionTime,
        `T+ ${String(hours).padStart(2, "0")}:` +
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`
    );
}


/* ==========================================================
   PHASE INDICATOR
   ========================================================== */

function updatePhaseIndicator() {

    const phases = {

        IDLE:
            "PRE-LAUNCH",

        COUNTDOWN:
            "COUNTDOWN",

        IGNITION:
            "ENGINE IGNITION",

        LIFTOFF:
            "LIFTOFF",

        ASCENT:
            "ASCENT",

        ORBIT:
            "ORBITAL OPERATIONS",

        SATELLITE_DEPLOYED:
            "SATELLITE DEPLOYED",

        MISSION_SUCCESS:
            "MISSION COMPLETE",

        ABORTED:
            "MISSION ABORTED"
    };

    setText(
        phaseIndicator,
        phases[phase] || phase
    );
}


/* ==========================================================
   CHART INITIALIZATION
   ========================================================== */

function initializeCharts() {

    if (
        typeof Chart === "undefined"
    ) {

        console.error(
            "Chart.js failed to load."
        );

        return;
    }

    const commonOptions = {

        responsive: true,

        maintainAspectRatio: false,

        animation: false,

        interaction: {
            intersect: false,
            mode: "index"
        },

        plugins: {

            legend: {
                display: false
            },

            tooltip: {

                backgroundColor:
                    "#08101b",

                borderColor:
                    "#29425e",

                borderWidth: 1,

                titleColor:
                    "#dce9f7",

                bodyColor:
                    "#8da0b8",

                displayColors:
                    false
            }
        },

        scales: {

            x: {

                grid: {
                    color:
                        "rgba(60,90,120,0.12)"
                },

                ticks: {

                    color:
                        "#52667e",

                    font: {
                        size: 8
                    },

                    maxTicksLimit: 8
                }
            },

            y: {

                beginAtZero: true,

                grid: {

                    color:
                        "rgba(60,90,120,0.12)"
                },

                ticks: {

                    color:
                        "#52667e",

                    font: {
                        size: 8
                    }
                }
            }
        }
    };


    const altitudeCanvas =
        document.getElementById(
            "altitudeChart"
        );

    const velocityCanvas =
        document.getElementById(
            "velocityChart"
        );

    const fuelCanvas =
        document.getElementById(
            "fuelChart"
        );


    if (
        altitudeCanvas
    ) {

        altitudeChart =
            new Chart(
                altitudeCanvas,
                {

                    type: "line",

                    data: {

                        labels:
                            chartLabels,

                        datasets: [
                            {

                                data:
                                    altitudeData,

                                borderColor:
                                    "#00b7ff",

                                backgroundColor:
                                    "rgba(0,183,255,0.08)",

                                borderWidth: 2,

                                pointRadius: 0,

                                fill: true,

                                tension: 0.25
                            }
                        ]
                    },

                    options:
                        commonOptions
                }
            );
    }


    if (
        velocityCanvas
    ) {

        velocityChart =
            new Chart(
                velocityCanvas,
                {

                    type: "line",

                    data: {

                        labels:
                            chartLabels,

                        datasets: [
                            {

                                data:
                                    velocityData,

                                borderColor:
                                    "#00e676",

                                backgroundColor:
                                    "rgba(0,230,118,0.07)",

                                borderWidth: 2,

                                pointRadius: 0,

                                fill: true,

                                tension: 0.25
                            }
                        ]
                    },

                    options:
                        commonOptions
                }
            );
    }


    if (
        fuelCanvas
    ) {

        fuelChart =
            new Chart(
                fuelCanvas,
                {

                    type: "line",

                    data: {

                        labels:
                            chartLabels,

                        datasets: [
                            {

                                data:
                                    fuelData,

                                borderColor:
                                    "#ffb020",

                                backgroundColor:
                                    "rgba(255,176,32,0.07)",

                                borderWidth: 2,

                                pointRadius: 0,

                                fill: true,

                                tension: 0.2
                            }
                        ]
                    },

                    options: {

                        ...commonOptions,

                        scales: {

                            ...commonOptions.scales,

                            y: {

                                ...commonOptions.scales.y,

                                min: 0,

                                max: 100
                            }
                        }
                    }
                }
            );
    }
}


/* ==========================================================
   RESET CHARTS
   ========================================================== */

function resetCharts() {

    chartLabels.length = 0;
    altitudeData.length = 0;
    velocityData.length = 0;
    fuelData.length = 0;

    [
        altitudeChart,
        velocityChart,
        fuelChart
    ].forEach(chart => {

        if (chart) {
            chart.update("none");
        }
    });

    if (graphStatus) {

        graphStatus.textContent =
            "STANDBY";

        graphStatus.classList.remove(
            "active"
        );
    }
}


/* ==========================================================
   UPDATE CHARTS
   ========================================================== */

function updateCharts() {

    if (
        !altitudeChart ||
        !velocityChart ||
        !fuelChart
    ) {

        return;
    }

    chartLabels.push(
        `T+${missionSeconds}s`
    );

    altitudeData.push(
        Number(
            altitude.toFixed(2)
        )
    );

    velocityData.push(
        Number(
            velocity.toFixed(3)
        )
    );

    fuelData.push(
        Number(
            fuel.toFixed(2)
        )
    );


    /*
     * Keep the graph from becoming enormous.
     */

    if (
        chartLabels.length > 90
    ) {

        chartLabels.shift();
        altitudeData.shift();
        velocityData.shift();
        fuelData.shift();
    }


    altitudeChart.update("none");
    velocityChart.update("none");
    fuelChart.update("none");


    if (graphStatus) {

        graphStatus.textContent =
            "LIVE";

        graphStatus.classList.add(
            "active"
        );
    }
}


/* ==========================================================
   V2.3 VEHICLE VISUALIZATION
   ========================================================== */

function updateVehicleScene() {

    if (!vehicle) {
        return;
    }

    /*
     * Reset launch tower state.
     */

    if (launchTower) {

        launchTower.style.opacity =
            "0.55";
    }


    /* --------------------------------------------------------
       IDLE
       -------------------------------------------------------- */

    if (
        phase === "IDLE"
    ) {

        vehicle.className =
            "vehicle ready";

        setText(
            vehicleIndicator,
            "READY"
        );

        setText(
            vehicleStatusText,
            "READY"
        );

        setText(
            stageStatus,
            "STAGE CONFIGURATION: STANDBY"
        );

        return;
    }


    /* --------------------------------------------------------
       COUNTDOWN
       -------------------------------------------------------- */

    if (
        phase === "COUNTDOWN"
    ) {

        vehicle.className =
            "vehicle ready";

        setText(
            vehicleIndicator,
            "ARMED"
        );

        setText(
            vehicleStatusText,
            "LAUNCH SYSTEM ARMED"
        );

        setText(
            stageStatus,
            "STAGE CONFIGURATION: FULL STACK"
        );

        return;
    }


    /* --------------------------------------------------------
       IGNITION
       -------------------------------------------------------- */

    if (
        phase === "IGNITION"
    ) {

        vehicle.className =
            "vehicle ignition";

        setText(
            vehicleIndicator,
            "IGNITION"
        );

        setText(
            vehicleStatusText,
            "ENGINE IGNITION"
        );

        setText(
            stageStatus,
            "ENGINE STATUS: NOMINAL"
        );

        return;
    }


    /* --------------------------------------------------------
       LIFTOFF
       -------------------------------------------------------- */

    if (
        phase === "LIFTOFF"
    ) {

        vehicle.className =
            "vehicle liftoff";

        setText(
            vehicleIndicator,
            "LIFTOFF"
        );

        setText(
            vehicleStatusText,
            "CLEAR OF LAUNCH TOWER"
        );

        setText(
            stageStatus,
            "FLIGHT PHASE: LIFTOFF"
        );

        if (launchTower) {

            launchTower.style.opacity =
                "0.28";
        }

        return;
    }


    /* --------------------------------------------------------
       ASCENT
       -------------------------------------------------------- */

    if (
        phase === "ASCENT"
    ) {

        vehicle.className =
            "vehicle ascent";

        setText(
            vehicleIndicator,
            "ASCENT"
        );

        setText(
            vehicleStatusText,
            "ASCENT NOMINAL"
        );

        setText(
            stageStatus,
            "FLIGHT PHASE: ASCENT"
        );

        if (launchTower) {

            launchTower.style.opacity =
                "0.12";
        }

        return;
    }


    /* --------------------------------------------------------
       ORBIT
       -------------------------------------------------------- */

    if (
        phase === "ORBIT"
    ) {

        vehicle.className =
            "vehicle orbit";

        setText(
            vehicleIndicator,
            "ORBIT"
        );

        setText(
            vehicleStatusText,
            "ORBIT INSERTION"
        );

        setText(
            stageStatus,
            "FLIGHT PHASE: ORBITAL OPERATIONS"
        );

        if (launchTower) {

            launchTower.style.opacity =
                "0.08";
        }

        return;
    }


    /* --------------------------------------------------------
       SATELLITE DEPLOYED
       -------------------------------------------------------- */

    if (
        phase ===
        "SATELLITE_DEPLOYED"
    ) {

        vehicle.className =
            "vehicle orbit";

        setText(
            vehicleIndicator,
            "DEPLOYED"
        );

        setText(
            vehicleStatusText,
            "PAYLOAD DEPLOYED"
        );

        setText(
            stageStatus,
            "PAYLOAD STATUS: DEPLOYED"
        );

        return;
    }


    /* --------------------------------------------------------
       MISSION SUCCESS
       -------------------------------------------------------- */

    if (
        phase ===
        "MISSION_SUCCESS"
    ) {

        vehicle.className =
            "vehicle orbit";

        setText(
            vehicleIndicator,
            "COMPLETE"
        );

        setText(
            vehicleStatusText,
            "MISSION SUCCESS"
        );

        setText(
            stageStatus,
            "MISSION STATUS: SUCCESS"
        );

        return;
    }


    /* --------------------------------------------------------
       ABORT
       -------------------------------------------------------- */

    if (
        phase ===
        "ABORTED"
    ) {

        vehicle.className =
            "vehicle ready";

        setText(
            vehicleIndicator,
            "ABORT"
        );

        setText(
            vehicleStatusText,
            "LAUNCH ABORTED"
        );

        setText(
            stageStatus,
            "FLIGHT PHASE: ABORT"
        );
    }
}


/* ==========================================================
   V2.1 EARTH / ORBIT VISUALIZATION
   ========================================================== */

function updateSpaceScene() {

    if (!spaceRocket) {
        return;
    }

    setText(
        spaceAltitude,
        `ALT ${altitude.toFixed(1)} KM`
    );


    /* --------------------------------------------------------
       IDLE / COUNTDOWN
       -------------------------------------------------------- */

    if (
        phase === "IDLE" ||
        phase === "COUNTDOWN"
    ) {

        setText(
            orbitStatus,
            phase === "IDLE"
                ? "GROUND"
                : "ARMED"
        );

        spaceRocket.className =
            "space-rocket";

        spaceRocket.style.left =
            "50%";

        spaceRocket.style.top =
            "78%";

        satellite.className =
            "satellite";

        orbitPath.classList.remove(
            "active"
        );

        return;
    }


    /* --------------------------------------------------------
       IGNITION
       -------------------------------------------------------- */

    if (
        phase === "IGNITION"
    ) {

        setText(
            orbitStatus,
            "IGNITION"
        );

        spaceRocket.className =
            "space-rocket visible";

        spaceRocket.style.left =
            "50%";

        spaceRocket.style.top =
            "74%";

        return;
    }


    /* --------------------------------------------------------
       LIFTOFF
       -------------------------------------------------------- */

    if (
        phase === "LIFTOFF"
    ) {

        setText(
            orbitStatus,
            "LIFTOFF"
        );

        spaceRocket.className =
            "space-rocket visible";

        spaceRocket.style.left =
            "50%";

        spaceRocket.style.top =
            "64%";

        return;
    }


    /* --------------------------------------------------------
       ASCENT
       -------------------------------------------------------- */

    if (
        phase === "ASCENT"
    ) {

        setText(
            orbitStatus,
            "ASCENT"
        );

        const progress =
            Math.min(
                altitude / 100,
                1
            );

        const rocketTop =
            64 -
            progress * 42;

        const rocketLeft =
            50 +
            progress * 9;

        spaceRocket.className =
            "space-rocket visible";

        spaceRocket.style.left =
            `${rocketLeft}%`;

        spaceRocket.style.top =
            `${rocketTop}%`;

        return;
    }


    /* --------------------------------------------------------
       ORBIT
       -------------------------------------------------------- */

    if (
        phase === "ORBIT"
    ) {

        setText(
            orbitStatus,
            "ORBIT"
        );

        orbitPath.classList.add(
            "active"
        );

        spaceRocket.className =
            "space-rocket visible";

        spaceRocket.style.left =
            "50%";

        spaceRocket.style.top =
            "53%";

        satellite.className =
            "satellite";

        return;
    }


    /* --------------------------------------------------------
       SATELLITE DEPLOYMENT
       -------------------------------------------------------- */

    if (
        phase ===
        "SATELLITE_DEPLOYED"
    ) {

        setText(
            orbitStatus,
            "DEPLOYED"
        );

        orbitPath.classList.add(
            "active"
        );

        spaceRocket.className =
            "space-rocket visible";

        spaceRocket.style.left =
            "50%";

        spaceRocket.style.top =
            "53%";

        satellite.className =
            "satellite deployed";

        return;
    }


    /* --------------------------------------------------------
       MISSION SUCCESS
       -------------------------------------------------------- */

    if (
        phase ===
        "MISSION_SUCCESS"
    ) {

        setText(
            orbitStatus,
            "MISSION COMPLETE"
        );

        orbitPath.classList.add(
            "active"
        );

        spaceRocket.className =
            "space-rocket visible";

        satellite.className =
            "satellite deployed";

        return;
    }


    /* --------------------------------------------------------
       ABORT
       -------------------------------------------------------- */

    if (
        phase ===
        "ABORTED"
    ) {

        setText(
            orbitStatus,
            "ABORT"
        );

        spaceRocket.className =
            "space-rocket";

        satellite.className =
            "satellite";

        orbitPath.classList.remove(
            "active"
        );
    }
}


/* ==========================================================
   START MISSION
   ========================================================== */

function launchMission() {

    if (running) {
        return;
    }

    initializeAudio();
    prepareSong();
    resetCharts();


    /*
     * Reset mission values.
     */

    running = true;

    phase = "COUNTDOWN";

    countdown = 10;

    altitude = 0;
    velocity = 0;
    fuel = 100;
    temperature = 28;

    orbitSeconds = 0;
    missionSeconds = 0;


    /*
     * Reset UI.
     */

    setText(
        countdownElement,
        "T−10"
    );

    setText(
        flightStatus,
        "COUNTDOWN INITIATED"
    );

    log(
        "FLIGHT",
        "LAUNCH SEQUENCE INITIATED"
    );

    log(
        "COUNTDOWN",
        "T−10"
    );


    countdownBeep();

    updateTelemetry();
    updateMissionClock();
    updatePhaseIndicator();
    updateVehicleScene();
    updateSpaceScene();


    clearInterval(timer);

    timer =
        setInterval(
            missionTick,
            1000
        );
}


/* ==========================================================
   MAIN MISSION LOOP
   ========================================================== */

function missionTick() {

    if (!running) {
        return;
    }

    missionSeconds++;

    updateMissionClock();


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

            setText(
                countdownElement,
                `T−${countdown}`
            );

            log(
                "COUNTDOWN",
                `T−${countdown}`
            );

            countdownBeep();

        } else {

            setText(
                countdownElement,
                "T−0"
            );

            phase =
                "IGNITION";

            setText(
                flightStatus,
                "ENGINE IGNITION"
            );

            log(
                "ENGINE",
                "T−0 — MAIN ENGINE IGNITION"
            );

            ignitionSound();

            speak(
                "Ignition."
            );
        }

        updatePhaseIndicator();
        updateVehicleScene();
        updateSpaceScene();

        return;
    }


    /* ========================================================
       IGNITION
       ======================================================== */

    if (
        phase === "IGNITION"
    ) {

        phase =
            "LIFTOFF";

        setText(
            flightStatus,
            "LIFTOFF CONFIRMED"
        );

        log(
            "FLIGHT",
            "VEHICLE HAS CLEARED LAUNCH TOWER"
        );

        speak(
            "Liftoff confirmed."
        );

        updatePhaseIndicator();
        updateVehicleScene();
        updateSpaceScene();

        return;
    }


    /* ========================================================
       LIFTOFF
       ======================================================== */

    if (
        phase === "LIFTOFF"
    ) {

        phase =
            "ASCENT";

        setText(
            flightStatus,
            "ASCENT"
        );

        log(
            "FLIGHT",
            "VEHICLE ASCENDING"
        );

        updatePhaseIndicator();
        updateVehicleScene();
        updateSpaceScene();

        return;
    }


    /* ========================================================
       ASCENT
       ======================================================== */

    if (
        phase === "ASCENT"
    ) {

        altitude +=
            10 +
            Math.random() * 8;

        velocity +=
            0.4 +
            Math.random() * 0.3;

        fuel -=
            1.2 +
            Math.random() * 0.4;

        temperature +=
            (Math.random() - 0.5) * 2;


        updateTelemetry();
        updateCharts();


        if (
            altitude >= 100
        ) {

            phase =
                "ORBIT";

            orbitSeconds = 0;

            setText(
                flightStatus,
                "ORBIT INSERTION"
            );

            log(
                "FLIGHT",
                "STABLE ORBITAL TRAJECTORY ACHIEVED"
            );

            speak(
                "Orbit insertion confirmed."
            );
        }


        updatePhaseIndicator();
        updateVehicleScene();
        updateSpaceScene();

        return;
    }


    /* ========================================================
       ORBIT
       ======================================================== */

    if (
        phase === "ORBIT"
    ) {

        orbitSeconds++;

        altitude +=
            (Math.random() - 0.5) * 2;

        velocity +=
            (Math.random() - 0.5) * 0.03;

        fuel -=
            0.15;

        temperature +=
            (Math.random() - 0.5) * 0.5;


        updateTelemetry();
        updateCharts();


        log(
            "ORBIT",
            `ORBITAL OPERATIONS T+${orbitSeconds}s`
        );


        updatePhaseIndicator();
        updateVehicleScene();
        updateSpaceScene();


        if (
            orbitSeconds >= 5
        ) {

            deploySatellite();
        }

        return;
    }
}


/* ==========================================================
   SATELLITE DEPLOYMENT
   ========================================================== */

function deploySatellite() {

    running = false;

    clearInterval(timer);

    phase =
        "SATELLITE_DEPLOYED";


    setText(
        flightStatus,
        "SATELLITE DEPLOYED"
    );

    log(
        "MISSION",
        "SATELLITE DEPLOYMENT SUCCESSFUL"
    );

    deploymentSound();

    updatePhaseIndicator();
    updateVehicleScene();
    updateSpaceScene();

    speak(
        "Satellite deployed successfully."
    );


    setTimeout(
        missionSuccess,
        3500
    );
}


/* ==========================================================
   MISSION SUCCESS
   ========================================================== */

function missionSuccess() {

    phase =
        "MISSION_SUCCESS";


    setText(
        flightStatus,
        "MISSION SUCCESS"
    );

    log(
        "SUCCESS",
        "MISSION ACCOMPLISHED"
    );


    updatePhaseIndicator();
    updateVehicleScene();
    updateSpaceScene();


    speak(
        "Mission accomplished. Jai Heend!"
    );


    setTimeout(
        playFinalSong,
        3500
    );
}


/* ==========================================================
   ABORT
   ========================================================== */

function abortMission() {

    if (!running) {
        return;
    }

    running = false;

    clearInterval(timer);

    phase =
        "ABORTED";


    setText(
        flightStatus,
        "MISSION ABORTED"
    );


    stopFinalSong();


    if (
        "speechSynthesis" in window
    ) {

        window.speechSynthesis.cancel();
    }


    log(
        "WARNING",
        "MISSION ABORT COMMAND RECEIVED"
    );


    if (graphStatus) {

        graphStatus.textContent =
            "ABORTED";

        graphStatus.classList.remove(
            "active"
        );
    }


    updatePhaseIndicator();
    updateVehicleScene();
    updateSpaceScene();
}


/* ==========================================================
   BUTTONS
   ========================================================== */

const launchButton =
    document.getElementById(
        "launchButton"
    );

if (launchButton) {

    launchButton.addEventListener(
        "click",
        launchMission
    );
}


const abortButton =
    document.getElementById(
        "abortButton"
    );

if (abortButton) {

    abortButton.addEventListener(
        "click",
        abortMission
    );
}


const fullscreenButton =
    document.getElementById(
        "fullscreenButton"
    );

if (fullscreenButton) {

    fullscreenButton.addEventListener(
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
}


/* ==========================================================
   INITIAL STATE
   ========================================================== */

initializeCharts();

updateTelemetry();

updateMissionClock();

updatePhaseIndicator();

updateVehicleScene();

updateSpaceScene();

prepareSong();


/* ==========================================================
   SPEECH VOICE INITIALIZATION
   ========================================================== */

if (
    "speechSynthesis" in window
) {

    window.speechSynthesis
        .onvoiceschanged = () => {

            window.speechSynthesis
                .getVoices();
        };
}