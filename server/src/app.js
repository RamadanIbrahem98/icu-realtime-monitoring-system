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

server.use((req, res, next) => {
  logger('INFO', 'API', `${req.method} ${req.path}`);
  next();
});

server.use('/', router);

server = server.listen(process.env.PORT || 80, () =>
  logger('INFO', 'Server', `Server started on port ${process.env.PORT || 80}`),
);

const wss = new Server({ server });

let chip;
const devices = [];

emitter.on('controlSignal', (data) => {
  chip.send(JSON.stringify({ id: data.sensor_id, is_active: data.state }), {
    binary: false,
  });
});

emitter.on('sendReading', ({ sensor_id, value }) => {
  try {
    data = {
      timestamp: new Date().toISOString(),
      value,
    };
    devices.forEach((device) => {
      if (device.plottedSensor === sensor_id && device.isOpen) {
        device.buffer.push(data);
        if (device.buffer.length > 100) {
          device.buffer.shift();
        }
        device.send(JSON.stringify(device.buffer), {
          binary: false,
        });
      }
    });
  } catch (err) {
    logger('ERROR', 'WebSocket', err);
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
          logger('ERROR', 'Master Data', 'Parsing JSON Data');
        }
        try {
          await db.addSensorReading(reading.sensor_id, reading.value);
        } catch (err) {
          logger('ERROR', 'DATABASE', err);
        }
      });
      chip.on('close', () => {
        logger('WARNING', 'Master', 'Master Closed');
      });
      break;
    case '/slave':
      logger('INFO', 'Slave', 'Slave Connected');
      ws.plottedSensor = null;
      ws.isOpen = true;
      ws.buffer = [];
      devices.push(ws);
      ws.on('message', async (signal) => {
        logger('DATA', 'Slave', signal);
        signal = await JSON.parse(signal);
        if (signal.type === 'control') {
          data = { state: signal.state, sensor_id: ws.plottedSensor };
          emitter.emit('controlSignal', data);
        } else if (signal.type === 'sensor') {
          ws.plottedSensor = signal.sensor_id;
          ws.buffer = [];
        } else if (signal.type === 'toggle') {
          ws.isOpen = signal.toggle;
        }
      });
      break;
  }
});

wss.on('error', (error) => {
  logger('ERROR', 'Server', error);
});
