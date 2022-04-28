let sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('sqlite.db');

db.config = config;
db.addNewRoom = addNewRoom;
db.addNewPatient = addNewPatient;
db.addNewSensor = addNewSensor;
db.addSensorReading = addSensorReading;
db.rotatePatientSensor = rotatePatientSensor;
db.getAllData = getAllData;
db.getRooms = getRooms;
db.getPatientsByRoom = getPatientsByRoom;
db.getSensorsByPatient = getSensorsByPatient;
db.getSensorReadings = getSensorReadings;

async function config() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `CREATE TABLE IF NOT EXISTS rooms (
          id INTEGER,
          number TEXT NOT NULL UNIQUE,
          capacity INTEGER NOT NULL,
          PRIMARY KEY (id)
        )`,
        (err, _) => {
          if (err) {
            reject(err);
          }
        },
      );
      db.run(
        `CREATE TABLE IF NOT EXISTS patients (
          id INTEGER,
          code TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          room_id INTEGER NOT NULL,
          PRIMARY KEY (id),
          FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
        )`,
        (err, _) => {
          if (err) {
            reject(err);
          }
        },
      );
      db.run(
        `CREATE TABLE IF NOT EXISTS sensors (
          id INTEGER,
          serial_number TEXT NOT NULL UNIQUE,
          type TEXT NOT NULL,
          room_id INTEGER NOT NULL,
          patient_id INTEGER NOT NULL,
          PRIMARY KEY (id),
          FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        )`,
        (err, _) => {
          if (err) {
            reject(err);
          }
        },
      );
      db.run(
        `CREATE TABLE IF NOT EXISTS readings (
          id INTEGER, 
          value REAL NOT NULL,
          sensor_id INTEGER NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE CASCADE
          )`,
        (err, _) => {
          if (err) {
            reject(err);
          }
        },
      );
      resolve();
    });
  });
}

async function addNewRoom(number, capacity) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `
        INSERT INTO rooms (number, capacity) VALUES (?, ?) RETURNING *;
        `,
        [number, capacity],
        (err, res) => {
          err ? reject(err) : resolve(res);
        },
      );
    });
  });
}

async function addNewPatient(code, name, room_id) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `
        INSERT INTO patients (code, name, room_id) VALUES (?, ?, ?);
        `,
        [code, name, room_id],
        (err, res) => {
          err ? reject(err) : resolve(res);
        },
      );
    });
  });
}

async function addNewSensor(serial_number, type, room_id, patient_id) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `
        INSERT INTO sensors (serial_number, type, room_id, patient_id) VALUES (?, ?, ?, ?);
        `,
        [serial_number, type, room_id, patient_id],
        (err, res) => {
          err ? reject(err) : resolve(res);
        },
      );
    });
  });
}

async function rotatePatientSensor(serial_number, room_id, patient_id) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `
        UPDATE sensors SET room_id = ?, patient_id = ? WHERE serial_number = ?;
        `,
        [room_id, patient_id, serial_number],
        (err, res) => {
          err ? reject(err) : resolve(res);
        },
      );
    });
  });
}

async function addSensorReading(sensor_id, value) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `
        INSERT INTO readings (sensor_id, value) VALUES (?, ?);
        `,
        [sensor_id, value],
        (err, res) => {
          err ? reject(err) : resolve(res);
        },
      );
    });
  });
}

async function getRooms() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all(
        `
        SELECT id as room_id, capacity as room_capacity FROM rooms;
        `,
        (err, res) => {
          err ? reject(err) : resolve(res);
        },
      );
    });
  });
}

async function getPatientsByRoom(room_id) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all(
        `
        SELECT id as patient_id, name as patient_name, code as patient_code FROM patients WHERE room_id = ?;
        `,
        [room_id],
        (err, res) => {
          err ? reject(err) : resolve(res);
        },
      );
    });
  });
}

async function getSensorsByPatient(patient_id) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all(
        `
        SELECT id as sensor_id, serial_number as sensor_serial_number FROM sensors WHERE patient_id = ?;
        `,
        [patient_id],
        (err, res) => {
          err ? reject(err) : resolve(res);
        },
      );
    });
  });
}

async function getSensorReadings(sensor_id) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all(
        `
        SELECT timestamp, value FROM readings
        WHERE sensor_id = ?
        ORDER BY timestamp DESC
        LIMIT 1000;
        `,
        [sensor_id],
        (err, data) => (err ? reject(err) : resolve(data)),
      );
    });
  });
}

async function getAllData() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all(
        `
        SELECT rooms.id as room_id, rooms.number as room_number, rooms.capacity as room_capacity,
        patients.id as patient_id, patients.code as patient_code, patients.name as patient_name,
        sensors.id as sensor_id, sensors.serial_number as sensor_serial_number, sensors.type as sensor_type,
        readings.id as reading_id, readings.value as reading_value
        FROM
        rooms LEFT JOIN patients
        ON rooms.id = patients.room_id
        LEFT JOIN sensors
        ON patients.id = sensors.patient_id
        LEFT JOIN readings
        ON sensors.id = readings.sensor_id;
        `,
        (err, res) => {
          err ? reject(err) : resolve(res);
        },
      );
    });
  });
}

module.exports = db;
