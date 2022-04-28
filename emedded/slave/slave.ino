#include <ESP8266WiFi.h>
#include <WebSocketsClient.h>

WebSocketsClient webSocket;
const byte numChars = 32;
char receivedChars[numChars];   // an array to store the received data
boolean newData = false;
bool connected = false;
String path = "192.168.43.226";
//String path = "indoor-localization-sbme.herokuapp.com" ;
int port = 80;
String url = "/master" ;
char * username = "Ahmed Galal " ;
char * password = "88888888";

void setup() {
  Serial.begin(38400);
  connectWifi();
  connectSocket();
}

void loop() {
  webSocket.loop();
  recvWithEndMarker();
  sendServer();
  delay(500);
}

void connectSocket() {
  // server address, port and URL
  //webSocket.begin("localization-hamdy-server.herokuapp.com", 8082, "/","text");
  Serial.println("Trying to connect to web_socket  === " + path + ":" + String(port) + url );
  webSocket.begin(path, port, url , "text");
  // event handler
  webSocket.onEvent(webSocketEvent);
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

void sendServer() {
  if (newData == true && connected) {
    webSocket.sendTXT(receivedChars);
    newData = false;
  }
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.printf("[WSc] Disconnected!\n");
      connected = false;
      break;
    case WStype_CONNECTED:
      Serial.printf("[WSc] Connected to url: %s\n", payload);
      connected = true;
      break;
    //when we recieve data but we will not recievw any data
    case WStype_TEXT:
      //Serial.printf("[WSc] RESPONSE: %s\n", payload);
      Serial.println((char *)payload);
      break;
  }

}
void connectWifi() {

  WiFi.begin(username, password);
  Serial.println("Connecting");
  uint8_t i = 0;
  while (WiFi.status() != WL_CONNECTED && i < 20) {
    Serial.print(".");
    delay(500);
    i++;
  }
  Serial.print("Connected to WiFi network with IP Address: ");
  Serial.println(WiFi.localIP());
}
