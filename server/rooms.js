const StateManager = require("./state-manager");

class Room {
  constructor(id) {
    this.id = id;
    this.clients = new Map(); // userId -> { ws, color }
    this.state = new StateManager();
    this.activeStrokes = new Map(); // userId -> current stroke
  }
}

const rooms = new Map();

// get existing rooms or current one
function getRoom(roomId = "default") {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Room(roomId));
  }
  return rooms.get(roomId);
}

module.exports = {
  getRoom
};
