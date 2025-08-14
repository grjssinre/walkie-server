// server.js
const WebSocket = require('ws');
const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

const rooms = new Map();

function joinRoom(ws, roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  rooms.get(roomId).add(ws);
  ws.roomId = roomId;
}

function leaveRoom(ws) {
  const set = rooms.get(ws.roomId);
  if (set) {
    set.delete(ws);
    if (!set.size) rooms.delete(ws.roomId);
  }
}

wss.on('connection', ws => {
  ws.on('message', (data) => {
    if (typeof data === 'string') {
      try {
        const msg = JSON.parse(data);
        if (msg.join) {
          joinRoom(ws, msg.join);
          ws.send(JSON.stringify({ joined: msg.join }));
        }
      } catch {}
      return;
    }
    const peers = rooms.get(ws.roomId) || [];
    peers.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: true });
      }
    });
  });
  ws.on('close', () => leaveRoom(ws));
});

console.log(`PTT server running on port ${PORT}`);
