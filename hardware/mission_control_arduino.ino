/*
============================================================
ISRO MISSION CONTROL
ARDUINO HARDWARE + EMERGENCY BUTTON
============================================================

BOARD
    Arduino UNO

SERIAL
    9600 baud

HARDWARE
    D2  -> Emergency Push Button -> GND
    D3  -> Blue LED
    D10 -> Buzzer

BUTTON BEHAVIOUR

    SINGLE PRESS
        -> Emergency alarm

    DOUBLE PRESS
        -> Mission abort

============================================================
*/

const int EMERGENCY_BUTTON = 2;
const int BLUE_LED = 3;
const int BUZZER = 10;


// ============================================================
// BUTTON VARIABLES
// ============================================================

bool lastButtonState = HIGH;
bool buttonState = HIGH;

unsigned long lastDebounceTime = 0;

const unsigned long debounceDelay = 50;


// Double-click timing
bool waitingForSecondClick = false;

unsigned long firstClickTime = 0;

const unsigned long doubleClickWindow = 650;


// ============================================================
// EMERGENCY STATE
// ============================================================

bool emergencyActive = false;

bool ascentHold = false;


// ============================================================
// ALARM
// ============================================================

unsigned long lastAlarmTime = 0;

bool alarmState = false;


// ============================================================
// SERIAL INPUT
// ============================================================

String inputCommand = "";


// ============================================================
// SETUP
// ============================================================

void setup() {

  pinMode(
    EMERGENCY_BUTTON,
    INPUT_PULLUP
  );

  pinMode(
    BLUE_LED,
    OUTPUT
  );

  pinMode(
    BUZZER,
    OUTPUT
  );


  digitalWrite(
    BLUE_LED,
    LOW
  );

  noTone(BUZZER);


  Serial.begin(9600);


  delay(500);


  Serial.println(
    "ARDUINO_READY"
  );
}


// ============================================================
// SHORT TONE
// ============================================================

void toneShort(
  int frequency,
  int duration
) {

  tone(
    BUZZER,
    frequency,
    duration
  );

  delay(
    duration + 30
  );

  noTone(BUZZER);
}


// ============================================================
// EMERGENCY ALARM
// ============================================================

void emergencyAlarm() {

  unsigned long now =
    millis();


  if (
    now - lastAlarmTime >= 300
  ) {

    lastAlarmTime =
      now;


    alarmState =
      !alarmState;


    if (alarmState) {

      digitalWrite(
        BLUE_LED,
        HIGH
      );

      tone(
        BUZZER,
        1200
      );

    }

    else {

      digitalWrite(
        BLUE_LED,
        LOW
      );

      noTone(
        BUZZER
      );
    }
  }
}


// ============================================================
// START EMERGENCY
// ============================================================

void startEmergency(
  const char* source
) {

  if (emergencyActive) {
    return;
  }


  emergencyActive =
    true;


  ascentHold =
    false;


  alarmState =
    false;


  lastAlarmTime =
    0;


  Serial.print(
    "EVENT:EMERGENCY:"
  );


  Serial.println(
    source
  );
}


// ============================================================
// ABORT MISSION
// ============================================================

void abortMission(
  const char* source
) {

  emergencyActive =
    false;


  ascentHold =
    false;


  alarmState =
    false;


  noTone(
    BUZZER
  );


  digitalWrite(
    BLUE_LED,
    LOW
  );


  Serial.print(
    "EVENT:ABORT:"
  );


  Serial.println(
    source
  );


  Serial.println(
    "ABORT_OK"
  );
}


// ============================================================
// BUTTON HANDLING
// ============================================================

void checkEmergencyButton() {

  bool reading =
    digitalRead(
      EMERGENCY_BUTTON
    );


  // ----------------------------------------------------------
  // Debounce
  // ----------------------------------------------------------

  if (
    reading != lastButtonState
  ) {

    lastDebounceTime =
      millis();
  }


  if (
    millis() - lastDebounceTime
    > debounceDelay
  ) {

    if (
      reading != buttonState
    ) {

      buttonState =
        reading;


      // ------------------------------------------------------
      // BUTTON PRESSED
      // INPUT_PULLUP means LOW = PRESSED
      // ------------------------------------------------------

      if (
        buttonState == LOW
      ) {

        unsigned long now =
          millis();


        // ----------------------------------------------------
        // SECOND CLICK
        // ----------------------------------------------------

        if (
          waitingForSecondClick &&
          now - firstClickTime
          <= doubleClickWindow
        ) {

          waitingForSecondClick =
            false;


          abortMission(
            "PHYSICAL_DOUBLE_PRESS"
          );
        }


        // ----------------------------------------------------
        // FIRST CLICK
        // ----------------------------------------------------

        else {

          waitingForSecondClick =
            true;


          firstClickTime =
            now;
        }
      }
    }
  }


  lastButtonState =
    reading;


  // ----------------------------------------------------------
  // FIRST CLICK EXPIRED
  // ----------------------------------------------------------

  if (
    waitingForSecondClick &&
    millis() - firstClickTime
    > doubleClickWindow
  ) {

    waitingForSecondClick =
      false;


    startEmergency(
      "PHYSICAL_BUTTON"
    );
  }
}


// ============================================================
// HANDLE SERIAL COMMAND
// ============================================================

void handleCommand(
  String command
) {

  command.trim();

  command.toUpperCase();


  // ==========================================================
  // RESET
  // ==========================================================

  if (
    command == "RESET"
  ) {

    emergencyActive =
      false;

    ascentHold =
      false;

    waitingForSecondClick =
      false;

    noTone(
      BUZZER
    );

    digitalWrite(
      BLUE_LED,
      LOW
    );

    Serial.println(
      "RESET_OK"
    );

    return;
  }


  // ==========================================================
  // READY
  // ==========================================================

  if (
    command == "READY"
  ) {

    emergencyActive =
      false;

    ascentHold =
      false;

    waitingForSecondClick =
      false;

    noTone(
      BUZZER
    );

    digitalWrite(
      BLUE_LED,
      HIGH
    );

    Serial.println(
      "READY_OK"
    );

    return;
  }


  // ==========================================================
  // COUNTDOWN
  // ==========================================================

  if (
    command.startsWith(
      "COUNTDOWN:"
    )
  ) {

    if (
      emergencyActive
    ) {

      return;
    }


    /*
    The website sends:

        COUNTDOWN:10
        COUNTDOWN:9
        ...
        COUNTDOWN:1

    Arduino gives one short beep
    for every received countdown value.
    */

    digitalWrite(
      BLUE_LED,
      !digitalRead(
        BLUE_LED
      )
    );


    toneShort(
      1000,
      120
    );


    Serial.print(
      "COUNTDOWN_OK:"
    );


    Serial.println(
      command.substring(
        10
      )
    );


    return;
  }


  // ==========================================================
  // IGNITION
  // ==========================================================

  if (
    command == "IGNITION"
  ) {

    digitalWrite(
      BLUE_LED,
      HIGH
    );


    toneShort(
      450,
      250
    );


    toneShort(
      750,
      350
    );


    Serial.println(
      "IGNITION_OK"
    );


    return;
  }


  // ==========================================================
  // LIFTOFF
  // ==========================================================

  if (
    command == "LIFTOFF"
  ) {

    digitalWrite(
      BLUE_LED,
      HIGH
    );


    toneShort(
      550,
      250
    );


    toneShort(
      850,
      450
    );


    Serial.println(
      "LIFTOFF_OK"
    );


    return;
  }


  // ==========================================================
  // ASCENT HOLD
  // ==========================================================

  if (
    command == "ASCENT_HOLD"
  ) {

    ascentHold =
      true;


    digitalWrite(
      BLUE_LED,
      LOW
    );


    toneShort(
      700,
      180
    );


    toneShort(
      700,
      180
    );


    Serial.println(
      "ASCENT_HOLD_OK"
    );


    return;
  }


  // ==========================================================
  // ASCENT AUTHORIZED
  // ==========================================================

  if (
    command == "ASCENT_AUTHORIZED"
  ) {

    ascentHold =
      false;


    digitalWrite(
      BLUE_LED,
      HIGH
    );


    toneShort(
      1300,
      150
    );


    Serial.println(
      "ASCENT_AUTHORIZED_OK"
    );


    return;
  }


  // ==========================================================
  // ASCENT
  // ==========================================================

  if (
    command == "ASCENT"
  ) {

    ascentHold =
      false;


    digitalWrite(
      BLUE_LED,
      HIGH
    );


    toneShort(
      1000,
      250
    );


    Serial.println(
      "ASCENT_OK"
    );


    return;
  }


  // ==========================================================
  // ORBIT
  // ==========================================================

  if (
    command == "ORBIT"
  ) {

    digitalWrite(
      BLUE_LED,
      HIGH
    );


    toneShort(
      1200,
      200
    );


    Serial.println(
      "ORBIT_OK"
    );


    return;
  }


  // ==========================================================
  // DEPLOY
  // ==========================================================

  if (
    command == "DEPLOY"
  ) {

    digitalWrite(
      BLUE_LED,
      HIGH
    );


    toneShort(
      1400,
      150
    );


    toneShort(
      1800,
      200
    );


    Serial.println(
      "DEPLOY_OK"
    );


    return;
  }


  // ==========================================================
  // SUCCESS
  // ==========================================================

  if (
    command == "SUCCESS"
  ) {

    emergencyActive =
      false;


    digitalWrite(
      BLUE_LED,
      HIGH
    );


    toneShort(
      1600,
      500
    );


    Serial.println(
      "SUCCESS_OK"
    );


    return;
  }


  // ==========================================================
  // WARNING
  // ==========================================================

  if (
    command == "WARNING"
  ) {

    toneShort(
      850,
      180
    );


    Serial.println(
      "WARNING_OK"
    );


    return;
  }


  // ==========================================================
  // EMERGENCY
  // ==========================================================

  if (
    command == "EMERGENCY"
  ) {

    startEmergency(
      "MISSION_CONTROL"
    );


    return;
  }


  // ==========================================================
  // ABORT
  // ==========================================================

  if (
    command == "ABORT"
  ) {

    abortMission(
      "MISSION_CONTROL"
    );


    return;
  }


  // ==========================================================
  // UNKNOWN
  // ==========================================================

  Serial.print(
    "UNKNOWN_COMMAND:"
  );


  Serial.println(
    command
  );
}


// ============================================================
// MAIN LOOP
// ============================================================

void loop() {

  /*
  IMPORTANT:
  Button is checked continuously even
  when the emergency alarm is running.
  */

  checkEmergencyButton();


  /*
  Emergency alarm has priority.
  */

  if (
    emergencyActive
  ) {

    emergencyAlarm();
  }


  /*
  Read Mission Control commands.
  */

  while (
    Serial.available() > 0
  ) {

    char incoming =
      Serial.read();


    if (
      incoming == '\n'
    ) {

      handleCommand(
        inputCommand
      );


      inputCommand =
        "";
    }


    else if (
      incoming != '\r'
    ) {

      inputCommand +=
        incoming;
    }
  }
}