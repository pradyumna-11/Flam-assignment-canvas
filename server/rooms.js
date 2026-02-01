const StateManager = require("./state-manager");

const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      clients: new Map(),          // userId -> ws
      state: new StateManager(),   // strokes + undo/redo
      activeStrokes: new Map()     // userId -> stroke
    });
  }
  return rooms.get(roomId);
}

module.exports = { getRoom };
