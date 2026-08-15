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

Commands:
READY
COUNTDOWN:10
COUNTDOWN:9
...
COUNTDOWN:1
IGNITION
LIFTOFF
ORBIT
DEPLOY
SUCCESS
ABORT
RESET
============================================================
*/

const int BLUE_LED = 3;
const int BUZZER   = 10;

String inputCommand = "";


void setup() {

  pinMode(BLUE_LED, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  digitalWrite(BLUE_LED, LOW);
  noTone(BUZZER);

  Serial.begin(9600);

  delay(500);

  Serial.println("ARDUINO_READY");
}


void toneShort(int frequency, int duration) {

  tone(BUZZER, frequency, duration);

  delay(duration + 30);

  noTone(BUZZER);
}


void handleCommand(String command) {

  command.trim();
  command.toUpperCase();


  // ========================================================
  // RESET
  // ========================================================

  if (command == "RESET") {

    noTone(BUZZER);

    digitalWrite(BLUE_LED, LOW);

    Serial.println("RESET_OK");
  }


  // ========================================================
  // READY
  // Blue LED ON
  // ========================================================

  else if (command == "READY") {

    digitalWrite(BLUE_LED, HIGH);

    noTone(BUZZER);

    Serial.println("READY_OK");
  }


  // ========================================================
  // COUNTDOWN
  // Blue LED flashes
  // Buzzer beeps
  // ========================================================

  else if (command.startsWith("COUNTDOWN:")) {

    digitalWrite(
      BLUE_LED,
      !digitalRead(BLUE_LED)
    );

    toneShort(1000, 120);

    Serial.print("COUNTDOWN_OK:");

    Serial.println(
      command.substring(10)
    );
  }


  // ========================================================
  // IGNITION
  // Blue LED ON
  // Low + high engine tone
  // ========================================================

  else if (command == "IGNITION") {

    digitalWrite(BLUE_LED, HIGH);

    toneShort(450, 250);

    toneShort(750, 350);

    Serial.println("IGNITION_OK");
  }


  // ========================================================
  // LIFTOFF
  // Blue LED ON
  // Rising launch tones
  // ========================================================

  else if (command == "LIFTOFF") {

    digitalWrite(BLUE_LED, HIGH);

    toneShort(550, 250);

    toneShort(850, 450);

    Serial.println("LIFTOFF_OK");
  }


  // ========================================================
  // ORBIT
  // ========================================================

  else if (command == "ORBIT") {

    digitalWrite(BLUE_LED, HIGH);

    toneShort(1200, 200);

    Serial.println("ORBIT_OK");
  }


  // ========================================================
  // SATELLITE DEPLOYMENT
  // Two quick tones
  // ========================================================

  else if (command == "DEPLOY") {

    digitalWrite(BLUE_LED, HIGH);

    toneShort(1400, 150);

    toneShort(1800, 200);

    Serial.println("DEPLOY_OK");
  }


  // ========================================================
  // MISSION SUCCESS
  // Long success tone
  // ========================================================

  else if (command == "SUCCESS") {

    digitalWrite(BLUE_LED, HIGH);

    toneShort(1600, 500);

    Serial.println("SUCCESS_OK");
  }


  // ========================================================
  // ABORT
  // LED OFF
  // Buzzer immediately OFF
  // ========================================================

  else if (command == "ABORT") {

    noTone(BUZZER);

    digitalWrite(BLUE_LED, LOW);

    Serial.println("ABORT_OK");
  }


  // ========================================================
  // UNKNOWN COMMAND
  // ========================================================

  else {

    Serial.print("UNKNOWN_COMMAND:");

    Serial.println(command);
  }
}


void loop() {

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