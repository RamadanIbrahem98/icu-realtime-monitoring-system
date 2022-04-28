#include <ArduinoJson.h>
#define SENSOR1 A0
#define SENSOR2 A1
#define SENSOR1_LED 8
#define SENSOR2_LED 12
int servo1 = 30 ;
const byte numChars = 32;
char receivedChars[numChars];  // an array to store the received data
boolean newData = false;
String sensorValues ;
String objectString = "";
int sensor1Id = 3 ;
int sensor2Id = 2 ;
int senosr1Acative = 1 ;
int senosr2Acative = 1 ;
void setup() {
  Serial.begin(38400);
  pinMode(SENSOR1,INPUT);
  pinMode(SENSOR2,INPUT);
  pinMode(SENSOR1_LED,OUTPUT);
  pinMode(SENSOR2_LED,OUTPUT);


}

void loop() {
  collectSensorData();
  recvWithEndMarker();
  changeState();
  delay(500);

}
void collectSensorData() {
  const size_t CAPACITY = JSON_OBJECT_SIZE(2);
  StaticJsonDocument<CAPACITY> doc;
  // create an object
  JsonObject object = doc.to<JsonObject>();
    object["3"] = analogRead(SENSOR1);
    object["2"] = analogRead(SENSOR2);;
    sensorValues = " " ;
    serializeJson(doc, sensorValues);
    Serial.println(sensorValues);
    delay(1000);
  if (senosr1Acative) {
    digitalWrite(SENSOR1_LED,HIGH);
  }else{
        digitalWrite(SENSOR1_LED,LOW);
    }
  if (senosr2Acative) {
    digitalWrite(SENSOR2_LED,HIGH);
  }else{
        digitalWrite(SENSOR2_LED,LOW);
    }
}

void recvWithEndMarker() {
  static byte ndx = 0;
  char endMarker = '\n';
  char rc;

  while (Serial.available() > 0 && newData == false) {
    rc = Serial.read();

    if (rc != endMarker) {
      receivedChars[ndx] = rc;
      ndx++;
      if (ndx >= numChars) {
        ndx = numChars - 1;
      }
    }
    else {
      receivedChars[ndx] = '\0'; // terminate the string
      ndx = 0;
      newData = true;
    }
  }
}

void changeState() {
  if (newData == true) {
    StaticJsonDocument<200> doc;
    deserializeJson(doc, receivedChars);
    if (doc["id"] == 3) {
      senosr1Acative = doc["active"];
    }
    else if (doc["id"] == 2) {
      senosr2Acative = doc["active"];
    }
    newData = false;
  }
}
