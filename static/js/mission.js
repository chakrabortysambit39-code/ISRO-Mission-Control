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
   AUDIO SYSTEM
   ========================================================== */

let audioContext = null;

let finalSong = null;


/* ==========================================================
   ELEMENTS
   ========================================================== */

const countdownElement =
    document.getElementById("countdown");

const flightStatus =
    document.getElementById("flightStatus");

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

const rocket =
    document.getElementById("rocket");

const missionTime =
    document.getElementById("missionTime");


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
            0.25,
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

        oscillator.connect(gain);

        gain.connect(
            audioContext.destination
        );

        oscillator.start();

        oscillator.stop(
            audioContext.currentTime + 0.95
        );

    } catch (error) {

        console.log(
            "Ignition sound error:",
            error
        );
    }
}


/* ==========================================================
   SATELLITE DEPLOYMENT SOUND
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

        oscillator.connect(gain);

        gain.connect(
            audioContext.destination
        );

        oscillator.start();

        oscillator.stop(
            audioContext.currentTime + 0.75
        );

    } catch (error) {

        console.log(
            "Deployment sound error:",
            error
        );
    }
}


/* ==========================================================
   LOAD SONG
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


/* ==========================================================
   PLAY SONG
   ========================================================== */

function playFinalSong() {

    prepareSong();

    if (!finalSong) {
        return;
    }

    finalSong.currentTime = 0;

    const result =
        finalSong.play();

    if (result !== undefined) {

        result.catch(
            error => {

                console.log(
                    "Song playback was blocked:",
                    error
                );

                log(
                    "AUDIO",
                    "Click LAUNCH first to enable audio playback."
                );
            }
        );
    }

    log(
        "AUDIO",
        "MAA TUJHE SALAAM PLAYBACK STARTED"
    );
}


/* ==========================================================
   STOP SONG
   ========================================================== */

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
   START MISSION
   ========================================================== */

function launchMission() {

    if (running) {
        return;
    }

    /*
     * IMPORTANT:
     * The Launch button is a user interaction,
     * so the browser allows us to start audio here.
     */

    initializeAudio();

    prepareSong();

    running = true;

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

    rocket.classList.remove(
        "launching"
    );

    log(
        "FLIGHT",
        "LAUNCH SEQUENCE INITIATED"
    );

    log(
        "COUNTDOWN",
        "T−10"
    );

    /* First electronic beep */
    countdownBeep();

    updateTelemetry();

    updateMissionClock();

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

            /*
             * EXACTLY ONE ELECTRONIC BEEP
             * PER COUNTDOWN NUMBER
             */

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

        rocket.classList.add(
            "launching"
        );

        log(
            "FLIGHT",
            "VEHICLE HAS CLEARED LAUNCH TOWER"
        );

        speak(
            "Liftoff confirmed."
        );

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

        /*
         * Satellite deployment after 5 seconds
         */

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

    running =
        false;

    clearInterval(timer);

    phase =
        "SATELLITE_DEPLOYED";

    rocket.classList.remove(
        "launching"
    );

    flightStatus.textContent =
        "SATELLITE DEPLOYED";

    log(
        "MISSION",
        "SATELLITE DEPLOYMENT SUCCESSFUL"
    );

    deploymentSound();

    speak(
        "Satellite deployed successfully."
    );

    /*
     * Wait for announcement before final message.
     */

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

    /*
     * Phonetic spelling gives the browser voice
     * a clearer Indian-style pronunciation.
     */

    speak(
        "Mission accomplished. Jai Heend!"
    );

    /*
     * Start the song after the announcement.
     */

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

    rocket.classList.remove(
        "launching"
    );

    stopFinalSong();

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

    /*
     * Cancel anything currently speaking
     * so announcements don't pile up.
     */

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

    /*
     * Try to select an English voice.
     */

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

updateTelemetry();

updateMissionClock();

prepareSong();


/*
 * Some browsers populate their voice list asynchronously.
 */

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