const express = require('express');

const db = require('./db');
const { logger } = require('./logger');

const router = express.Router();

// const colors = ['red', 'green', 'blue', 'orange', 'purple', 'pink'];

const getAllData = async (req, res) => {
  let colors = [
    '#000000',
    '#1ECBE1',
    '#E1341E',
    '#1DE22C',
    '#E21DD3',
    '#3BE41B',
    '#C41BE4',
    '#6B40BF',
    '#94BF40',
  ];
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
                if (colors.length !== 0) {
                  colors.shift();
                } else {
                  colors = [
                    '#000000',
                    '#1ECBE1',
                    '#E1341E',
                    '#1DE22C',
                    '#E21DD3',
                    '#3BE41B',
                    '#C41BE4',
                    '#6B40BF',
                    '#94BF40',
                  ];
                  colors.shift();
                }
                return {
                  sensor_id: sensor.sensor_id,
                  sensor_serial_number: sensor.sensor_serial_number,
                  color: colors[0],
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
    const { serial_number, type, unit, room_id, patient_id } = req.body;
    await db.addNewSensor(serial_number, type, unit, room_id, patient_id);
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

const getPatientSummary = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const patient_sensors = await db.getSensorsByPatient(patient_id);
    const patient_summary = await Promise.all(
      patient_sensors.map(async (sensor) => {
        const sensors_readings = await db.getSensorReadings(sensor.sensor_id);
        const data = await Promise.all(
          sensors_readings.map((sensor_readings) => ({
            timestamp: sensor_readings.timestamp,
            value: sensor_readings.value,
          })),
        );
        return {
          sensor_id: sensor.sensor_id,
          sensor_type: sensor.sensor_type,
          sensor_unit: sensor.sensor_unit,
          summary: 0,
          readings: data.reverse(),
        };
      }),
    );
    patient_summary.forEach((sensor) => {
      const sum = sensor['readings'].reduce((prev, cur) => cur.value + prev, 0);
      sensor.summary = sum / sensor['readings'].length;
    });
    res.status(200).json(patient_summary);
  } catch (err) {
    logger('ERROR', 'API', `Error getting patient summary ${err}`);
    res.status(500).send('Error getting patient summary');
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
    const { sensor_id } = req.params;
    const sensorReadigns = await db.getSensorReadings(sensor_id);
    res.status(200).json({ readings: sensorReadigns.reverse() });
  } catch (err) {
    logger('ERROR', 'API', `Error fetching sensor readings ${err}`);
    res.status(500).send(`Error fetching sensor readings`);
  }
};

router.route('/all-data').get(getAllData);
router.route('/rooms').post(addNewRoom);
router.route('/patients').post(addNewPatient);
router.route('/sensors').post(addNewSensor);
router.route('/sensors/reading').post(addSensorReading);
router.route('/patients/:patient_id/summary').get(getPatientSummary);
router.route('/sensors/:sensor_id/readings').get(getSensorReadings);
router.route('/sensors/rotate-sensor').patch(rotateSensorPatient);

module.exports = router;
