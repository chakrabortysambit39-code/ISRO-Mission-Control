"use strict";

/*
============================================================
ISRO MISSION CONTROL
SAFETY / EMERGENCY HANDLER
============================================================
Arduino emergency button:
    Single press  -> Emergency alarm
    Double press  -> Mission abort

IMPORTANT:
Do NOT access mission.js private variables such as:
    phase
    running
    timer

Use the public window hooks instead.
============================================================
*/


function currentMissionPhase() {

    if (
        typeof window.missionPhase === "string"
    ) {
        return window.missionPhase;
    }

    return "UNKNOWN";
}


function safetyLog(message) {

    console.warn(message);

    const box =
        document.getElementById(
            "missionLog"
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


/*
============================================================
EMERGENCY ALARM
============================================================
*/

function startEmergencyAlarm(
    source = "ARDUINO"
) {

    window.missionEmergencyActive =
        true;


    safetyLog(
        `[SAFETY] 🚨 EMERGENCY ALARM ACTIVE — ${source}`
    );


    /*
    Visual emergency state
    */

    document.body.classList.add(
        "emergency-active"
    );


    const status =
        document.getElementById(
            "flightStatus"
        );


    if (status) {

        status.textContent =
            "🚨 EMERGENCY ALARM";
    }


    /*
    Hardware alarm indication
    */

    const buzzer =
        document.getElementById(
            "buzzerStatus"
        );


    if (buzzer) {

        buzzer.textContent =
            "ACTIVE";
    }


    /*
    Tell Arduino to activate alarm
    */

    if (
        typeof window.sendArduino ===
        "function"
    ) {

        window.sendArduino(
            "EMERGENCY"
        ).catch(
            () => {}
        );
    }


    /*
    Play browser emergency tone.
    */

    try {

        const ctx =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();


        const osc =
            ctx.createOscillator();


        const gain =
            ctx.createGain();


        osc.type =
            "square";


        osc.frequency.value =
            700;


        gain.gain.value =
            0.12;


        osc.connect(
            gain
        );


        gain.connect(
            ctx.destination
        );


        osc.start();


        setTimeout(
            () => {

                try {

                    osc.stop();

                    ctx.close();

                } catch (_) {}

            },
            700
        );

    } catch (_) {}
}


/*
============================================================
ABORT MISSION
============================================================
*/

function abortFromEmergency(
    source = "ARDUINO_EMERGENCY"
) {

    const phaseAtAbort =
        currentMissionPhase();


    safetyLog(
        `[SAFETY] 🛑 EMERGENCY ABORT received during ${phaseAtAbort}`
    );


    window.missionEmergencyActive =
        false;


    document.body.classList.remove(
        "emergency-active"
    );


    const buzzer =
        document.getElementById(
            "buzzerStatus"
        );


    if (buzzer) {

        buzzer.textContent =
            "OFF";
    }


    /*
    CRITICAL:
    Do NOT do:

        phase = "ABORTED"

    because phase belongs privately to
    mission.js.

    Instead call the public mission
    controller.
    */

    if (
        typeof window.abortMission ===
        "function"
    ) {

        window.abortMission(
            `PHYSICAL_${source}`
        );

    } else {

        safetyLog(
            "[SAFETY] ERROR: mission abort handler unavailable"
        );
    }
}


/*
============================================================
ARDUINO EVENT HANDLER
============================================================
*/

function handleSafetyArduinoEvent(
    line
) {

    if (!line) return;


    const upper =
        String(line)
            .trim()
            .toUpperCase();


    /*
    Physical emergency button
    */

    if (
        upper.startsWith(
            "EVENT:EMERGENCY"
        )
    ) {

        startEmergencyAlarm(
            "PHYSICAL BUTTON"
        );

        return true;
    }


    /*
    Physical double-click abort
    */

    if (
        upper.startsWith(
            "EVENT:ABORT"
        )
    ) {

        abortFromEmergency(
            line
        );

        return true;
    }


    return false;
}


/*
============================================================
GLOBAL SAFETY HOOKS
============================================================
*/

window.currentMissionPhase =
    currentMissionPhase;


window.startEmergencyAlarm =
    startEmergencyAlarm;


window.abortFromEmergency =
    abortFromEmergency;


window.handleSafetyArduinoEvent =
    handleSafetyArduinoEvent;


safetyLog(
    "[SAFETY] Safety system initialized"
);