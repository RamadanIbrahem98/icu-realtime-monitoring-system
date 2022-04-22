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
  chip.send(signal, { binary: false });
});

emitter.on('sendReading', ({ sensor_id, value }) => {
  try {
    for (const [_, [ws, sensor]] of Object.entries(devices)) {
      if (sensor === sensor_id) {
        ws.send(value, { binary: false });
      }
    }
  } catch {
    logger('ERROR', 'WebSocket', 'Could not send reading to device');
  }
});

wss.on('connection', function connection(ws, req) {
  switch (req.url) {
    case '/master':
      chip = ws;
      logger('INFO', 'Master', 'Master Connected');
      ws.on('message', async (message) => {
        logger('DATA', 'Master', message);
        try {
          reading = await JSON.parse(message);
          emitter.emit('sendReading', reading);
        } catch (error) {
          logger('ERROR', 'Master Data', 'Parsing JSON Data 50');
        }
        try {
          await db.addSensorReading(reading.sensor_id, reading.value);
        } catch {
          logger('ERROR', 'DATABASE', 'Could not insert new reading');
        }
      });
      chip.on('close', () => {
        logger('WARNING', 'Master', 'Master Closed');
      });
      break;
    case '/slave':
      logger('INFO', 'Slave', 'Slave Connected');
      ws.plottedSensor = null;
      devices[ws] = [ws, null];
      ws.on('message', async (signal) => {
        signal = await JSON.parse(signal);
        if (signal.type === 'control') {
          logger('DATA', 'Slave', signal);
          emitter.emit('controlSignal', signal.value);
        } else if (signal.type === 'sensor') {
          logger('DATA', 'Slave', signal);
          devices[ws][1] = signal.value;
        }
      });
      break;
  }
});

wss.on('error', (error) => {
  logger('ERROR', 'Server', error);
});
