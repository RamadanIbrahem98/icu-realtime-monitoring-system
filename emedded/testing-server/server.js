import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
wss.on('connection', function connection(ws) {
  console.log('connected');
  ws.on('message', function message(data) {
    console.log('received: %s', data);
    ws.send('{id:1,active:true}');
    console.log('sent: %s', '{id:1,active:false}'); //without /n
  });
});

console.log('server lisenning on port 8080');
