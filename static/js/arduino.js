"use strict";

/*
============================================================
ISRO MISSION CONTROL
ARDUINO WEB SERIAL INTERFACE
============================================================

Browser:
    Google Chrome / Microsoft Edge

Connection:
    USB Serial

Arduino:
    COM3 (selected by browser)
    9600 baud

This file intentionally does NOT replace mission.js.
It connects to the existing Mission Control simulation.
============================================================
*/

let arduinoPort = null;
let arduinoWriter = null;
let arduinoReader = null;

let arduinoConnected = false;
let arduinoConnecting = false;

let arduinoLastPhase = null;

const ARDUINO_BAUD_RATE = 9600;


// ============================================================
// UTILITY
// ============================================================

function arduinoLog(message) {

    console.log("[ARDUINO]", message);

    const logBox =
        document.getElementById("missionLog") ||
        document.getElementById("consoleHistory");

    if (!logBox) return;

    const row = document.createElement("div");

    row.textContent = `[ARDUINO] ${message}`;

    logBox.appendChild(row);

    logBox.scrollTop = logBox.scrollHeight;
}


// ============================================================
// CREATE UI
// ============================================================

function createArduinoPanel() {

    if (document.getElementById("arduinoPanel")) {
        return;
    }

    const panel = document.createElement("section");

    panel.id = "arduinoPanel";

    panel.innerHTML = `
        <div class="arduino-header">
            <div>
                <span class="arduino-label">
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
                type="button"
            >
                CONNECT ARDUINO
            </button>

            <button
                id="arduinoDisconnectButton"
                type="button"
                disabled
            >
                DISCONNECT
            </button>

            <button
                id="arduinoTestButton"
                type="button"
                disabled
            >
                TEST READY
            </button>

        </div>

        <div class="arduino-info">

            <div>
                <span>PORT</span>
                <strong id="arduinoPort">
                    NOT CONNECTED
                </strong>
            </div>

            <div>
                <span>BAUD</span>
                <strong>
                    9600
                </strong>
            </div>

            <div>
                <span>LINK</span>
                <strong id="arduinoLink">
                    OFFLINE
                </strong>
            </div>

            <div>
                <span>LAST TX</span>
                <strong id="arduinoLastTx">
                    --
                </strong>
            </div>

        </div>
    `;

    const app =
        document.querySelector(".app") ||
        document.body;

    app.appendChild(panel);

    document
        .getElementById("arduinoConnectButton")
        .addEventListener(
            "click",
            connectArduino
        );

    document
        .getElementById("arduinoDisconnectButton")
        .addEventListener(
            "click",
            disconnectArduino
        );

    document
        .getElementById("arduinoTestButton")
        .addEventListener(
            "click",
            () => sendArduinoCommand("READY")
        );
}


// ============================================================
// STATUS
// ============================================================

function updateArduinoUI() {

    const status =
        document.getElementById("arduinoStatus");

    const connectButton =
        document.getElementById(
            "arduinoConnectButton"
        );

    const disconnectButton =
        document.getElementById(
            "arduinoDisconnectButton"
        );

    const testButton =
        document.getElementById(
            "arduinoTestButton"
        );

    const link =
        document.getElementById("arduinoLink");

    const port =
        document.getElementById("arduinoPort");

    if (!status) return;


    if (arduinoConnected) {

        status.textContent =
            "ARDUINO ONLINE";

        status.className =
            "arduino-status online";

        if (connectButton) {
            connectButton.disabled = true;
        }

        if (disconnectButton) {
            disconnectButton.disabled = false;
        }

        if (testButton) {
            testButton.disabled = false;
        }

        if (link) {
            link.textContent =
                "ONLINE";
        }

        if (
            port &&
            arduinoPort
        ) {

            port.textContent =
                "USB SERIAL";
        }

    }

    else {

        status.textContent =
            "ARDUINO OFFLINE";

        status.className =
            "arduino-status offline";

        if (connectButton) {
            connectButton.disabled = false;
        }

        if (disconnectButton) {
            disconnectButton.disabled = true;
        }

        if (testButton) {
            testButton.disabled = true;
        }

        if (link) {
            link.textContent =
                "OFFLINE";
        }

        if (port) {
            port.textContent =
                "NOT CONNECTED";
        }
    }
}


// ============================================================
// CONNECT
// ============================================================

async function connectArduino() {

    if (arduinoConnected) {
        return;
    }

    if (arduinoConnecting) {
        return;
    }

    if (!("serial" in navigator)) {

        alert(
            "Web Serial is not supported by this browser.\n\n" +
            "Please use Google Chrome or Microsoft Edge."
        );

        return;
    }


    arduinoConnecting = true;


    try {

        arduinoLog(
            "Opening USB serial port..."
        );


        /*
        IMPORTANT:
        Chrome will show the available
        serial ports.

        Select your Arduino UNO.
        Your Arduino is currently COM3.
        */


        arduinoPort =
            await navigator.serial.requestPort();


        await arduinoPort.open({
            baudRate:
                ARDUINO_BAUD_RATE
        });


        arduinoWriter =
            arduinoPort.writable.getWriter();


        arduinoConnected = true;


        updateArduinoUI();


        arduinoLog(
            "USB serial connection established"
        );

        arduinoLog(
            "Baud rate: 9600"
        );


        await sendArduinoCommand(
            "READY"
        );


        /*
        Listen for Arduino replies.
        */

        startArduinoReader();


    }

    catch (error) {

        console.error(
            "Arduino connection error:",
            error
        );

        arduinoLog(
            "Connection failed"
        );

        arduinoConnected = false;

        updateArduinoUI();

    }

    finally {

        arduinoConnecting = false;
    }
}


// ============================================================
// DISCONNECT
// ============================================================

async function disconnectArduino() {

    try {

        if (arduinoReader) {

            try {

                await arduinoReader.cancel();

            }

            catch (_) {}

            arduinoReader = null;
        }


        if (arduinoWriter) {

            try {

                arduinoWriter.releaseLock();

            }

            catch (_) {}

            arduinoWriter = null;
        }


        if (arduinoPort) {

            try {

                await arduinoPort.close();

            }

            catch (_) {}

            arduinoPort = null;
        }


    }

    finally {

        arduinoConnected = false;

        updateArduinoUI();

        arduinoLog(
            "Hardware link disconnected"
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
            command.trim() + "\n";


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


        arduinoLog(
            "USB connection lost"
        );


        arduinoConnected =
            false;


        updateArduinoUI();


        return false;
    }
}


// ============================================================
// READ ARDUINO RESPONSES
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
        arduinoPort.readable.getReader();


    let buffer = "";


    try {

        while (arduinoConnected) {

            const {
                value,
                done
            } =
                await arduinoReader.read();


            if (done) {
                break;
            }


            if (value) {

                buffer +=
                    decoder.decode(
                        value,
                        {
                            stream: true
                        }
                    );


                const lines =
                    buffer.split("\n");


                buffer =
                    lines.pop();


                for (
                    const line
                    of lines
                ) {

                    const message =
                        line.trim();


                    if (message) {

                        arduinoLog(
                            `RX ← ${message}`
                        );

                    }
                }
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

        arduinoReader = null;
    }
}


// ============================================================
// PHASE → ARDUINO COMMAND
// ============================================================

function sendArduinoPhaseCommand(
    currentPhase
) {

    if (!arduinoConnected) {
        return;
    }


    if (
        !currentPhase ||
        currentPhase === arduinoLastPhase
    ) {

        return;
    }


    arduinoLastPhase =
        currentPhase;


    switch (currentPhase) {

        case "IDLE":

            sendArduinoCommand(
                "READY"
            );

            break;


        case "COUNTDOWN":

            sendArduinoCommand(
                "COUNTDOWN:10"
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
// WATCH EXISTING MISSION CONTROL
// ============================================================

function watchMissionPhase() {

    const phaseElement =
        document.getElementById(
            "phase"
        );


    if (!phaseElement) {

        setTimeout(
            watchMissionPhase,
            500
        );

        return;
    }


    let previous =
        phaseElement.textContent.trim();


    arduinoLastPhase =
        null;


    const observer =
        new MutationObserver(
            () => {

                const phase =
                    phaseElement
                        .textContent
                        .trim();


                if (
                    phase !== previous
                ) {

                    previous =
                        phase;


                    sendArduinoPhaseCommand(
                        phase
                    );
                }
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


    /*
    Also check periodically.
    This catches any phase changes that
    happen without a DOM mutation.
    */

    setInterval(
        () => {

            const phase =
                phaseElement
                    .textContent
                    .trim();


            if (
                phase !== previous
            ) {

                previous =
                    phase;


                sendArduinoPhaseCommand(
                    phase
                );
            }

        },
        250
    );
}


// ============================================================
// COUNTDOWN COMMAND SUPPORT
// ============================================================

function watchCountdown() {

    const countdownElement =
        document.getElementById(
            "countdown"
        );


    if (!countdownElement) {

        setTimeout(
            watchCountdown,
            500
        );

        return;
    }


    let previous =
        countdownElement.textContent
            .trim();


    const observer =
        new MutationObserver(
            () => {

                const value =
                    countdownElement
                        .textContent
                        .trim();


                if (
                    value === previous
                ) {
                    return;
                }


                previous =
                    value;


                /*
                Convert:

                    T−10
                    T−9
                    T−8

                into:

                    COUNTDOWN:10
                    COUNTDOWN:9
                    COUNTDOWN:8
                */


                const match =
                    value.match(
                        /T[−-](\d+)/
                    );


                if (
                    match &&
                    arduinoConnected
                ) {

                    sendArduinoCommand(
                        `COUNTDOWN:${match[1]}`
                    );
                }
            }
        );


    observer.observe(
        countdownElement,
        {
            childList: true,
            characterData: true,
            subtree: true
        }
    );
}


// ============================================================
// AUTOMATIC ARDUINO CONNECTION HANDLING
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

                arduinoLog(
                    "Arduino disconnected from USB"
                );

                arduinoConnected =
                    false;

                arduinoPort =
                    null;

                arduinoWriter =
                    null;

                updateArduinoUI();
            }
        }
    );
}


// ============================================================
// INITIALIZATION
// ============================================================

function initArduinoIntegration() {

    createArduinoPanel();

    updateArduinoUI();

    watchMissionPhase();

    watchCountdown();

    arduinoLog(
        "Arduino interface initialized"
    );

    arduinoLog(
        "Waiting for USB connection"
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