const express = require('express');

const db = require('./db');
const logger = require('./logger');

const router = express.Router();

const getAllData = async (req, res) => {
  try {
    const roomsIds = await db.getRooms();
    const rooms = await Promise.all(
      roomsIds.map(async (room) => {
        const patientsIds = await db.getPatientsByRoom(room.room_id);
        const patients = await Promise.all(
          patientsIds.map(async (patient) => {
            const sensorsIds = await db.getSensorsByPatient(patient.patient_id);
            const sensors = await Promise.all(
              sensorsIds.map(async (sensor) => {
                return {
                  sensor_id: sensor.sensor_id,
                  sensor_serial_number: sensor.sensor_serial_number,
                };
              }),
            );
            return {
              patient_id: patient.patient_id,
              patient_name: patient.patient_name,
              patient_code: patient.patient_code,
              sensors: sensors,
            };
          }),
        );
        return {
          room_id: room.room_id,
          room_capacity: room.room_capacity,
          patients: patients,
        };
      }),
    );
    res.json(rooms);
  } catch (err) {
    logger('ERROR', 'API', `Error Fetching all-data ${err}`);
    res.status(500).send('Error Fetching all-data');
  }
};

const addNewRoom = async (req, res) => {
  try {
    const { number, capacity } = req.body;
    await db.addNewRoom(number, capacity);
    return res.status(201).json({});
  } catch (err) {
    logger('ERROR', 'API', `Error adding new room ${err}`);
    return res.status(500).send('Error adding new room');
  }
};

const addNewPatient = async (req, res) => {
  try {
    const { code, name, room_id } = req.body;
    await db.addNewPatient(code, name, room_id);
    res.status(201).json({});
  } catch (err) {
    logger('ERROR', 'API', `Error adding new patient ${err}`);
    res.status(500).send('Error adding new patient');
  }
};

const addNewSensor = async (req, res) => {
  try {
    const { serial_number, type, room_id, patient_id } = req.body;
    await db.addNewSensor(serial_number, type, room_id, patient_id);
    res.status(201).json({});
  } catch (err) {
    logger('ERROR', 'API', `Error adding new sensor ${err}`);
    res.status(500).send('Error adding new sensor');
  }
};

const rotateSensorPatient = async (req, res) => {
  try {
    const { serial_number, room_id, patient_id } = req.body;
    const sensor = await db.rotatePatientSensor(
      serial_number,
      room_id,
      patient_id,
    );
    res.status(200).json(sensor);
  } catch (err) {
    logger('ERROR', 'API', `Error rotating sensor to another patient ${err}`);
    res.status(500).send('Error rotating sensor patient');
  }
};

const addSensorReading = async (req, res) => {
  try {
    const { sensor_id, value } = req.body;
    const sensor = await db.addSensorReading(sensor_id, value);
    res.status(201).json(sensor);
  } catch (err) {
    logger('ERROR', 'API', `Error adding sensor reading ${err}`);
    res.status(500).send('Error adding sensor reading');
  }
};

const getSensorReadings = async (req, res) => {
  try {
    const { sensor_id } = req.body;
    const sensorReadigns = await db.getSensorReadings(sensor_id);
    res.status(200).json({ readings: sensorReadigns });
  } catch (err) {
    logger('ERROR', 'API', `Error fetching sensor readings ${err}`);
    res.status(500).send(`Error fetching sensor readings`);
  }
};

router.route('/all-data').get(getAllData);
router.route('/rooms').post(addNewRoom);
router.route('/patients').post(addNewPatient);
router.route('/sensors').post(addNewSensor);
router.route('/sensors/reading').get(getSensorReadings).post(addSensorReading);
router.route('/sensors/rotate-sensor').patch(rotateSensorPatient);

module.exports = router;
