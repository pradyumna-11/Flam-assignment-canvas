const express = require("express");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");
const { v4: uuid } = require("uuid");
const { getRoom } = require("./rooms");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, "../client")));

const COLORS = [
  "#ff4757",
  "#1e90ff",
  "#2ed573",
  "#ffa502",
  "#9b59b6",
  "#00cec9",
];
let colorIndex = 0;

//broadcast helper
function broadcast(room, data, exceptWs) {
  const msg = JSON.stringify(data);
  for (const { ws } of room.clients.values()) {
    if (ws !== exceptWs && ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

wss.on("connection", (ws) => {
  const id = uuid();
  const color = COLORS[colorIndex++ % COLORS.length];

  // using a single default room
  const room = getRoom("default");

  // register client in room
  room.clients.set(id, { ws, color });

  // send welcome message
  ws.send(
    JSON.stringify({
      type: "welcome",
      id,
      color,
      users: Array.from(room.clients.entries()).map(([uid, u]) => ({
        id: uid,
        color: u.color,
      })),
      strokes: room.state.getAllStrokes(),
    })
  );

  // notify others
  broadcast(room, { type: "user-joined", id, color }, ws);

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    switch (msg.type) {
      case "stroke-start": {
        const stroke = room.state.startStroke(id, msg);
        room.activeStrokes.set(id, stroke);
        broadcast(room, { ...msg, from: id }, ws);
        break;
      }

      case "stroke-point": {
        const stroke = room.activeStrokes.get(id);
        if (!stroke) return;
        room.state.addPoint(stroke, msg.x, msg.y);
        broadcast(room, { ...msg, from: id }, ws);
        break;
      }

      case "stroke-end": {
        const stroke = room.activeStrokes.get(id);
        if (!stroke) return;
        room.state.commitStroke(stroke);
        room.activeStrokes.delete(id);
        broadcast(room, { type: "stroke-end", from: id }, ws);
        break;
      }

      case "cursor": {
        broadcast(room, { ...msg, from: id }, ws);
        break;
      }

      case "undo": {
        const strokes = room.state.undo();
        if (strokes) {
          broadcast(room, { type: "sync", strokes });
        }
        break;
      }

      case "redo": {
        const strokes = room.state.redo();
        if (strokes) {
          broadcast(room, { type: "sync", strokes });
        }
        break;
      }

      default:
        break;
    }
  });

  ws.on("close", () => {
    room.clients.delete(id);
    room.activeStrokes.delete(id);
    broadcast(room, { type: "user-left", id });
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
