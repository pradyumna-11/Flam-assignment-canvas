const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const { v4: uuid } = require("uuid");
const { getRoom } = require("./rooms");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, "../client")));

function broadcast(room, data, exceptWs) {
  const msg = JSON.stringify(data);
  for (const ws of room.clients.values()) {
    if (ws !== exceptWs && ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

wss.on("connection", (ws, req) => {
  const id = uuid();

  // Parse room from URL
  const params = new URLSearchParams(req.url.replace("/?", ""));
  const roomId = params.get("room") || "default";
  const room = getRoom(roomId);

  // assign color
  const color = `hsl(${Math.random() * 360}, 70%, 60%)`;

  // register client in room
  room.clients.set(id, ws);

  // send welcome + room state
  ws.send(JSON.stringify({
    type: "welcome",
    id,
    color,
    users: Array.from(room.clients.keys()).map(uid => ({
      id: uid,
      color
    })),
    strokes: room.state.getAllStrokes()
  }));

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

      case "cursor":
        broadcast(room, { ...msg, from: id }, ws);
        break;

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
    }
  });

  ws.on("close", () => {
    room.clients.delete(id);
    broadcast(room, { type: "user-left", id });
  });
});

server.listen(3000, () =>
  console.log("Server running at http://localhost:3000")
);
