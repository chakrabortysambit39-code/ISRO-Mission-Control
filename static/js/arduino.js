"use strict";

/*
============================================================
ISRO MISSION CONTROL
ARDUINO WEB SERIAL INTERFACE
============================================================

Arduino:
    COM3
    9600 baud

Features:
    - Arduino connection
    - Countdown synchronization
    - Mission commands
    - Physical emergency button
    - Emergency event reception
    - Physical double-click abort
============================================================
*/


let arduinoPort = null;
let arduinoWriter = null;
let arduinoReader = null;

let arduinoConnected = false;
let arduinoConnecting = false;

let lastArduinoCountdown = null;

const ARDUINO_BAUD_RATE = 9600;


// ============================================================
// LOG
// ============================================================

function arduinoLog(message) {

    console.log(
        "[ARDUINO]",
        message
    );


    if (
        typeof log === "function"
    ) {

        log(
            "ARDUINO",
            message
        );
    }
}


// ============================================================
// SEND COMMAND
// ============================================================

async function sendArduinoCommand(
    command
) {

    if (
        !arduinoConnected ||
        !arduinoWriter
    ) {

        console.log(
            "[ARDUINO OFFLINE]",
            command
        );

        return false;
    }


    try {

        const message =
            command.trim() +
            "\n";


        const data =
            new TextEncoder().encode(
                message
            );


        await arduinoWriter.write(
            data
        );


        const lastTx =
            document.getElementById(
                "arduinoLastTx"
            );


        if (lastTx) {

            lastTx.textContent =
                command;
        }


        arduinoLog(
            `TX → ${command}`
        );


        return true;

    }

    catch (error) {

        console.error(
            "Arduino TX error:",
            error
        );


        arduinoConnected =
            false;


        updateArduinoUI();


        return false;
    }
}


// ============================================================
// CONNECT
// ============================================================

async function connectArduino() {

    if (
        arduinoConnected ||
        arduinoConnecting
    ) {

        return;
    }


    if (
        !("serial" in navigator)
    ) {

        alert(
            "Web Serial is not supported.\n\n" +
            "Use Google Chrome or Microsoft Edge."
        );

        return;
    }


    arduinoConnecting =
        true;


    try {

        arduinoLog(
            "Opening serial port..."
        );


        arduinoPort =
            await navigator.serial.requestPort();


        await arduinoPort.open({

            baudRate:
                ARDUINO_BAUD_RATE

        });


        arduinoWriter =
            arduinoPort.writable.getWriter();


        arduinoConnected =
            true;


        lastArduinoCountdown =
            null;


        updateArduinoUI();


        arduinoLog(
            "ARDUINO LINK ONLINE"
        );


        /*
        Start reader BEFORE READY,
        so we don't miss ARDUINO_READY.
        */

        startArduinoReader();


        await sendArduinoCommand(
            "READY"
        );

    }

    catch (error) {

        console.error(
            "Arduino connection error:",
            error
        );


        arduinoLog(
            "Connection failed"
        );


        arduinoConnected =
            false;


        updateArduinoUI();

    }

    finally {

        arduinoConnecting =
            false;
    }
}


// ============================================================
// DISCONNECT
// ============================================================

async function disconnectArduino() {

    try {

        if (
            arduinoReader
        ) {

            try {

                await arduinoReader.cancel();

            }

            catch (_) {}

            arduinoReader =
                null;
        }


        if (
            arduinoWriter
        ) {

            try {

                arduinoWriter.releaseLock();

            }

            catch (_) {}

            arduinoWriter =
                null;
        }


        if (
            arduinoPort
        ) {

            try {

                await arduinoPort.close();

            }

            catch (_) {}

            arduinoPort =
                null;
        }

    }

    finally {

        arduinoConnected =
            false;


        updateArduinoUI();


        arduinoLog(
            "ARDUINO LINK OFFLINE"
        );
    }
}


// ============================================================
// READ ARDUINO
// ============================================================

async function startArduinoReader() {

    if (
        !arduinoPort ||
        !arduinoPort.readable
    ) {

        return;
    }


    const decoder =
        new TextDecoder();


    arduinoReader =
        arduinoPort
            .readable
            .getReader();


    let buffer = "";


    try {

        while (
            arduinoConnected
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


            buffer +=
                decoder.decode(
                    value,
                    {
                        stream: true
                    }
                );


            const lines =
                buffer.split(
                    "\n"
                );


            buffer =
                lines.pop();


            for (
                const line of lines
            ) {

                const message =
                    line.trim();


                if (!message) {
                    continue;
                }


                arduinoLog(
                    `RX ← ${message}`
                );


                handleArduinoResponse(
                    message
                );
            }
        }

    }

    catch (error) {

        console.error(
            "Arduino reader error:",
            error
        );

    }

    finally {

        try {

            arduinoReader.releaseLock();

        }

        catch (_) {}

        arduinoReader =
            null;
    }
}


// ============================================================
// ARDUINO RESPONSE HANDLER
// ============================================================

function handleArduinoResponse(
    message
) {

    /*
    Physical button:
        EVENT:EMERGENCY:PHYSICAL_BUTTON
    */

    if (
        message.startsWith(
            "EVENT:EMERGENCY:"
        )
    ) {

        const source =
            message.substring(
                "EVENT:EMERGENCY:"
                    .length
            );


        if (
            typeof triggerEmergency ===
            "function"
        ) {

            triggerEmergency(
                "Physical emergency button activated."
            );
        }


        return;
    }


    /*
    Physical double click:
        EVENT:ABORT:PHYSICAL_DOUBLE_PRESS
    */

    if (
        message.startsWith(
            "EVENT:ABORT:"
        )
    ) {

        if (
            typeof abortFromEmergency ===
            "function"
        ) {

            abortFromEmergency();

        }

        else if (
            typeof abortMission ===
            "function"
        ) {

            abortMission();
        }


        return;
    }


    if (
        message ===
        "EMERGENCY_ALARM_ACTIVE"
    ) {

        if (
            typeof showEmergencyAlarm ===
            "function"
        ) {

            showEmergencyAlarm(
                "Arduino emergency alarm active."
            );
        }
    }


    if (
        message ===
        "ABORT_OK"
    ) {

        if (
            typeof showEmergencyCleared ===
            "function"
        ) {

            showEmergencyCleared();
        }
    }
}


// ============================================================
// COUNTDOWN SYNC
// ============================================================

function syncArduinoCountdown(
    countdownText
) {

    if (
        !arduinoConnected
    ) {

        return;
    }


    if (
        !countdownText
    ) {

        return;
    }


    /*
    Supports:

        T−10
        T-10
        T−9
        T-9
    */


    const match =
        countdownText.match(
            /T[−-](\d+)/
        );


    if (!match) {

        return;
    }


    const number =
        Number(
            match[1]
        );


    if (
        Number.isNaN(number)
    ) {

        return;
    }


    /*
    Don't send the same countdown
    number repeatedly.
    */

    if (
        number ===
        lastArduinoCountdown
    ) {

        return;
    }


    lastArduinoCountdown =
        number;


    sendArduinoCommand(
        `COUNTDOWN:${number}`
    );
}


// ============================================================
// WATCH COUNTDOWN
// ============================================================

function watchArduinoCountdown() {

    const countdown =
        document.getElementById(
            "countdown"
        );


    if (!countdown) {

        setTimeout(
            watchArduinoCountdown,
            500
        );

        return;
    }


    /*
    Send the current value immediately.
    */

    syncArduinoCountdown(
        countdown.textContent.trim()
    );


    /*
    MutationObserver catches changes
    immediately.
    */

    const observer =
        new MutationObserver(
            () => {

                syncArduinoCountdown(
                    countdown.textContent.trim()
                );
            }
        );


    observer.observe(
        countdown,
        {
            childList: true,
            characterData: true,
            subtree: true
        }
    );


    /*
    Backup polling.
    */

    setInterval(
        () => {

            syncArduinoCountdown(
                countdown.textContent.trim()
            );

        },
        100
    );
}


// ============================================================
// WATCH FLIGHT PHASE
// ============================================================

function watchArduinoPhase() {

    const phaseElement =
        document.getElementById(
            "phase"
        );


    if (!phaseElement) {

        setTimeout(
            watchArduinoPhase,
            500
        );

        return;
    }


    let previousPhase =
        phaseElement.textContent.trim();


    const observer =
        new MutationObserver(
            () => {

                const currentPhase =
                    phaseElement
                        .textContent
                        .trim();


                if (
                    currentPhase ===
                    previousPhase
                ) {

                    return;
                }


                previousPhase =
                    currentPhase;


                sendPhaseToArduino(
                    currentPhase
                );
            }
        );


    observer.observe(
        phaseElement,
        {
            childList: true,
            characterData: true,
            subtree: true
        }
    );
}


// ============================================================
// PHASE COMMANDS
// ============================================================

function sendPhaseToArduino(
    phaseName
) {

    if (
        !arduinoConnected
    ) {

        return;
    }


    switch (
        phaseName
    ) {

        case "PRE-LAUNCH":

            sendArduinoCommand(
                "READY"
            );

            break;


        case "IGNITION":

            sendArduinoCommand(
                "IGNITION"
            );

            break;


        case "LIFTOFF":

            sendArduinoCommand(
                "LIFTOFF"
            );

            break;


        case "ASCENT":

            sendArduinoCommand(
                "ASCENT"
            );

            break;


        case "ORBIT":

            sendArduinoCommand(
                "ORBIT"
            );

            break;


        case "SATELLITE DEPLOYED":

            sendArduinoCommand(
                "DEPLOY"
            );

            break;


        case "MISSION SUCCESS":

            sendArduinoCommand(
                "SUCCESS"
            );

            break;


        case "ABORTED":

            sendArduinoCommand(
                "ABORT"
            );

            break;
    }
}


// ============================================================
// UI
// ============================================================

function updateArduinoUI() {

    const status =
        document.getElementById(
            "arduinoStatus"
        );


    const connect =
        document.getElementById(
            "arduinoConnectButton"
        );


    const disconnect =
        document.getElementById(
            "arduinoDisconnectButton"
        );


    const test =
        document.getElementById(
            "arduinoTestButton"
        );


    const port =
        document.getElementById(
            "arduinoPort"
        );


    const link =
        document.getElementById(
            "arduinoLink"
        );


    if (!status) {
        return;
    }


    if (
        arduinoConnected
    ) {

        status.textContent =
            "ARDUINO ONLINE";


        status.className =
            "arduino-status online";


        if (connect) {
            connect.disabled =
                true;
        }


        if (disconnect) {
            disconnect.disabled =
                false;
        }


        if (test) {
            test.disabled =
                false;
        }


        if (port) {
            port.textContent =
                "COM3";
        }


        if (link) {
            link.textContent =
                "ONLINE";
        }

    }

    else {

        status.textContent =
            "ARDUINO OFFLINE";


        status.className =
            "arduino-status offline";


        if (connect) {
            connect.disabled =
                false;
        }


        if (disconnect) {
            disconnect.disabled =
                true;
        }


        if (test) {
            test.disabled =
                true;
        }


        if (port) {
            port.textContent =
                "NOT CONNECTED";
        }


        if (link) {
            link.textContent =
                "OFFLINE";
        }
    }
}


// ============================================================
// CREATE ARDUINO PANEL
// ============================================================

function createArduinoPanel() {

    if (
        document.getElementById(
            "arduinoPanel"
        )
    ) {

        return;
    }


    const panel =
        document.createElement(
            "section"
        );


    panel.id =
        "arduinoPanel";


    panel.className =
        "panel arduino-panel";


    panel.innerHTML = `

        <div class="panel-heading">

            <div>

                <span class="label">
                    HARDWARE INTERFACE
                </span>

                <h2>
                    ARDUINO MISSION LINK
                </h2>

            </div>


            <div
                id="arduinoStatus"
                class="arduino-status offline"
            >
                ARDUINO OFFLINE
            </div>

        </div>


        <div class="arduino-controls">

            <button
                id="arduinoConnectButton"
                class="normal-button"
            >
                CONNECT ARDUINO
            </button>


            <button
                id="arduinoDisconnectButton"
                class="normal-button"
                disabled
            >
                DISCONNECT
            </button>


            <button
                id="arduinoTestButton"
                class="normal-button"
                disabled
            >
                TEST READY
            </button>

        </div>


        <div class="arduino-info">

            <div>

                <span>
                    PORT
                </span>

                <strong id="arduinoPort">
                    NOT CONNECTED
                </strong>

            </div>


            <div>

                <span>
                    BAUD
                </span>

                <strong>
                    9600
                </strong>

            </div>


            <div>

                <span>
                    LINK
                </span>

                <strong id="arduinoLink">
                    OFFLINE
                </strong>

            </div>


            <div>

                <span>
                    LAST TX
                </span>

                <strong id="arduinoLastTx">
                    --
                </strong>

            </div>

        </div>
    `;


    const app =
        document.querySelector(
            ".app"
        ) ||
        document.body;


    app.appendChild(
        panel
    );


    document
        .getElementById(
            "arduinoConnectButton"
        )
        .addEventListener(
            "click",
            connectArduino
        );


    document
        .getElementById(
            "arduinoDisconnectButton"
        )
        .addEventListener(
            "click",
            disconnectArduino
        );


    document
        .getElementById(
            "arduinoTestButton"
        )
        .addEventListener(
            "click",
            () =>
                sendArduinoCommand(
                    "READY"
                )
        );


    updateArduinoUI();
}


// ============================================================
// INITIALIZE
// ============================================================

function initArduinoIntegration() {

    createArduinoPanel();

    watchArduinoCountdown();

    watchArduinoPhase();


    arduinoLog(
        "Arduino integration initialized"
    );
}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initArduinoIntegration
    );

}

else {

    initArduinoIntegration();
}


// ============================================================
// USB DISCONNECT
// ============================================================

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

                arduinoConnected =
                    false;


                arduinoPort =
                    null;


                arduinoWriter =
                    null;


                updateArduinoUI();


                arduinoLog(
                    "Arduino USB disconnected"
                );
            }
        }
    );
}