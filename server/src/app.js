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
  chip.send(
    JSON.stringify({ id: data.sensor_id, active: data.state ? 1 : 0 }),
    {
      binary: false,
    },
  );
});

emitter.on('sendReading', (data) => {
  try {
    devices.forEach((device) => {
      if (device.isOpen) {
        for (const [id, value] of Object.entries(data)) {
          if (device.buffer[parseInt(id, 10)]) {
            device.buffer[parseInt(id, 10)].push({
              timestamp: new Date().toISOString(),
              value,
            });
          } else {
            device.buffer[parseInt(id, 10)] = [
              { timestamp: new Date().toISOString(), value },
            ];
          }
        }
        if (device.buffer.length > 100) {
          Object.entries(device.buffer).forEach(([id, values]) => {
            device.buffer[id] = values.slice(1);
          });
        }
        if (device.plottedSensor == 'summary') {
          device.send(JSON.stringify(device.buffer), {
            binary: false,
          });
        } else {
          device.send(JSON.stringify(device.buffer[device.plottedSensor]), {
            binary: false,
          });
        }
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
          // await db.addSensorReading(reading.sensor_id, reading.value);
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
      ws.plottedSensor = 'summary';
      ws.isOpen = true;
      ws.buffer = {};
      devices.push(ws);
      ws.on('message', async (signal) => {
        logger('DATA', 'Slave', signal);
        signal = await JSON.parse(signal);
        if (signal.type === 'control') {
          data = { state: signal.state, sensor_id: ws.plottedSensor };
          emitter.emit('controlSignal', data);
        } else if (signal.type === 'sensor') {
          ws.plottedSensor = signal.sensor_id;
          ws.buffer = {};
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
