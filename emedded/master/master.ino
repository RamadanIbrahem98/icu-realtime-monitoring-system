#include <ArduinoJson.h>
#define TEMP A0
#define LDR A1
int servo1 = 30 ;
const byte numChars = 32;
char receivedChars[numChars];  // an array to store the received data
boolean newData = false;
String sensorValues ;
String objectString = "";
int sensor1Id = 0 ;
int sensor2Id = 1 ;
bool senosr1Acative = true ;
bool senosr2Acative = true ;
void setup() {
  Serial.begin(38400);
  pinMode(TEMP, INPUT);
  pinMode(LDR, INPUT);
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
  if (senosr1Acative) {
    object["TEMP"] = 20;
  }
  if (senosr2Acative) {
    object["LDR"] = 20;
  }
  sensorValues = " " ;
  serializeJson(doc, sensorValues);
  Serial.println(sensorValues);
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
    if (doc["id"] == 0) {
      senosr1Acative = doc["active"];
    }
    else if (doc["id"] == 1) {
      senosr2Acative = doc["active"];
    }
    newData = false;
  }
}
