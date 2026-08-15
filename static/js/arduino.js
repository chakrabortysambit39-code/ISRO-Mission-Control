"use strict";

/*
============================================================
ISRO MISSION CONTROL
ARDUINO WEB SERIAL INTERFACE
============================================================
*/

let arduinoPort = null;
let arduinoWriter = null;
let arduinoReader = null;

let arduinoConnected = false;
let arduinoConnecting = false;

const ARDUINO_BAUD_RATE = 9600;


// ============================================================
// LOG
// ============================================================

function arduinoLog(message) {

    console.log("[ARDUINO]", message);

    if (typeof log === "function") {

        log("ARDUINO", message);

    }
}


// ============================================================
// SEND COMMAND
// ============================================================

async function sendArduinoCommand(command) {

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


        await arduinoWriter.write(data);


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

    if (arduinoConnected) {
        return;
    }


    if (!("serial" in navigator)) {

        alert(
            "Web Serial is not supported.\n\n" +
            "Use Google Chrome or Microsoft Edge."
        );

        return;
    }


    arduinoConnecting = true;


    try {

        arduinoLog(
            "Opening USB serial connection..."
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


        updateArduinoUI();


        arduinoLog(
            "ARDUINO LINK ONLINE"
        );


        await sendArduinoCommand(
            "READY"
        );


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


        arduinoConnected =
            false;


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
                buffer.split("\n");


            buffer =
                lines.pop();


            for (
                const line
                of lines
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

        arduinoReader = null;
    }
}


// ============================================================
// HANDLE RESPONSES
// ============================================================

function handleArduinoResponse(
    message
) {

    if (
        message ===
        "EMERGENCY_ALARM_ACTIVE"
    ) {

        if (
            typeof showEmergencyAlarm ===
            "function"
        ) {

            showEmergencyAlarm(
                "Arduino emergency alarm active"
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
// STATUS UI
// ============================================================

function updateArduinoUI() {

    const status =
        document.getElementById(
            "arduinoStatus"
        );


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


    if (arduinoConnected) {

        status.textContent =
            "ARDUINO ONLINE";


        status.className =
            "arduino-status online";


        if (connectButton) {

            connectButton.disabled =
                true;
        }


        if (disconnectButton) {

            disconnectButton.disabled =
                false;
        }


        if (testButton) {

            testButton.disabled =
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


        if (connectButton) {

            connectButton.disabled =
                false;
        }


        if (disconnectButton) {

            disconnectButton.disabled =
                true;
        }


        if (testButton) {

            testButton.disabled =
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
// ARDUINO PANEL
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

    arduinoLog(
        "Arduino interface initialized"
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