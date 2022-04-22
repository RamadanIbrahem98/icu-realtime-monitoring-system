# Endpoints

## API Endpoints

<details>
<summary>GET /all-data</summary>
<br>
used in the home page to get all the IDs with their data
<br><br>
<pre>
req body {}

res body [
  {
    "room_id": 1,
    "room_capacity": 5,
    "patients": [
      {
        "patient_id": 1,
        "patient_name": "ahmed",
        "patient_code": "PATIENT111",
        "sensors": [
          {
            "sensor_id": 1,
            "sensor_serial_number": "ABC111"
          },
          {
            "sensor_id": 5,
            "sensor_serial_number": "XTC114"
          },
        ]
      },
      {
        "patient_id": 4,
        "patient_name": "Mohamed",
        "patient_code": "PATIENT114",
        "sensors": []
      }
    ]
  },
]
</pre>
</details>

<details>
<summary>POST /rooms</summary>
<br>
Add a new ICU Room
<br>
<pre>
req body {
  "number": "XYZ12",
  "capacity": 5,
}

res body {}
</pre>
</details>

<details>
<summary>POST /patients</summary>
<br>
Admit a new Patient to an ICU Room
<br>
<pre>
req body {
  "code": "PATIENT111",
  "name": "ahmed",
  "room_id": 1
}
res body {}
</pre>
</details>

<details>
<summary>POST /sensors</summary>
<br>
Add a new Sensor to an ICU Room
<br><br>
<pre>
req body {
  "serial_number": "ABC111",
  "type": "Heart Rate",
  "room_id": 1,
  "patient_id": 1
}

res body {}
</pre>
</details>

<details>
<summary>PATCH /sensors/rotate-sensor</summary>
<br>
Rotate the sensor for annother patient in an ICU Room
<br><br>
<pre>
req body {
  "serial_number": 2,
  "room_id": 1,
  "patient_id": 2
}

res body {}
</pre>
</details>

<details>
<summary>GET /sensors/:sensor_id/readings</summary>
<br>
GET all readings from a sensor
<br><br>
<pre>
req body {}

res body {
  "readings": [
    {
      "timestamp": "2022-04-22 17:55:35"
      "value": "37.2",
    },
    {
      "timestamp": "2022-04-22 17:55:32"
      "value": "37.8",
    }
  ]
}
</pre>
</details>

## Websocket Endpoints

<details>
<summary>/slave</summary>
<br>
Used to connect a mobile device to the server

Slave can send two types of messages:

Control Signal Message 
<br><br>
<pre>
req body {
  "type": "control",
  "active": true,
}
</pre>

Select Sensor Message
<br><br>
<pre>
req body {
  "type": "sensor",
  "sensor_id": 1,
}
</pre>

Control Signal Message is emmited directly to the ESP

Select Sensor Message is used in server to set desired sensor for recieving it's readings in real-time from ESP in order to plot the data on a graph
</details>

<details>
<summary>/master</summary>
<br>
Used to connect the ESP to the server
<br><br>
It has One type of message:

Sending Sensor Data Message
<pre>
req body {
  "sensor_id": "ABC111",
  "value": 37.5,
}
</pre>
This message is emitted to the slaves interested in the sensor and also saved to the database.
</details>
