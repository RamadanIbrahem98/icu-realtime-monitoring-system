const db = require('./db');
const express = require('express');

const router = express.Router();

const getAllData = async (req, res) => {
  try {
    const roomsIds = await db.getRoomsIds();
    const rooms = await Promise.all(
      roomsIds.map(async (room) => {
        const patientsIds = await db.getPatientsIdsByRoom(room.id);
        const patients = await Promise.all(
          patientsIds.map(async (patient) => {
            const sensorsIds = await db.getSensorsIdsByPatient(patient.id);
            const sensors = await Promise.all(
              sensorsIds.map(async (sensor) => {
                return {
                  sensor: sensor.id,
                };
              }),
            );
            return {
              patient: patient.id,
              sensors: sensors,
            };
          }),
        );
        return {
          room: room.id,
          patients: patients,
        };
      }),
    );
    res.json(rooms);
  } catch {
    res.status(500).send('Error getting data');
  }
};

const addNewRoom = async (req, res) => {
  try {
    const { number, capacity } = req.body;
    await db.addNewRoom(number, capacity);
    return res.status(201).json({});
  } catch (err) {
    return res.status(500).send(err);
  }
};

const addNewPatient = async (req, res) => {
  try {
    const { code, name, room_id } = req.body;
    await db.addNewPatient(code, name, room_id);
    res.status(201).json({});
  } catch {
    res.status(500).send('Error adding new patient');
  }
};

const addNewSensor = async (req, res) => {
  try {
    const { serial_number, type, room_id, patient_id } = req.body;
    await db.addNewSensor(serial_number, type, room_id, patient_id);
    res.status(201).json({});
  } catch (err) {
    res.status(500).send(err);
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
  } catch {
    res.status(500).send('Error rotating sensor patient');
  }
};

const addSensorReading = async (req, res) => {
  try {
    const { serial_number, value } = req.body;
    const sensor = await db.addSensorReading(serial_number, value);
    res.status(201).json(sensor);
  } catch {
    res.status(500).send('Error adding sensor reading');
  }
};

router.route('/all-data').get(getAllData);
router.route('/rooms').post(addNewRoom);
router.route('/patients').post(addNewPatient);
router.route('/sensors').post(addNewSensor);
router.route('/sensors/reading').post(addSensorReading);
router.route('/sensors/rotate-patient').patch(rotateSensorPatient);

module.exports = router;
