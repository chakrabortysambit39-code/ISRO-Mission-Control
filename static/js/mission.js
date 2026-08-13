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

let chartLabels = [];

let altitudeData = [];

let velocityData = [];

let fuelData = [];

let altitudeChart = null;

let velocityChart = null;

let fuelChart = null;


/* ==========================================================
   ELEMENTS
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

const missionLog =
    document.getElementById("missionLog");

const missionTime =
    document.getElementById("missionTime");

const graphStatus =
    document.getElementById("graphStatus");


/* ==========================================================
   SPACE ELEMENTS
   ========================================================== */

const spaceRocket =
    document.getElementById(
        "spaceRocket"
    );

const satellite =
    document.getElementById(
        "satellite"
    );

const orbitPath =
    document.getElementById(
        "orbitPath"
    );

const orbitStatus =
    document.getElementById(
        "orbitStatus"
    );

const spaceAltitude =
    document.getElementById(
        "spaceAltitude"
    );


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

                borderWidth:
                    1,

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
                        "rgba(60, 90, 120, 0.12)"
                },

                ticks: {
                    color:
                        "#52667e",

                    font: {
                        size: 8
                    },

                    maxTicksLimit:
                        8
                }
            },

            y: {

                beginAtZero:
                    true,

                grid: {
                    color:
                        "rgba(60, 90, 120, 0.12)"
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


    altitudeChart =
        new Chart(
            document.getElementById(
                "altitudeChart"
            ),
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

                            borderWidth:
                                2,

                            pointRadius:
                                0,

                            fill:
                                true,

                            tension:
                                0.25
                        }

                    ]
                },

                options:
                    commonOptions
            }
        );


    velocityChart =
        new Chart(
            document.getElementById(
                "velocityChart"
            ),
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

                            borderWidth:
                                2,

                            pointRadius:
                                0,

                            fill:
                                true,

                            tension:
                                0.25
                        }

                    ]
                },

                options:
                    commonOptions
            }
        );


    fuelChart =
        new Chart(
            document.getElementById(
                "fuelChart"
            ),
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

                            borderWidth:
                                2,

                            pointRadius:
                                0,

                            fill:
                                true,

                            tension:
                                0.2
                        }

                    ]
                },

                options:
                    {

                        ...commonOptions,

                        scales: {

                            ...commonOptions.scales,

                            y: {

                                ...commonOptions.scales.y,

                                min:
                                    0,

                                max:
                                    100
                            }
                        }
                    }
            }
        );
}


/* ==========================================================
   RESET CHARTS
   ========================================================== */

function resetCharts() {

    chartLabels.length = 0;

    altitudeData.length = 0;

    velocityData.length = 0;

    fuelData.length = 0;

    if (
        altitudeChart
    ) {

        altitudeChart.update(
            "none"
        );
    }

    if (
        velocityChart
    ) {

        velocityChart.update(
            "none"
        );
    }

    if (
        fuelChart
    ) {

        fuelChart.update(
            "none"
        );
    }

    graphStatus.textContent =
        "STANDBY";

    graphStatus.classList.remove(
        "active"
    );
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
     * Keep the charts readable.
     * Maximum 90 points.
     */

    if (
        chartLabels.length > 90
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


    graphStatus.textContent =
        "LIVE";

    graphStatus.classList.add(
        "active"
    );
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
            audioContext.state ===
            "suspended"
        ) {

            audioContext.resume();
        }

    } catch (error) {

        console.log(
            "Audio initialization error:",
            error
        );
    }
}


/* ==========================================================
   COUNTDOWN BEEP
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
            0.25,
            audioContext.currentTime + 0.01
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            audioContext.currentTime + 0.12
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
            0.13
        );

    } catch (error) {

        console.log(
            "Countdown sound error:",
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
            250,
            audioContext.currentTime
        );

        oscillator.frequency.exponentialRampToValueAtTime(
            1000,
            audioContext.currentTime + 0.8
        );

        gain.gain.setValueAtTime(
            0.0001,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.35,
            audioContext.currentTime + 0.05
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            audioContext.currentTime + 0.9
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
            0.95
        );

    } catch (error) {

        console.log(
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
            500,
            audioContext.currentTime
        );

        oscillator.frequency.exponentialRampToValueAtTime(
            1400,
            audioContext.currentTime + 0.6
        );

        gain.gain.setValueAtTime(
            0.0001,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.25,
            audioContext.currentTime + 0.05
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            audioContext.currentTime + 0.7
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
            0.75
        );

    } catch (error) {

        console.log(
            "Deployment sound error:",
            error
        );
    }
}


/* ==========================================================
   SONG
   ========================================================== */

function prepareSong() {

    if (!finalSong) {

        finalSong =
            new Audio(
                "/static/assets/maa_tujhe_salaam.mp3"
            );

        finalSong.preload =
            "auto";

        finalSong.volume =
            1.0;
    }
}

function playFinalSong() {

    prepareSong();

    if (!finalSong) {
        return;
    }

    finalSong.currentTime =
        0;

    const result =
        finalSong.play();

    if (
        result !== undefined
    ) {

        result.catch(
            error => {

                console.log(
                    "Song playback blocked:",
                    error
                );

                log(
                    "AUDIO",
                    "Song playback was blocked."
                );
            }
        );
    }

    log(
        "AUDIO",
        "MAA TUJHE SALAAM PLAYBACK STARTED"
    );
}

function stopFinalSong() {

    if (!finalSong) {
        return;
    }

    finalSong.pause();

    finalSong.currentTime =
        0;
}


/* ==========================================================
   LOG
   ========================================================== */

function log(
    source,
    message
) {

    const line =
        document.createElement(
            "div"
        );

    line.textContent =
        `[${source}] ${message}`;

    missionLog.appendChild(
        line
    );

    missionLog.scrollTop =
        missionLog.scrollHeight;
}


/* ==========================================================
   TELEMETRY
   ========================================================== */

function updateTelemetry() {

    altitudeElement.textContent =
        altitude.toFixed(1);

    velocityElement.textContent =
        velocity.toFixed(2);

    fuelElement.textContent =
        fuel.toFixed(1);

    temperatureElement.textContent =
        temperature.toFixed(1);

    fuelBar.style.width =
        `${Math.max(0, fuel)}%`;

    fuelPercent.textContent =
        `${Math.max(0, fuel).toFixed(0)}%`;
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

    missionTime.textContent =
        `T+ ${String(hours).padStart(2, "0")}:` +
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`;
}


/* ==========================================================
   SPACE SCENE
   ========================================================== */

function updateSpaceScene() {

    if (!spaceRocket) {
        return;
    }

    spaceAltitude.textContent =
        `ALT ${altitude.toFixed(1)} KM`;


    if (
        phase ===
        "COUNTDOWN"
    ) {

        orbitStatus.textContent =
            "GROUND";

        spaceRocket.className =
            "space-rocket";

        spaceRocket.style.left =
            "50%";

        spaceRocket.style.top =
            "80%";

        satellite.className =
            "satellite";

        orbitPath.classList.remove(
            "active"
        );

        return;
    }


    if (
        phase === "IGNITION"
    ) {

        orbitStatus.textContent =
            "IGNITION";

        spaceRocket.className =
            "space-rocket visible ascent";

        spaceRocket.style.left =
            "50%";

        spaceRocket.style.top =
            "75%";

        return;
    }


    if (
        phase === "LIFTOFF"
    ) {

        orbitStatus.textContent =
            "LIFTOFF";

        spaceRocket.className =
            "space-rocket visible ascent";

        spaceRocket.style.left =
            "50%";

        spaceRocket.style.top =
            "66%";

        return;
    }


    if (
        phase === "ASCENT"
    ) {

        orbitStatus.textContent =
            "ASCENT";

        const progress =
            Math.min(
                altitude / 100,
                1
            );

        const rocketTop =
            66 -
            progress * 45;

        const rocketLeft =
            50 +
            progress * 10;

        spaceRocket.className =
            "space-rocket visible ascent";

        spaceRocket.style.left =
            `${rocketLeft}%`;

        spaceRocket.style.top =
            `${rocketTop}%`;

        return;
    }


    if (
        phase === "ORBIT"
    ) {

        orbitStatus.textContent =
            "ORBIT";

        orbitPath.classList.add(
            "active"
        );

        spaceRocket.className =
            "space-rocket visible orbiting";

        spaceRocket.style.left =
            "50%";

        spaceRocket.style.top =
            "53%";

        satellite.className =
            "satellite";

        return;
    }


    if (
        phase ===
        "SATELLITE_DEPLOYED"
    ) {

        orbitStatus.textContent =
            "DEPLOYED";

        orbitPath.classList.add(
            "active"
        );

        spaceRocket.className =
            "space-rocket visible orbiting";

        satellite.className =
            "satellite deployed";

        return;
    }


    if (
        phase ===
        "MISSION_SUCCESS"
    ) {

        orbitStatus.textContent =
            "MISSION COMPLETE";

        orbitPath.classList.add(
            "active"
        );

        spaceRocket.className =
            "space-rocket visible orbiting";

        satellite.className =
            "satellite deployed";

        return;
    }


    if (
        phase ===
        "ABORTED"
    ) {

        orbitStatus.textContent =
            "ABORT";

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
   UPDATE PHASE LABEL
   ========================================================== */

function updatePhaseIndicator() {

    const phaseNames = {

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

    phaseIndicator.textContent =
        phaseNames[phase] ||
        phase;
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

    orbitSeconds =
        0;

    missionSeconds =
        0;

    countdownElement.textContent =
        "T−10";

    flightStatus.textContent =
        "COUNTDOWN INITIATED";

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

    updateSpaceScene();

    updatePhaseIndicator();

    clearInterval(timer);

    timer =
        setInterval(
            missionTick,
            1000
        );
}


/* ==========================================================
   MISSION LOOP
   ========================================================== */

function missionTick() {

    missionSeconds++;

    updateMissionClock();


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

            countdownElement.textContent =
                `T−${countdown}`;

            log(
                "COUNTDOWN",
                `T−${countdown}`
            );

            countdownBeep();

        } else {

            countdownElement.textContent =
                "T−0";

            phase =
                "IGNITION";

            flightStatus.textContent =
                "ENGINE IGNITION";

            log(
                "ENGINE",
                "T−0 — MAIN ENGINE IGNITION"
            );

            ignitionSound();

            speak(
                "Ignition."
            );
        }

        updateSpaceScene();

        updatePhaseIndicator();

        return;
    }


    /* ========================================================
       IGNITION
       ======================================================== */

    if (
        phase ===
        "IGNITION"
    ) {

        phase =
            "LIFTOFF";

        flightStatus.textContent =
            "LIFTOFF CONFIRMED";

        log(
            "FLIGHT",
            "VEHICLE HAS CLEARED LAUNCH TOWER"
        );

        speak(
            "Liftoff confirmed."
        );

        updateSpaceScene();

        updatePhaseIndicator();

        return;
    }


    /* ========================================================
       LIFTOFF
       ======================================================== */

    if (
        phase ===
        "LIFTOFF"
    ) {

        phase =
            "ASCENT";

        flightStatus.textContent =
            "ASCENT";

        log(
            "FLIGHT",
            "VEHICLE ASCENDING"
        );

        updateSpaceScene();

        updatePhaseIndicator();

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

        if (
            altitude >= 100
        ) {

            phase =
                "ORBIT";

            orbitSeconds =
                0;

            flightStatus.textContent =
                "ORBIT INSERTION";

            log(
                "FLIGHT",
                "STABLE ORBITAL TRAJECTORY ACHIEVED"
            );

            speak(
                "Orbit insertion confirmed."
            );
        }

        updateCharts();

        updateSpaceScene();

        updatePhaseIndicator();

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
            (Math.random() - 0.5) * 2;

        velocity +=
            (Math.random() - 0.5) * 0.03;

        fuel -=
            0.15;

        temperature +=
            (Math.random() - 0.5) * 0.5;

        updateTelemetry();

        log(
            "ORBIT",
            `ORBITAL OPERATIONS T+${orbitSeconds}s`
        );

        updateCharts();

        updateSpaceScene();

        updatePhaseIndicator();

        if (
            orbitSeconds >= 5
        ) {

            deploySatellite();
        }

        return;
    }

    updateSpaceScene();

    updatePhaseIndicator();
}


/* ==========================================================
   SATELLITE DEPLOYMENT
   ========================================================== */

function deploySatellite() {

    running =
        false;

    clearInterval(timer);

    phase =
        "SATELLITE_DEPLOYED";

    flightStatus.textContent =
        "SATELLITE DEPLOYED";

    log(
        "MISSION",
        "SATELLITE DEPLOYMENT SUCCESSFUL"
    );

    deploymentSound();

    updateSpaceScene();

    updatePhaseIndicator();

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

    flightStatus.textContent =
        "MISSION SUCCESS";

    log(
        "SUCCESS",
        "MISSION ACCOMPLISHED"
    );

    updateSpaceScene();

    updatePhaseIndicator();

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

    running =
        false;

    clearInterval(timer);

    phase =
        "ABORTED";

    flightStatus.textContent =
        "MISSION ABORTED";

    stopFinalSong();

    updateSpaceScene();

    updatePhaseIndicator();

    graphStatus.textContent =
        "ABORTED";

    graphStatus.classList.remove(
        "active"
    );

    if (
        "speechSynthesis"
        in window
    ) {

        window.speechSynthesis.cancel();
    }

    log(
        "WARNING",
        "MISSION ABORT COMMAND RECEIVED"
    );
}


/* ==========================================================
   BROWSER VOICE
   ========================================================== */

function speak(text) {

    if (
        !(
            "speechSynthesis"
            in window
        )
    ) {

        return;
    }

    window.speechSynthesis.cancel();

    const speech =
        new SpeechSynthesisUtterance(
            text
        );

    speech.rate =
        0.9;

    speech.pitch =
        0.95;

    speech.volume =
        1.0;

    const voices =
        window.speechSynthesis
            .getVoices();

    const preferredVoice =
        voices.find(
            voice =>
                voice.lang ===
                "en-IN"
        ) ||
        voices.find(
            voice =>
                voice.lang.startsWith(
                    "en"
                )
        );

    if (
        preferredVoice
    ) {

        speech.voice =
            preferredVoice;
    }

    window.speechSynthesis.speak(
        speech
    );
}


/* ==========================================================
   BUTTONS
   ========================================================== */

document
    .getElementById(
        "launchButton"
    )
    .addEventListener(
        "click",
        launchMission
    );


document
    .getElementById(
        "abortButton"
    )
    .addEventListener(
        "click",
        abortMission
    );


document
    .getElementById(
        "fullscreenButton"
    )
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


/* ==========================================================
   INITIALIZATION
   ========================================================== */

initializeCharts();

updateTelemetry();

updateMissionClock();

updateSpaceScene();

updatePhaseIndicator();

prepareSong();


if (
    "speechSynthesis"
    in window
) {

    window.speechSynthesis
        .onvoiceschanged = () => {

            window.speechSynthesis
                .getVoices();

        };
}