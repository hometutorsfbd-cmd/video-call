
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    let data;
    try { data = JSON.parse(msg); } catch { return; }

    const room = data.room;
    if (!room) return;

    ws.room = room;

    wss.clients.forEach(client => {
      if (
        client !== ws &&
        client.readyState === WebSocket.OPEN &&
        client.room === room
      ) {
        client.send(JSON.stringify(data));
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Listening on ' + PORT));
