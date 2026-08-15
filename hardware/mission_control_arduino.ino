/*
============================================================
ISRO MISSION CONTROL
ARDUINO HARDWARE INTERFACE
============================================================

Board : Arduino UNO
Port  : COM3
Baud  : 9600

Hardware:
D3  -> Blue LED
D10 -> Buzzer

Normal commands:
READY
COUNTDOWN:10
COUNTDOWN:9
...
COUNTDOWN:1
IGNITION
LIFTOFF
ASCENT
ORBIT
DEPLOY
SUCCESS
RESET

Safety commands:
ASCENT_HOLD
ASCENT_AUTHORIZED
WARNING
EMERGENCY
ABORT

============================================================
*/

const int BLUE_LED = 3;
const int BUZZER   = 10;

String inputCommand = "";

bool emergencyActive = false;
bool ascentHold = false;

unsigned long lastAlarmTime = 0;
bool alarmState = false;


// ============================================================
// SETUP
// ============================================================

void setup() {

  pinMode(BLUE_LED, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  digitalWrite(BLUE_LED, LOW);
  noTone(BUZZER);

  Serial.begin(9600);

  delay(500);

  Serial.println("ARDUINO_READY");
}


// ============================================================
// SHORT TONE
// ============================================================

void toneShort(int frequency, int duration) {

  tone(BUZZER, frequency, duration);

  delay(duration + 30);

  noTone(BUZZER);
}


// ============================================================
// WARNING ALARM
// ============================================================

void warningAlarm() {

  tone(BUZZER, 850, 180);

  digitalWrite(BLUE_LED, HIGH);

  delay(200);

  noTone(BUZZER);

  digitalWrite(BLUE_LED, LOW);

  delay(120);
}


// ============================================================
// EMERGENCY ALARM
// ============================================================

void emergencyAlarm() {

  unsigned long now = millis();

  if (now - lastAlarmTime >= 350) {

    lastAlarmTime = now;

    alarmState = !alarmState;

    if (alarmState) {

      digitalWrite(BLUE_LED, HIGH);

      tone(BUZZER, 1200);

    } else {

      digitalWrite(BLUE_LED, LOW);

      noTone(BUZZER);
    }
  }
}


// ============================================================
// HANDLE COMMAND
// ============================================================

void handleCommand(String command) {

  command.trim();
  command.toUpperCase();


  // ==========================================================
  // RESET
  // ==========================================================

  if (command == "RESET") {

    emergencyActive = false;
    ascentHold = false;

    noTone(BUZZER);

    digitalWrite(BLUE_LED, LOW);

    alarmState = false;

    Serial.println("RESET_OK");

    return;
  }


  // ==========================================================
  // READY
  // ==========================================================

  if (command == "READY") {

    emergencyActive = false;
    ascentHold = false;

    noTone(BUZZER);

    digitalWrite(BLUE_LED, HIGH);

    Serial.println("READY_OK");

    return;
  }


  // ==========================================================
  // COUNTDOWN
  // ==========================================================

  if (command.startsWith("COUNTDOWN:")) {

    if (emergencyActive) {
      return;
    }

    digitalWrite(
      BLUE_LED,
      !digitalRead(BLUE_LED)
    );

    toneShort(1000, 120);

    Serial.print("COUNTDOWN_OK:");

    Serial.println(
      command.substring(10)
    );

    return;
  }


  // ==========================================================
  // IGNITION
  // ==========================================================

  if (command == "IGNITION") {

    digitalWrite(BLUE_LED, HIGH);

    toneShort(450, 250);

    toneShort(750, 350);

    Serial.println("IGNITION_OK");

    return;
  }


  // ==========================================================
  // LIFTOFF
  // ==========================================================

  if (command == "LIFTOFF") {

    digitalWrite(BLUE_LED, HIGH);

    toneShort(550, 250);

    toneShort(850, 450);

    Serial.println("LIFTOFF_OK");

    return;
  }


  // ==========================================================
  // ASCENT HOLD
  // ==========================================================

  if (command == "ASCENT_HOLD") {

    ascentHold = true;

    digitalWrite(BLUE_LED, LOW);

    toneShort(700, 180);

    toneShort(700, 180);

    Serial.println("ASCENT_HOLD_OK");

    return;
  }


  // ==========================================================
  // ASCENT AUTHORIZED
  // ==========================================================

  if (command == "ASCENT_AUTHORIZED") {

    ascentHold = false;

    digitalWrite(BLUE_LED, HIGH);

    toneShort(1300, 150);

    Serial.println("ASCENT_AUTHORIZED_OK");

    return;
  }


  // ==========================================================
  // ASCENT
  // ==========================================================

  if (command == "ASCENT") {

    ascentHold = false;

    digitalWrite(BLUE_LED, HIGH);

    toneShort(1000, 250);

    Serial.println("ASCENT_OK");

    return;
  }


  // ==========================================================
  // ORBIT
  // ==========================================================

  if (command == "ORBIT") {

    digitalWrite(BLUE_LED, HIGH);

    toneShort(1200, 200);

    Serial.println("ORBIT_OK");

    return;
  }


  // ==========================================================
  // DEPLOY
  // ==========================================================

  if (command == "DEPLOY") {

    digitalWrite(BLUE_LED, HIGH);

    toneShort(1400, 150);

    toneShort(1800, 200);

    Serial.println("DEPLOY_OK");

    return;
  }


  // ==========================================================
  // SUCCESS
  // ==========================================================

  if (command == "SUCCESS") {

    emergencyActive = false;

    digitalWrite(BLUE_LED, HIGH);

    toneShort(1600, 500);

    Serial.println("SUCCESS_OK");

    return;
  }


  // ==========================================================
  // WARNING
  // ==========================================================

  if (command == "WARNING") {

    warningAlarm();

    Serial.println("WARNING_OK");

    return;
  }


  // ==========================================================
  // EMERGENCY
  // ==========================================================

  if (command == "EMERGENCY") {

    emergencyActive = true;

    alarmState = false;

    lastAlarmTime = 0;

    Serial.println("EMERGENCY_ALARM_ACTIVE");

    return;
  }


  // ==========================================================
  // ABORT
  // ==========================================================

  if (command == "ABORT") {

    emergencyActive = false;
    ascentHold = false;

    noTone(BUZZER);

    digitalWrite(BLUE_LED, LOW);

    alarmState = false;

    Serial.println("ABORT_OK");

    return;
  }


  // ==========================================================
  // UNKNOWN COMMAND
  // ==========================================================

  Serial.print("UNKNOWN_COMMAND:");

  Serial.println(command);
}


// ============================================================
// LOOP
// ============================================================

void loop() {

  // ----------------------------------------------------------
  // Emergency alarm has priority
  // ----------------------------------------------------------

  if (emergencyActive) {

    emergencyAlarm();
  }


  // ----------------------------------------------------------
  // Read serial
  // ----------------------------------------------------------

  while (Serial.available() > 0) {

    char incoming = Serial.read();


    if (incoming == '\n') {

      handleCommand(inputCommand);

      inputCommand = "";
    }

    else if (incoming != '\r') {

      inputCommand += incoming;
    }
  }
}