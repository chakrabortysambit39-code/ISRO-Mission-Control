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

let gLoad = 1;
let pressure = 101.3;

let signal = 100;
let latency = 38;
let packetLoss = 0.01;
let dataRate = 0;

let timer = null;

let soundEnabled = true;


/* ==========================================================
   ELECTRONIC AUDIO
   ========================================================== */

let audioContext = null;


/* ==========================================================
   YOUR VOICE + SONG
   ========================================================== */

const missionAudio = {

    ignition:
        new Audio(
            "/static/assets/ignition.mp3"
        ),

    liftoff:
        new Audio(
            "/static/assets/liftoff.mp3"
        ),

    orbit:
        new Audio(
            "/static/assets/orbit_confirmed.mp3"
        ),

    deployment:
        new Audio(
            "/static/assets/satellite_deployed.mp3"
        ),

    success:
        new Audio(
            "/static/assets/mission_accomplished.mp3"
        ),

    finale:
        new Audio(
            "/static/assets/maa_tujhe_salaam.mp3"
        )
};


/* ==========================================================
   PRELOAD AUDIO
   ========================================================== */

Object.values(
    missionAudio
).forEach(
    audio => {

        audio.preload = "auto";
        audio.volume = 1.0;

    }
);


/* ==========================================================
   WEB SERIAL — ARDUINO UNO
   ========================================================== */

let arduinoPort = null;
let arduinoWriter = null;


/*
 * Check Web Serial support.
 */

function webSerialSupported() {

    return (
        "serial" in navigator
    );

}


/* ==========================================================
   CONNECT ARDUINO
   ========================================================== */

async function connectArduino() {

    if (
        !webSerialSupported()
    ) {

        alert(
            "Web Serial is not supported in this browser. Use Chrome or Edge on desktop."
        );

        return false;
    }


    try {

        /*
         * Ask the browser to choose
         * the Arduino serial port.
         *
         * This MUST happen from a
         * user interaction such as
         * clicking Launch.
         */

        arduinoPort =
            await navigator.serial.requestPort();


        await arduinoPort.open({
            baudRate: 9600
        });


        arduinoWriter =
            arduinoPort.writable.getWriter();


        console.log(
            "Arduino UNO connected."
        );


        logEvent(
            "HARDWARE",
            "Arduino UNO connected"
        );


        return true;

    } catch (error) {

        console.error(
            "Arduino connection failed:",
            error
        );


        arduinoPort = null;
        arduinoWriter = null;


        logEvent(
            "HARDWARE",
            "Arduino connection cancelled"
        );


        return false;
    }
}


/* ==========================================================
   SEND COMMAND TO ARDUINO
   ========================================================== */

async function sendArduino(
    command
) {

    if (
        !arduinoWriter
    ) {

        console.warn(
            "Arduino not connected:",
            command
        );

        return false;
    }


    try {

        const data =
            new TextEncoder().encode(
                `${command}\n`
            );


        await arduinoWriter.write(
            data
        );


        console.log(
            "Arduino ←",
            command
        );


        return true;

    } catch (error) {

        console.error(
            "Arduino command failed:",
            error
        );


        logEvent(
            "HARDWARE",
            `Arduino command failed: ${command}`
        );


        return false;
    }
}


/* ==========================================================
   DISCONNECT ARDUINO
   ========================================================== */

async function disconnectArduino() {

    try {

        if (
            arduinoWriter
        ) {

            arduinoWriter.releaseLock();

            arduinoWriter = null;
        }


        if (
            arduinoPort
        ) {

            await arduinoPort.close();

            arduinoPort = null;
        }

    } catch (error) {

        console.error(
            "Arduino disconnect error:",
            error
        );

    }

}


/* ==========================================================
   DOM HELPER
   ========================================================== */

const $ =
    id =>
        document.getElementById(id);


function setText(
    element,
    value
) {

    if (
        element
    ) {

        element.textContent =
            value;
    }
}


/* ==========================================================
   DOM ELEMENTS
   ========================================================== */

const countdownElement =
    $("countdown");

const flightStatus =
    $("flightStatus");

const phaseIndicator =
    $("phaseIndicator");

const missionTimeElement =
    $("missionTime");

const altitudeElement =
    $("altitude");

const velocityElement =
    $("velocity");

const fuelElement =
    $("fuel");

const temperatureElement =
    $("temperature");

const fuelBar =
    $("fuelBar");

const fuelPercent =
    $("fuelPercent");

const graphStatus =
    $("graphStatus");

const dataBar =
    $("dataBar");

const dataRateElement =
    $("dataRate");

const signalBar =
    $("signalBar");

const signalElement =
    $("signal");

const latencyElement =
    $("latency");

const packetLossElement =
    $("packetLoss");

const gLoadElement =
    $("gLoad");

const pressureElement =
    $("pressure");

const vehicle =
    $("vehicle");

const vehicleStatus =
    $("vehicleStatus");

const vehicleStatusText =
    $("vehicleStatusText");

const sceneCaption =
    $("sceneCaption");

const sceneAltitude =
    $("sceneAltitude");

const launchTower =
    $("launchTower");

const stageStatus =
    $("stageStatus");

const guidanceState =
    $("guidanceState");

const payloadName =
    $("payloadName");

const targetOrbit =
    $("targetOrbit");

const orbitStatus =
    $("orbitStatus");

const spaceRocket =
    $("spaceRocket");

const satellite =
    $("satellite");

const orbitPath =
    $("orbitPath");

const missionLog =
    $("missionLog");

const logCount =
    $("logCount");

const commsState =
    $("commsState");

const subGuidance =
    $("subGuidance");

const subPropulsion =
    $("subPropulsion");

const subThermal =
    $("subThermal");

const subAvionics =
    $("subAvionics");

const subComms =
    $("subComms");

const subPower =
    $("subPower");


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
   EVENT COUNT
   ========================================================== */

let eventCount = 0;


/* ==========================================================
   AUDIO CONTEXT
   ========================================================== */

function initializeAudio() {

    if (
        !soundEnabled
    ) {

        return;
    }


    try {

        if (
            !audioContext
        ) {

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

    } catch (error) {

        console.error(
            "Audio initialization error:",
            error
        );
    }

}


/* ==========================================================
   ELECTRONIC TONE
   ========================================================== */

function electronicTone(
    frequency = 900,
    duration = 0.1,
    type = "square",
    volume = 0.15
) {

    if (
        !soundEnabled
    ) {

        return;
    }


    initializeAudio();


    if (
        !audioContext
    ) {

        return;
    }


    try {

        const oscillator =
            audioContext.createOscillator();

        const gain =
            audioContext.createGain();


        oscillator.type =
            type;


        oscillator.frequency.value =
            frequency;


        gain.gain.value =
            0.0001;


        gain.gain.exponentialRampToValueAtTime(
            volume,
            audioContext.currentTime +
            0.01
        );


        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            audioContext.currentTime +
            duration
        );


        oscillator.connect(
            gain
        );

        gain.connect(
            audioContext.destination
        );


        oscillator.start();


        oscillator.stop(
            audioContext.currentTime +
            duration +
            0.01
        );

    } catch (error) {

        console.error(
            "Electronic tone error:",
            error
        );
    }

}


/* ==========================================================
   COUNTDOWN BEEP
   ========================================================== */

function countdownBeep() {

    electronicTone(
        950,
        0.11,
        "square",
        0.15
    );

}


/* ==========================================================
   IGNITION EFFECT
   ========================================================== */

function ignitionEffect() {

    electronicTone(
        240,
        0.9,
        "sawtooth",
        0.24
    );


    setTimeout(
        () => {

            electronicTone(
                820,
                0.35,
                "triangle",
                0.12
            );

        },
        80
    );

}


/* ==========================================================
   DEPLOYMENT EFFECT
   ========================================================== */

function deploymentEffect() {

    electronicTone(
        500,
        0.25,
        "sine",
        0.14
    );


    setTimeout(
        () => {

            electronicTone(
                1100,
                0.55,
                "sine",
                0.10
            );

        },
        120
    );

}


/* ==========================================================
   PLAY YOUR VOICE
   ========================================================== */

function playVoice(
    name
) {

    if (
        !soundEnabled
    ) {

        return;
    }


    const audio =
        missionAudio[name];


    if (
        !audio
    ) {

        return;
    }


    try {

        audio.pause();

        audio.currentTime =
            0;


        const playback =
            audio.play();


        if (
            playback &&
            typeof playback.catch ===
            "function"
        ) {

            playback.catch(
                error => {

                    console.error(
                        `Voice playback failed: ${name}`,
                        error
                    );

                    logEvent(
                        "AUDIO",
                        `${name}.mp3 could not be played`
                    );

                }
            );

        }

    } catch (error) {

        console.error(
            "Voice error:",
            error
        );

    }

}


/* ==========================================================
   PLAY SONG
   ========================================================== */

function playFinalSong() {

    if (
        !soundEnabled
    ) {

        return;
    }


    const audio =
        missionAudio.finale;


    if (
        !audio
    ) {

        return;
    }


    try {

        audio.pause();

        audio.currentTime =
            0;


        const playback =
            audio.play();


        if (
            playback &&
            typeof playback.catch ===
            "function"
        ) {

            playback.catch(
                error => {

                    console.error(
                        "Final song playback failed:",
                        error
                    );

                    logEvent(
                        "AUDIO",
                        "Maa Tujhe Salaam could not be played"
                    );

                }
            );

        }


        logEvent(
            "AUDIO",
            "Maa Tujhe Salaam playback started"
        );

    } catch (error) {

        console.error(
            "Final song error:",
            error
        );

    }

}


/* ==========================================================
   STOP ALL AUDIO
   ========================================================== */

function stopAllAudio() {

    Object.values(
        missionAudio
    ).forEach(
        audio => {

            try {

                audio.pause();

                audio.currentTime =
                    0;

            } catch (error) {

                // Ignore individual audio cleanup errors.

            }

        }
    );

}


/* ==========================================================
   LOG
   ========================================================== */

function logEvent(
    source,
    message
) {

    eventCount++;


    if (
        missionLog
    ) {

        const row =
            document.createElement(
                "div"
            );


        row.textContent =
            `[${source}] ${message}`;


        missionLog.appendChild(
            row
        );


        missionLog.scrollTop =
            missionLog.scrollHeight;

    }


    setText(
        logCount,
        `${eventCount} EVENTS`
    );

}


/* ==========================================================
   CHART OPTIONS
   ========================================================== */

function chartOptions() {

    return {

        responsive:
            true,

        maintainAspectRatio:
            false,

        animation:
            false,

        plugins: {

            legend: {
                display:
                    false
            },

            tooltip: {

                displayColors:
                    false,

                backgroundColor:
                    "#07111c",

                borderColor:
                    "#26435b",

                borderWidth:
                    1

            }

        },

        scales: {

            x: {

                grid: {

                    color:
                        "rgba(70,110,140,.12)"
                },

                ticks: {

                    color:
                        "#51677f",

                    font: {

                        size:
                            7

                    },

                    maxTicksLimit:
                        7
                }
            },

            y: {

                beginAtZero:
                    true,

                grid: {

                    color:
                        "rgba(70,110,140,.12)"
                },

                ticks: {

                    color:
                        "#51677f",

                    font: {

                        size:
                            7
                    }
                }
            }
        }

    };

}


/* ==========================================================
   INITIALIZE CHARTS
   ========================================================== */

function initializeCharts() {

    if (
        typeof Chart ===
        "undefined"
    ) {

        console.error(
            "Chart.js failed to load."
        );

        return;
    }


    const altitudeCanvas =
        $("altitudeChart");

    const velocityCanvas =
        $("velocityChart");

    const fuelCanvas =
        $("fuelChart");


    if (
        altitudeCanvas
    ) {

        altitudeChart =
            new Chart(
                altitudeCanvas,
                {

                    type:
                        "line",

                    data: {

                        labels:
                            chartLabels,

                        datasets: [

                            {

                                data:
                                    altitudeData,

                                borderColor:
                                    "#25b7ff",

                                backgroundColor:
                                    "rgba(37,183,255,.07)",

                                borderWidth:
                                    2,

                                fill:
                                    true,

                                pointRadius:
                                    0,

                                tension:
                                    0.24

                            }

                        ]

                    },

                    options:
                        chartOptions()

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

                    type:
                        "line",

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
                                    "rgba(0,230,118,.06)",

                                borderWidth:
                                    2,

                                fill:
                                    true,

                                pointRadius:
                                    0,

                                tension:
                                    0.24

                            }

                        ]

                    },

                    options:
                        chartOptions()

                }
            );
    }


    if (
        fuelCanvas
    ) {

        const fuelOptions =
            chartOptions();


        fuelOptions.scales.y.min =
            0;

        fuelOptions.scales.y.max =
            100;


        fuelChart =
            new Chart(
                fuelCanvas,
                {

                    type:
                        "line",

                    data: {

                        labels:
                            chartLabels,

                        datasets: [

                            {

                                data:
                                    fuelData,

                                borderColor:
                                    "#ffb52b",

                                backgroundColor:
                                    "rgba(255,181,43,.06)",

                                borderWidth:
                                    2,

                                fill:
                                    true,

                                pointRadius:
                                    0,

                                tension:
                                    0.2
                            }

                        ]

                    },

                    options:
                        fuelOptions

                }
            );
    }

}


/* ==========================================================
   RESET CHARTS
   ========================================================== */

function resetCharts() {

    chartLabels.length =
        0;

    altitudeData.length =
        0;

    velocityData.length =
        0;

    fuelData.length =
        0;


    [
        altitudeChart,
        velocityChart,
        fuelChart
    ].forEach(
        chart => {

            if (
                chart
            ) {

                chart.update(
                    "none"
                );

            }

        }
    );


    if (
        graphStatus
    ) {

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


    if (
        chartLabels.length >
        90
    ) {

        chartLabels.shift();
        altitudeData.shift();
        velocityData.shift();
        fuelData.shift();

    }


    altitudeChart.update(
        "none"
    );

    velocityChart.update(
        "none"
    );

    fuelChart.update(
        "none"
    );


    if (
        graphStatus
    ) {

        graphStatus.textContent =
            "LIVE";

        graphStatus.classList.add(
            "active"
        );

    }

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


    if (
        gLoadElement
    ) {

        setText(
            gLoadElement,
            gLoad.toFixed(2)
        );

    }


    if (
        pressureElement
    ) {

        setText(
            pressureElement,
            pressure.toFixed(1)
        );

    }


    const safeFuel =
        Math.max(
            0,
            Math.min(
                100,
                fuel
            )
        );


    if (
        fuelBar
    ) {

        fuelBar.style.width =
            `${safeFuel}%`;

    }


    setText(
        fuelPercent,
        `${safeFuel.toFixed(0)}%`
    );


    setText(
        dataRateElement,
        `${dataRate.toFixed(1)} MB/S`
    );


    if (
        dataBar
    ) {

        dataBar.style.width =
            `${Math.min(
                100,
                dataRate * 12
            )}%`;

    }


    setText(
        signalElement,
        `${signal.toFixed(0)}%`
    );


    if (
        signalBar
    ) {

        signalBar.style.width =
            `${signal}%`;

    }


    setText(
        latencyElement,
        `${latency.toFixed(0)} MS`
    );


    setText(
        packetLossElement,
        `${packetLoss.toFixed(2)}%`
    );


    setText(
        sceneAltitude,
        `ALT ${altitude.toFixed(1)} KM`
    );

}


/* ==========================================================
   CLOCK
   ========================================================== */

function updateClock() {

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
            ) /
            60
        );


    const seconds =
        missionSeconds %
        60;


    const time =
        `T+ ` +
        `${String(hours).padStart(2, "0")}:` +
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`;


    setText(
        missionTimeElement,
        time
    );


    const footerClock =
        $("footerClock");


    if (
        footerClock
    ) {

        footerClock.textContent =
            `LOCAL ${time}`;

    }

}


/* ==========================================================
   PROFILE
   ========================================================== */

const profiles = {

    lunar: {

        name:
            "CHANDRAYAAN-X",

        payload:
            "LUNAR ORBITER",

        target:
            "LUNAR TRANSFER",

        orbit:
            110,

        ascentRate:
            14
    },

    earth: {

        name:
            "EARTH OBSERVATION",

        payload:
            "EO SATELLITE",

        target:
            "LEO 550 KM",

        orbit:
            110,

        ascentRate:
            16
    },

    custom: {

        name:
            "CUSTOM SATELLITE",

        payload:
            "TECHNOLOGY DEMO",

        target:
            "LEO 400 KM",

        orbit:
            110,

        ascentRate:
            15
    }

};

let activeProfile =
    profiles.lunar;


/* ==========================================================
   APPLY PROFILE
   ========================================================== */

function applyProfile() {

    const missionSelect =
        $("missionSelect");


    if (
        !missionSelect
    ) {

        return;
    }


    const selected =
        missionSelect.value;


    activeProfile =
        profiles[selected];


    setText(
        $("heroMission"),
        activeProfile.name
    );


    setText(
        payloadName,
        activeProfile.payload
    );


    setText(
        targetOrbit,
        activeProfile.target
    );


    const orbitTitle =
        $("orbitTitle");


    if (
        orbitTitle
    ) {

        orbitTitle.textContent =
            selected === "lunar"

                ? "EARTH / TRANSFER ORBIT"

                : "EARTH / LOW EARTH ORBIT";

    }


    const targetLabel =
        $("targetLabel");


    if (
        targetLabel
    ) {

        targetLabel.textContent =
            activeProfile.target;

    }

}


/* ==========================================================
   STATUS
   ========================================================== */

function updateStatus() {

    const states = {

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


    setText(
        flightStatus,
        states[phase] || phase
    );

}


/* ==========================================================
   PHASE UI
   ========================================================== */

function updatePhaseIndicator() {

    let displayPhase =
        phase;


    if (
        phase ===
        "SATELLITE DEPLOYED"
    ) {

        displayPhase =
            "DEPLOYMENT";

    }


    if (
        phase ===
        "MISSION SUCCESS"
    ) {

        displayPhase =
            "COMPLETE";

    }


    setText(
        phaseIndicator,
        displayPhase
    );


    setText(
        $("phaseTop"),
        displayPhase
    );


    const order = [

        "IDLE",
        "COUNTDOWN",
        "IGNITION",
        "LIFTOFF",
        "ASCENT",
        "ORBIT",
        "DEPLOYMENT",
        "COMPLETE"

    ];


    let current =
        phase;


    if (
        phase ===
        "SATELLITE DEPLOYED"
    ) {

        current =
            "DEPLOYMENT";

    }


    if (
        phase ===
        "MISSION SUCCESS"
    ) {

        current =
            "COMPLETE";

    }


    const index =
        order.indexOf(
            current
        );


    document
        .querySelectorAll(
            ".timeline-item"
        )
        .forEach(
            (item, i) => {

                item.classList.toggle(
                    "active",
                    i === index
                );

                item.classList.toggle(
                    "done",
                    i < index
                );

            }
        );

}


/* ==========================================================
   VEHICLE
   ========================================================== */

function updateVehicleScene() {

    if (
        !vehicle
    ) {

        return;
    }


    vehicle.className =
        "vehicle " +
        phase
            .toLowerCase()
            .replaceAll(
                " ",
                "-"
            );


    switch (
        phase
    ) {

        case "IDLE":

            setText(
                sceneCaption,
                "VEHICLE READY"
            );

            launchTower.style.opacity =
                "0.55";

            break;


        case "COUNTDOWN":

            setText(
                sceneCaption,
                "LAUNCH SYSTEM ARMED"
            );

            launchTower.style.opacity =
                "0.55";

            break;


        case "IGNITION":

            setText(
                sceneCaption,
                "MAIN ENGINE IGNITION"
            );

            launchTower.style.opacity =
                "0.55";

            break;


        case "LIFTOFF":

            setText(
                sceneCaption,
                "CLEAR OF LAUNCH TOWER"
            );

            launchTower.style.opacity =
                "0.28";

            break;


        case "ASCENT":

            setText(
                sceneCaption,
                "ASCENT NOMINAL"
            );

            launchTower.style.opacity =
                "0.12";

            break;


        case "ORBIT":

            setText(
                sceneCaption,
                "ORBITAL STABILIZATION"
            );

            launchTower.style.opacity =
                "0.05";

            break;


        case "SATELLITE DEPLOYED":

            setText(
                sceneCaption,
                "PAYLOAD DEPLOYED"
            );

            launchTower.style.opacity =
                "0.03";

            break;


        case "MISSION SUCCESS":

            setText(
                sceneCaption,
                "MISSION SUCCESS"
            );

            launchTower.style.opacity =
                "0.03";

            break;


        case "ABORTED":

            setText(
                sceneCaption,
                "LAUNCH ABORTED"
            );

            launchTower.style.opacity =
                "0.55";

            break;

    }


    setText(
        vehicleStatus,
        phase
    );


    setText(
        vehicleStatusText,
        phase
    );


    setText(
        stageStatus,
        `STAGE CONFIGURATION: ${phase}`
    );


    setText(
        guidanceState,
        phase ===
            "IDLE"

            ? "STANDBY"

            : "NOMINAL"
    );

}


/* ==========================================================
   ORBIT
   ========================================================== */

function updateOrbitScene() {

    const orbital =
        phase === "ORBIT" ||
        phase ===
            "SATELLITE DEPLOYED" ||
        phase ===
            "MISSION SUCCESS";


    setText(
        orbitStatus,
        orbital
            ? "ORBIT"
            : "GROUND"
    );


    if (
        spaceRocket
    ) {

        spaceRocket.classList.toggle(
            "visible",
            orbital
        );

    }


    if (
        orbitPath
    ) {

        orbitPath.classList.toggle(
            "active",
            orbital
        );

    }


    if (
        satellite
    ) {

        satellite.classList.toggle(
            "deployed",

            phase ===
                "SATELLITE DEPLOYED" ||

            phase ===
                "MISSION SUCCESS"
        );

    }

}


/* ==========================================================
   SUBSYSTEMS
   ========================================================== */

function updateSubsystems() {

    const systems = [

        [
            subGuidance,
            "NOMINAL"
        ],

        [
            subPropulsion,
            fuel < 20
                ? "ATTENTION"
                : "NOMINAL"
        ],

        [
            subThermal,
            temperature > 80
                ? "ATTENTION"
                : "NOMINAL"
        ],

        [
            subAvionics,
            "NOMINAL"
        ],

        [
            subComms,
            signal < 80
                ? "ATTENTION"
                : "NOMINAL"
        ],

        [
            subPower,
            "NOMINAL"
        ]

    ];


    systems.forEach(
        ([element, value]) => {

            if (
                !element
            ) {

                return;
            }


            element.textContent =
                value;


            element.style.color =
                value ===
                    "NOMINAL"

                    ? "#00e676"

                    : "#ffb52b";

        }
    );


    setText(
        commsState,

        signal < 80

            ? "ATTENTION"

            : "NOMINAL"
    );

}


/* ==========================================================
   UPDATE EVERYTHING
   ========================================================== */

function updateAll() {

    updateTelemetry();

    updateClock();

    updateStatus();

    updatePhaseIndicator();

    updateVehicleScene();

    updateOrbitScene();

    updateSubsystems();


    const linkState =
        $("linkState");


    if (
        linkState
    ) {

        linkState.textContent =
            phase ===
                "IDLE"

                ? "STANDBY"

                : "LOCKED";
    }

}


/* ==========================================================
   RESET MISSION
   ========================================================== */

function resetMission() {

    running =
        false;


    clearInterval(
        timer
    );


    stopAllAudio();


    /*
     * Do NOT disconnect the Arduino
     * during reset.
     */

    sendArduino(
        "RESET"
    );


    phase =
        "IDLE";

    countdown =
        10;

    altitude =
        0;

    velocity =
        0;

    fuel =
        100;

    temperature =
        28;

    gLoad =
        1;

    pressure =
        101.3;

    signal =
        100;

    latency =
        38;

    packetLoss =
        0.01;

    dataRate =
        0;

    orbitSeconds =
        0;

    missionSeconds =
        0;

    eventCount =
        0;


    if (
        missionLog
    ) {

        missionLog.innerHTML =
            "";

    }


    setText(
        logCount,
        "0 EVENTS"
    );


    resetCharts();

    applyProfile();

    updateAll();


    logEvent(
        "SYSTEM",
        "Mission control initialized"
    );


    logEvent(
        "SYSTEM",
        "Telemetry link established"
    );


    logEvent(
        "SYSTEM",
        "Launch vehicle awaiting command"
    );

}


/* ==========================================================
   START MISSION
   ========================================================== */

async function startMission() {

    if (
        running
    ) {

        return;
    }


    initializeAudio();


    /*
     * The Arduino must already be connected
     * by the Launch button handler.
     */


    stopAllAudio();


    resetCharts();


    running =
        true;

    phase =
        "COUNTDOWN";

    countdown =
        10;


    altitude =
        0;

    velocity =
        0;

    fuel =
        100;

    temperature =
        28;

    gLoad =
        1;

    pressure =
        101.3;

    signal =
        100;

    latency =
        38;

    packetLoss =
        0.01;

    dataRate =
        0;

    orbitSeconds =
        0;

    missionSeconds =
        0;


    setText(
        countdownElement,
        "T−10"
    );


    logEvent(
        "FLIGHT",
        "Launch sequence initiated"
    );


    logEvent(
        "COUNTDOWN",
        "T−10"
    );


    /*
     * Physical countdown starts
     * at the same time.
     */

    await sendArduino(
        "COUNTDOWN:10"
    );


    countdownBeep();


    updateAll();


    clearInterval(
        timer
    );


    timer =
        setInterval(
            missionTick,
            1000
        );

}


/* ==========================================================
   MAIN MISSION LOOP
   ========================================================== */

async function missionTick() {

    if (
        !running
    ) {

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
            countdown >=
            1
        ) {

            setText(
                countdownElement,
                `T−${countdown}`
            );


            logEvent(
                "COUNTDOWN",
                `T−${countdown}`
            );


            /*
             * Web UI + Arduino
             * receive the same countdown value.
             */

            await sendArduino(
                `COUNTDOWN:${countdown}`
            );


            countdownBeep();


        } else {


            setText(
                countdownElement,
                "T−0"
            );


            phase =
                "IGNITION";


            await sendArduino(
                "IGNITION"
            );


            ignitionEffect();


            playVoice(
                "ignition"
            );


            logEvent(
                "ENGINE",
                "Main engine ignition"
            );

        }


        updateAll();

        return;

    }


    /* ========================================================
       IGNITION → LIFTOFF
       ======================================================== */

    if (
        phase ===
        "IGNITION"
    ) {

        phase =
            "LIFTOFF";


        await sendArduino(
            "LIFTOFF"
        );


        playVoice(
            "liftoff"
        );


        logEvent(
            "FLIGHT",
            "Vehicle clear of launch tower"
        );


        updateAll();

        return;

    }


    /* ========================================================
       LIFTOFF → ASCENT
       ======================================================== */

    if (
        phase ===
        "LIFTOFF"
    ) {

        phase =
            "ASCENT";


        logEvent(
            "FLIGHT",
            "Ascent initiated"
        );


        updateAll();

        return;

    }


    /* ========================================================
       ASCENT
       ======================================================== */

    if (
        phase ===
        "ASCENT"
    ) {


        altitude +=
            activeProfile.ascentRate +
            Math.random() * 6;


        velocity +=
            0.38 +
            Math.random() * 0.18;


        fuel -=
            1.2 +
            Math.random() * 0.45;


        temperature +=
            (
                Math.random() -
                0.3
            ) * 1.9;


        gLoad =
            1.7 +
            Math.random() * 1.4;


        pressure =
            Math.max(
                18,
                101.3 -
                altitude * 0.78
            );


        signal =
            Math.max(
                76,
                100 -
                altitude * 0.05 +
                Math.random() * 3
            );


        latency =
            38 +
            altitude * 0.05;


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


        updateTelemetry();

        updateCharts();


        if (
            altitude >=
            activeProfile.orbit
        ) {


            phase =
                "ORBIT";


            orbitSeconds =
                0;


            await sendArduino(
                "ORBIT"
            );


            playVoice(
                "orbit"
            );


            logEvent(
                "FLIGHT",
                "Stable orbital trajectory achieved"
            );

        }


        updateAll();

        return;

    }


    /* ========================================================
       ORBIT
       ======================================================== */

    if (
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
            ) * 0.02;


        fuel -=
            0.12;


        temperature +=
            (
                Math.random() -
                0.5
            ) * 0.4;


        gLoad =
            0.98 +
            Math.random() * 0.08;


        pressure =
            18 +
            Math.random() * 2;


        signal =
            92 +
            Math.random() * 6;


        latency =
            48 +
            Math.random() * 12;


        packetLoss =
            0.01 +
            Math.random() * 0.04;


        dataRate =
            4 +
            Math.random() * 5;


        logEvent(
            "ORBIT",
            `Orbital operations T+${orbitSeconds}s`
        );


        updateCharts();

        updateAll();


        if (
            orbitSeconds >=
            5
        ) {

            await deploySatellite();

        }

    }

}


/* ==========================================================
   SATELLITE DEPLOYMENT
   ========================================================== */

async function deploySatellite() {

    running =
        false;


    clearInterval(
        timer
    );


    phase =
        "SATELLITE DEPLOYED";


    await sendArduino(
        "DEPLOY"
    );


    deploymentEffect();


    playVoice(
        "deployment"
    );


    logEvent(
        "MISSION",
        "Satellite deployment successful"
    );


    updateAll();


    setTimeout(
        finishMission,
        3000
    );

}


/* ==========================================================
   MISSION SUCCESS
   ========================================================== */

async function finishMission() {

    phase =
        "MISSION SUCCESS";


    await sendArduino(
        "SUCCESS"
    );


    playVoice(
        "success"
    );


    logEvent(
        "SUCCESS",
        "Mission accomplished"
    );


    updateAll();


    /*
     * Your voice:
     * "Mission accomplished. Jai Hind!"
     *
     * Then the song starts.
     */

    setTimeout(
        playFinalSong,
        3500
    );

}


/* ==========================================================
   ABORT
   ========================================================== */

async function abortMission() {

    if (
        !running
    ) {

        return;
    }


    running =
        false;


    clearInterval(
        timer
    );


    phase =
        "ABORTED";


    await sendArduino(
        "ABORT"
    );


    stopAllAudio();


    logEvent(
        "WARNING",
        "Mission abort command received"
    );


    updateAll();

}


/* ==========================================================
   LAUNCH BUTTON
   ========================================================== */

const launchButton =
    $("launchButton");


if (
    launchButton
) {

    launchButton.addEventListener(
        "click",
        async () => {

            /*
             * The browser requires
             * requestPort() to be called
             * directly from user interaction.
             */

            if (
                !arduinoWriter
            ) {

                const connected =
                    await connectArduino();


                if (
                    !connected
                ) {

                    return;
                }

            }


            /*
             * Set the physical console
             * ready before countdown.
             */

            await sendArduino(
                "READY"
            );


            await startMission();

        }
    );

}


/* ==========================================================
   ABORT BUTTON
   ========================================================== */

const abortButton =
    $("abortButton");


if (
    abortButton
) {

    abortButton.addEventListener(
        "click",
        async () => {

            await abortMission();

        }
    );

}


/* ==========================================================
   FULLSCREEN
   ========================================================== */

const fullscreenButton =
    $("fullscreenButton");


if (
    fullscreenButton
) {

    fullscreenButton.addEventListener(
        "click",
        async () => {

            try {

                if (
                    !document.fullscreenElement
                ) {

                    await document.documentElement
                        .requestFullscreen();

                } else {

                    await document
                        .exitFullscreen();

                }

            } catch (error) {

                console.error(
                    "Fullscreen error:",
                    error
                );

            }

        }
    );

}


/* ==========================================================
   AUDIO TOGGLE
   ========================================================== */

const soundButton =
    $("soundButton");


if (
    soundButton
) {

    soundButton.addEventListener(
        "click",
        () => {

            soundEnabled =
                !soundEnabled;


            soundButton.textContent =
                soundEnabled
                    ? "AUDIO ON"
                    : "AUDIO OFF";


            if (
                !soundEnabled
            ) {

                stopAllAudio();

            }

        }
    );

}


/* ==========================================================
   RESET BUTTON
   ========================================================== */

const resetButton =
    $("resetButton");


if (
    resetButton
) {

    resetButton.addEventListener(
        "click",
        async () => {

            await sendArduino(
                "RESET"
            );


            resetMission();

        }
    );

}


/* ==========================================================
   MISSION PROFILE
   ========================================================== */

const missionSelect =
    $("missionSelect");


if (
    missionSelect
) {

    missionSelect.addEventListener(
        "change",
        () => {

            if (
                !running
            ) {

                applyProfile();

            }

        }
    );

}


/* ==========================================================
   ARDUINO DISCONNECT HANDLING
   ========================================================== */

if (
    "serial" in navigator
) {

    navigator.serial.addEventListener(
        "disconnect",
        event => {

            if (
                arduinoPort ===
                event.target
            ) {

                arduinoWriter =
                    null;

                arduinoPort =
                    null;


                logEvent(
                    "HARDWARE",
                    "Arduino UNO disconnected"
                );

            }

        }
    );

}


/* ==========================================================
   INITIALIZATION
   ========================================================== */

initializeCharts();

resetMission();
