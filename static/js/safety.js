"use strict";

/*
============================================================
ISRO MISSION CONTROL
SAFETY + ASCENT AUTHORIZATION SYSTEM
============================================================
*/


let ascentPermissionRequired = false;
let ascentPermissionGranted = false;
let emergencyActive = false;


// ============================================================
// INJECT SAFETY UI
// ============================================================

function createSafetyUI() {

    if (
        document.getElementById(
            "safetyLayer"
        )
    ) {

        return;
    }


    const layer =
        document.createElement(
            "div"
        );


    layer.id =
        "safetyLayer";


    layer.innerHTML = `

        <!-- =================================================
             ASCENT PERMISSION
             ================================================= -->

        <div
            id="ascentModal"
            class="safety-modal hidden"
        >

            <div class="safety-box ascent-box">

                <div class="safety-icon">
                    🚨
                </div>


                <div class="safety-label">
                    FLIGHT SAFETY SYSTEM
                </div>


                <h1>
                    ASCENT PERMISSION REQUIRED
                </h1>


                <p>
                    Vehicle has cleared the launch tower.
                </p>


                <p class="safety-warning">
                    The mission is holding for
                    operator authorization.
                </p>


                <div class="safety-readout">

                    <div>
                        <span>FLIGHT PHASE</span>
                        <strong>
                            LIFTOFF
                        </strong>
                    </div>

                    <div>
                        <span>GUIDANCE</span>
                        <strong>
                            NOMINAL
                        </strong>
                    </div>

                    <div>
                        <span>HARDWARE</span>
                        <strong
                            id="permissionHardware"
                        >
                            CHECKING
                        </strong>
                    </div>

                </div>


                <div class="safety-actions">

                    <button
                        id="authorizeAscentButton"
                        class="authorize-button"
                    >
                        AUTHORIZE ASCENT
                    </button>


                    <button
                        id="permissionAbortButton"
                        class="emergency-button"
                    >
                        ABORT MISSION
                    </button>

                </div>

            </div>

        </div>


        <!-- =================================================
             EMERGENCY ALARM
             ================================================= -->

        <div
            id="emergencyModal"
            class="safety-modal emergency-overlay hidden"
        >

            <div class="safety-box emergency-box">

                <div class="emergency-flash">
                    🚨
                </div>


                <div class="emergency-label">
                    EMERGENCY
                </div>


                <h1>
                    EMERGENCY ALARM
                </h1>


                <p id="emergencyMessage">
                    Mission safety system has detected
                    an emergency condition.
                </p>


                <div class="emergency-status">
                    <span>
                        HARDWARE ALARM
                    </span>

                    <strong>
                        ACTIVE
                    </strong>
                </div>


                <div class="safety-actions">

                    <button
                        id="emergencyAbortButton"
                        class="emergency-button large"
                    >
                        ABORT MISSION
                    </button>

                </div>

            </div>

        </div>


        <!-- =================================================
             SAFETY CONTROL
             ================================================= -->

        <section
            id="safetyControl"
            class="panel safety-control"
        >

            <div class="panel-heading">

                <div>

                    <span class="label">
                        FLIGHT SAFETY
                    </span>

                    <h2>
                        EMERGENCY SYSTEM
                    </h2>

                </div>


                <div
                    id="safetyState"
                    class="state-chip"
                >
                    SAFE
                </div>

            </div>


            <div class="safety-control-grid">

                <div>

                    <span>
                        ASCENT AUTHORIZATION
                    </span>

                    <strong
                        id="ascentState"
                    >
                        NOT REQUIRED
                    </strong>

                </div>


                <div>

                    <span>
                        EMERGENCY SYSTEM
                    </span>

                    <strong
                        id="emergencyState"
                    >
                        STANDBY
                    </strong>

                </div>


                <div>

                    <span>
                        OPERATOR
                    </span>

                    <strong>
                        MISSION CONTROL
                    </strong>

                </div>


                <button
                    id="testEmergencyButton"
                    class="emergency-test-button"
                >
                    TEST EMERGENCY ALARM
                </button>

            </div>

        </section>
    `;


    document.body.appendChild(layer);


    document
        .getElementById(
            "authorizeAscentButton"
        )
        .addEventListener(
            "click",
            authorizeAscent
        );


    document
        .getElementById(
            "permissionAbortButton"
        )
        .addEventListener(
            "click",
            () => triggerEmergency(
                "Operator selected mission abort."
            )
        );


    document
        .getElementById(
            "emergencyAbortButton"
        )
        .addEventListener(
            "click",
            abortFromEmergency
        );


    document
        .getElementById(
            "testEmergencyButton"
        )
        .addEventListener(
            "click",
            () => {

                if (
                    confirm(
                        "Start the emergency alarm test?"
                    )
                ) {

                    triggerEmergency(
                        "Operator initiated emergency alarm test."
                    );
                }

            }
        );
}


// ============================================================
// SHOW ASCENT PERMISSION
// ============================================================

function showAscentPermission() {

    if (
        ascentPermissionGranted
    ) {

        return;
    }


    ascentPermissionRequired =
        true;


    const modal =
        document.getElementById(
            "ascentModal"
        );


    if (!modal) {
        return;
    }


    const hardware =
        document.getElementById(
            "permissionHardware"
        );


    if (hardware) {

        hardware.textContent =
            typeof arduinoConnected !==
            "undefined" &&
            arduinoConnected
                ? "ONLINE"
                : "SIMULATION";
    }


    modal.classList.remove(
        "hidden"
    );


    updateSafetyState();


    if (
        typeof sendArduinoCommand ===
        "function"
    ) {

        sendArduinoCommand(
            "ASCENT_HOLD"
        );
    }


    if (
        typeof log ===
        "function"
    ) {

        log(
            "SAFETY",
            "ASCENT PERMISSION REQUIRED"
        );

    }
}


// ============================================================
// AUTHORIZE ASCENT
// ============================================================

function authorizeAscent() {

    if (
        !ascentPermissionRequired
    ) {

        return;
    }


    ascentPermissionGranted =
        true;

    ascentPermissionRequired =
        false;


    const modal =
        document.getElementById(
            "ascentModal"
        );


    if (modal) {

        modal.classList.add(
            "hidden"
        );
    }


    if (
        typeof phase !==
        "undefined"
    ) {

        phase =
            "ASCENT";
    }


    if (
        typeof running !==
        "undefined"
    ) {

        running =
            true;
    }


    if (
        typeof sendArduinoCommand ===
        "function"
    ) {

        sendArduinoCommand(
            "ASCENT_AUTHORIZED"
        );

        sendArduinoCommand(
            "ASCENT"
        );
    }


    if (
        typeof log ===
        "function"
    ) {

        log(
            "SAFETY",
            "ASCENT AUTHORIZED BY OPERATOR"
        );

        log(
            "FLIGHT",
            "Ascent sequence resumed"
        );
    }


    if (
        typeof updateAll ===
        "function"
    ) {

        updateAll();
    }


    /*
    Resume the existing mission timer.
    */

    if (
        typeof timer !==
        "undefined"
    ) {

        clearInterval(timer);

        timer =
            setInterval(
                tick,
                1000
            );
    }


    updateSafetyState();
}


// ============================================================
// EMERGENCY
// ============================================================

function triggerEmergency(
    message
) {

    if (emergencyActive) {
        return;
    }


    emergencyActive =
        true;


    ascentPermissionRequired =
        false;


    const ascentModal =
        document.getElementById(
            "ascentModal"
        );


    if (ascentModal) {

        ascentModal.classList.add(
            "hidden"
        );
    }


    const modal =
        document.getElementById(
            "emergencyModal"
        );


    const messageBox =
        document.getElementById(
            "emergencyMessage"
        );


    if (messageBox) {

        messageBox.textContent =
            message;
    }


    if (modal) {

        modal.classList.remove(
            "hidden"
        );
    }


    document.body.classList.add(
        "emergency-active"
    );


    if (
        typeof sendArduinoCommand ===
        "function"
    ) {

        sendArduinoCommand(
            "EMERGENCY"
        );
    }


    if (
        typeof log ===
        "function"
    ) {

        log(
            "EMERGENCY",
            message
        );

    }


    updateSafetyState();
}


// ============================================================
// ABORT
// ============================================================

function abortFromEmergency() {

    emergencyActive =
        false;


    if (
        typeof running !==
        "undefined"
    ) {

        running =
            false;
    }


    if (
        typeof timer !==
        "undefined"
    ) {

        clearInterval(timer);
    }


    if (
        typeof phase !==
        "undefined"
    ) {

        phase =
            "ABORTED";
    }


    if (
        typeof stopAudio ===
        "function"
    ) {

        stopAudio();
    }


    if (
        typeof sendArduinoCommand ===
        "function"
    ) {

        sendArduinoCommand(
            "ABORT"
        );
    }


    const modal =
        document.getElementById(
            "emergencyModal"
        );


    if (modal) {

        modal.classList.add(
            "hidden"
        );
    }


    document.body.classList.remove(
        "emergency-active"
    );


    if (
        typeof log ===
        "function"
    ) {

        log(
            "WARNING",
            "MISSION ABORTED BY SAFETY SYSTEM"
        );
    }


    if (
        typeof updateAll ===
        "function"
    ) {

        updateAll();
    }


    updateSafetyState();
}


// ============================================================
// ARDUINO EMERGENCY RESPONSE
// ============================================================

function showEmergencyAlarm(
    message
) {

    triggerEmergency(
        message ||
        "Arduino emergency alarm active."
    );
}


// ============================================================
// EMERGENCY CLEARED
// ============================================================

function showEmergencyCleared() {

    emergencyActive =
        false;


    document.body.classList.remove(
        "emergency-active"
    );


    updateSafetyState();
}


// ============================================================
// SAFETY STATE
// ============================================================

function updateSafetyState() {

    const safetyState =
        document.getElementById(
            "safetyState"
        );


    const ascentState =
        document.getElementById(
            "ascentState"
        );


    const emergencyState =
        document.getElementById(
            "emergencyState"
        );


    if (emergencyActive) {

        if (safetyState) {

            safetyState.textContent =
                "EMERGENCY";
        }


        if (emergencyState) {

            emergencyState.textContent =
                "ALARM ACTIVE";
        }

    }

    else {

        if (safetyState) {

            safetyState.textContent =
                "SAFE";
        }


        if (emergencyState) {

            emergencyState.textContent =
                "STANDBY";
        }
    }


    if (ascentState) {

        if (
            ascentPermissionRequired
        ) {

            ascentState.textContent =
                "AWAITING AUTHORIZATION";

        }

        else if (
            ascentPermissionGranted
        ) {

            ascentState.textContent =
                "AUTHORIZED";

        }

        else {

            ascentState.textContent =
                "NOT REQUIRED";
        }
    }
}


// ============================================================
// WATCH FLIGHT PHASE
// ============================================================

function watchFlightPhase() {

    let lastPhase =
        null;


    setInterval(
        () => {

            if (
                typeof phase ===
                "undefined"
            ) {

                return;
            }


            if (
                phase ===
                lastPhase
            ) {

                return;
            }


            lastPhase =
                phase;


            /*
            The existing mission engine reaches
            LIFTOFF and then normally advances to
            ASCENT on the next tick.

            We intercept that point and stop
            the mission timer.
            */

            if (
                phase ===
                "LIFTOFF" &&
                !ascentPermissionGranted &&
                !emergencyActive
            ) {

                if (
                    typeof running !==
                    "undefined"
                ) {

                    running =
                        false;
                }


                if (
                    typeof timer !==
                    "undefined"
                ) {

                    clearInterval(timer);
                }


                showAscentPermission();

            }


            updateSafetyState();

        },
        100
    );
}


// ============================================================
// INITIALIZATION
// ============================================================

function initSafetySystem() {

    createSafetyUI();

    watchFlightPhase();

    updateSafetyState();


    if (
        typeof log ===
        "function"
    ) {

        log(
            "SAFETY",
            "Flight safety system initialized"
        );
    }
}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initSafetySystem
    );

}

else {

    initSafetySystem();
}