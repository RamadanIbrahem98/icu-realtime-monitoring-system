const { EventEmitter } = require('events');
const { Server } = require('ws');
const express = require('express');
const cors = require('cors');
const emitter = new EventEmitter();
let server = express();
const { logger } = require('./logger');
const db = require('./db');
const router = require('./endpoints');

server.use(cors());
server.use(express.json());
db.config();

server.use('/', router);

server = server.listen(process.env.PORT || 80, () =>
  logger('INFO', 'Server', `Server started on port ${process.env.PORT || 80}`),
);

const wss = new Server({ server });

let chip;
const devices = {};

emitter.on('controlSignal', (signal) => {
  chip.send(signal);
});

emitter.on('sendReading', (reading) => {
  const { sensor, value } = reading;
  devices.forEach((device) => {
    if (device[1] === sensor) {
      device[0].send(value);
    }
  });
});

wss.on('connection', function connection(ws, req) {
  switch (req.url) {
    case '/master':
      chip = ws;
      logger('INFO', 'Master', 'Master Connected');
      ws.on('message', async (message) => {
        logger('DATA', 'Master', message);
        try {
          reading = JSON.parse(message);
          await db.addSensorReading(reading.sensor_id, reading.value);
          emitter.emit('sendReading', reading);
        } catch (error) {
          logger('ERROR', 'Master Data', 'Parsing JSON Data');
        }
      });
      chip.on('close', () => {
        logger('WARNING', 'Master', 'Master Closed');
      });
      break;
    case '/slave':
      logger('INFO', 'Slave', 'Slave Connected');
      ws.plottedSensor = null;
      devices[ws.id] = [ws, null];
      ws.on('message', async (signal) => {
        signal = await JSON.parse(signal);
        if (signal.type === 'control') {
          logger('DATA', 'Slave', signal);
          emitter.emit('controlSignal', signal.value);
        } else if (signal.type === 'sensor') {
          logger('DATA', 'Slave', signal);
          devices[ws.id][1] = signal.value;
        }
      });
      break;
  }
});

wss.on('error', (error) => {
  logger('ERROR', 'Server', error);
});
