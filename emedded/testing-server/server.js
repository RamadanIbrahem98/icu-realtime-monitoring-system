import { WebSocketServer } from 'ws';

const myObject = { id: 2, active: 1 };
const wss = new WebSocketServer({ port: 8080 });
wss.on('connection', function connection(ws) {
  console.log('connected');
  ws.on('message', function message(data) {
    console.log('received: %s', data);
    const stringifiyObject = JSON.stringify(myObject);
    ws.send(stringifiyObject);
    console.log('sent: %s', stringifiyObject); //without /n
  });
});

console.log('server lisenning on port 8080');
