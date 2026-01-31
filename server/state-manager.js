const { v4: uuid } = require("uuid");

class DrawingState {
  constructor() {
    this.strokes = [];
    this.redoStack = [];
  }

  startStroke(userId, data) {
    return {
      id: uuid(),
      userId,
      tool: data.tool,
      color: data.color,
      width: data.width,
      points: [{ x: data.x, y: data.y }]
    };
  }

  addPoint(stroke, x, y) {
    stroke.points.push({ x, y });
  }

  commitStroke(stroke) {
    this.strokes.push(stroke);
    this.redoStack = []; // 🔥 invalidate redo on new action
  }

  undo() {
    if (!this.strokes.length) return null;
    const stroke = this.strokes.pop();
    this.redoStack.push(stroke);
    return this.strokes;
  }

  redo() {
    if (!this.redoStack.length) return null;
    const stroke = this.redoStack.pop();
    this.strokes.push(stroke);
    return this.strokes;
  }

  getAllStrokes() {
    return this.strokes;
  }
}

module.exports = DrawingState;
