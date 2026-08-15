const int BLUE_LED = 3;
const int BUZZER = 10;

void setup(){ pinMode(BLUE_LED,OUTPUT); pinMode(BUZZER,OUTPUT); Serial.begin(9600); }
void toneShort(int f,int d){ tone(BUZZER,f,d); delay(d+30); }
void loop(){
  if(!Serial.available()) return;
  String c=Serial.readStringUntil('\n'); c.trim();
  if(c=="RESET"){noTone(BUZZER);digitalWrite(BLUE_LED,LOW);}
  else if(c=="READY"){digitalWrite(BLUE_LED,HIGH);}
  else if(c.startsWith("COUNTDOWN:")){digitalWrite(BLUE_LED,!digitalRead(BLUE_LED));toneShort(1000,120);}
  else if(c=="IGNITION"){digitalWrite(BLUE_LED,HIGH);toneShort(450,250);toneShort(750,350);}
  else if(c=="LIFTOFF"){toneShort(550,250);toneShort(850,450);}
  else if(c=="ORBIT"){toneShort(1200,200);}
  else if(c=="DEPLOY"){toneShort(1400,150);toneShort(1800,200);}
  else if(c=="SUCCESS"){toneShort(1600,500);}
  else if(c=="ABORT"){noTone(BUZZER);digitalWrite(BLUE_LED,LOW);}
}
