const { useEffect, useRef, useState } = React;

function App() {
  //Refs
  const canvasRef = useRef(null);
  const cursorCanvasRef = useRef(null);

  const engineRef = useRef(null);
  const socketRef = useRef(null);
  const myIdRef = useRef(null);

  const cursorsRef = useRef({});
  const activeRemoteStyles = useRef({});
  const usersRef = useRef({});
  const rectStartRef = useRef(null);

  // UI State
  const [users, setUsers] = useState({});
  const [activeDrawers, setActiveDrawers] = useState([]);

  // Tool State
  const [tool, setTool] = useState("brush");
  const [color, setColor] = useState("#000000");
  const [width, setWidth] = useState(4);

  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const widthRef = useRef(width);

  // 🔥 ADDED: rectangle preview helper
  function drawRectPreview(start, end) {
    const canvas = cursorCanvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = colorRef.current;
    ctx.lineWidth = widthRef.current;
    ctx.setLineDash([6, 4]);

    ctx.strokeRect(
      start.x,
      start.y,
      end.x - start.x,
      end.y - start.y
    );

    ctx.setLineDash([]);
  }

  // WebSocket
  useEffect(() => {
    socketRef.current = window.SocketClient.createSocket((msg) => {

      // WELCOME / SYNC
      if (msg.type === "welcome") {
        myIdRef.current = msg.id;

        const map = {};
        msg.users.forEach(u => (map[u.id] = u));
        usersRef.current = map;
        setUsers(map);

        if (msg.strokes && engineRef.current) {
          const engine = engineRef.current;
          engine.clear();

          msg.strokes.forEach(stroke => {
            if (stroke.tool === "rect") {
              const [start, end] = stroke.points;
              const ctx = engine.ctx;

              ctx.strokeStyle = stroke.color;
              ctx.lineWidth = stroke.width;
              ctx.strokeRect(
                start.x,
                start.y,
                end.x - start.x,
                end.y - start.y
              );
              return;
            }
            engine.setTool(stroke.tool);
            engine.setColor(stroke.color);
            engine.setWidth(stroke.width);

            const [first, ...rest] = stroke.points;
            engine.start(first.x, first.y);
            rest.forEach(p => engine.move(p.x, p.y));
            engine.end();
          });
        }
        return;
      }


      // USER JOIN / LEAVE
      if (msg.type === "user-joined") {
        const updated = { ...usersRef.current, [msg.id]: msg };
        usersRef.current = updated;
        setUsers(updated);
        return;
      }

      if (msg.type === "user-left") {
        const updated = { ...usersRef.current };
        delete updated[msg.id];
        usersRef.current = updated;
        setUsers(updated);

        delete cursorsRef.current[msg.id];
        delete activeRemoteStyles.current[msg.id];
        setActiveDrawers(d => d.filter(id => id !== msg.id));
        drawGhostCursors();
        return;
      }

      // CURSORS
      if (msg.type === "cursor") {
        cursorsRef.current[msg.from] = { x: msg.x, y: msg.y };
        drawGhostCursors();
        return;
      }

      // SYNC (UNDO / REDO)
      if (msg.type === "sync") {
        const engine = engineRef.current;
        engine.clear();

        msg.strokes.forEach(stroke => {
          engine.setTool(stroke.tool);
          engine.setColor(stroke.color);
          engine.setWidth(stroke.width);

          const [first, ...rest] = stroke.points;
          engine.start(first.x, first.y);
          rest.forEach(p => engine.move(p.x, p.y));
          engine.end();
        });
        return;
      }

      // REMOTE DRAWING
      if (msg.type === "stroke-start") {
        activeRemoteStyles.current[msg.from] = {
          tool: msg.tool,
          color: msg.color,
          width: msg.width
        };

        setActiveDrawers(d =>
          d.includes(msg.from) ? d : [...d, msg.from]
        );

        const engine = engineRef.current;
        const local = engine.getState();

        engine.setTool(msg.tool);
        engine.setColor(msg.color);
        engine.setWidth(msg.width);
        engine.start(msg.x, msg.y);

        engine.setTool(local.tool);
        engine.setColor(local.color);
        engine.setWidth(local.width);
        return;
      }

      if (msg.type === "stroke-point") {
        const style = activeRemoteStyles.current[msg.from];
        if (!style) return;

        const engine = engineRef.current;
        const local = engine.getState();

        engine.setTool(style.tool);
        engine.setColor(style.color);
        engine.setWidth(style.width);
        engine.move(msg.x, msg.y);

        engine.setTool(local.tool);
        engine.setColor(local.color);
        engine.setWidth(local.width);
        return;
      }

      if (msg.type === "stroke-end") {
        engineRef.current.end();
        delete activeRemoteStyles.current[msg.from];
        setActiveDrawers(d => d.filter(id => id !== msg.from));
        return;
      }

      // SHAPES (RECTANGLE)
      if (msg.type === "shape" && msg.shape === "rect") {
        const ctx = engineRef.current.ctx;
        ctx.strokeStyle = msg.color;
        ctx.lineWidth = msg.width;
        ctx.strokeRect(
          msg.start.x,
          msg.start.y,
          msg.end.x - msg.start.x,
          msg.end.y - msg.start.y
        );
      }
    });
  }, []);

  // Canvas Setup (RUN ONCE)
  useEffect(() => {
    const canvas = canvasRef.current;
    const cursorCanvas = cursorCanvasRef.current;

    engineRef.current = window.CanvasEngine.createCanvasEngine(canvas);

    function resize() {
      [canvas, cursorCanvas].forEach(c => {
        c.width = window.innerWidth;
        c.height = window.innerHeight - 50;
      });
      drawGhostCursors();
    }

    resize();
    window.addEventListener("resize", resize);

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const down = (e) => {
      if (!e.isPrimary) return;

      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);

      const p = getPos(e);

      if (toolRef.current === "rect") {
        rectStartRef.current = p;
        return;
      }

      engineRef.current.setTool(toolRef.current);
      engineRef.current.setColor(colorRef.current);
      engineRef.current.setWidth(widthRef.current);

      engineRef.current.start(p.x, p.y);

      socketRef.current.send({
        type: "stroke-start",
        x: p.x,
        y: p.y,
        tool: toolRef.current,
        color: colorRef.current,
        width: widthRef.current
      });
    };

    const move = (e) => {
      const p = getPos(e);

      socketRef.current.send({ type: "cursor", x: p.x, y: p.y });

      if (toolRef.current === "rect" && rectStartRef.current) {
        drawRectPreview(rectStartRef.current, p);
        return;
      }

      engineRef.current.move(p.x, p.y);
      socketRef.current.send({ type: "stroke-point", x: p.x, y: p.y });
    };

    const up = (e) => {
    const p = getPos(e);
      if (toolRef.current === "rect" && rectStartRef.current) {
        const start = rectStartRef.current;
        const end = p;

        // draw locally
        const ctx = engineRef.current.ctx;
        ctx.strokeStyle = colorRef.current;
        ctx.lineWidth = widthRef.current;
        // ctx.strokeRect(
        //   start.x,
        //   start.y,
        //   end.x - start.x,
        //   end.y - start.y
        // );

        // clear preview layer
        const previewCtx = cursorCanvasRef.current.getContext("2d");
        previewCtx.clearRect(
          0,
          0,
          cursorCanvasRef.current.width,
          cursorCanvasRef.current.height
        );

        // broadcast to others
        socketRef.current.send({
          type: "stroke-rect",
          start,
          end,
          color: colorRef.current,
          width: widthRef.current
        });


        rectStartRef.current = null;
        if (e.pointerId !== undefined) {
          canvas.releasePointerCapture(e.pointerId);
        }
        setTool("brush");
        return;
      }


      engineRef.current.end();
      socketRef.current.send({ type: "stroke-end" });

      if (e.pointerId !== undefined) {
        canvas.releasePointerCapture(e.pointerId);
      }
    };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  // Ghost Cursors
  function drawGhostCursors() {
    const canvas = cursorCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    Object.entries(cursorsRef.current).forEach(([id, pos]) => {
      const user = usersRef.current[id];
      if (!user) return;

      ctx.fillStyle = user.color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = "12px sans-serif";
      ctx.fillText(
        id === myIdRef.current ? "You" : id.slice(0, 4),
        pos.x + 8,
        pos.y - 8
      );
    });
  }

  useEffect(() => {
    toolRef.current = tool;
    colorRef.current = color;
    widthRef.current = width;
  }, [tool, color, width]);

  // UI
  return React.createElement(
    "div",
    { className: "app" },

    React.createElement(
      "div",
      { className: "toolbar" },

      React.createElement("button", { onClick: () => setTool("brush") }, "Brush"),
      React.createElement("button", { onClick: () => setTool("eraser") }, "Eraser"),
      React.createElement("button", { onClick: () => setTool("rect") }, "Rectangle"),

      React.createElement("button", {
        onClick: () => socketRef.current.send({ type: "undo" })
      }, "Undo"),

      React.createElement("button", {
        onClick: () => socketRef.current.send({ type: "redo" })
      }, "Redo"),

      React.createElement("input", {
        type: "color",
        value: color,
        onChange: e => setColor(e.target.value)
      }),

      React.createElement("input", {
        type: "range",
        min: 1,
        max: 30,
        value: width,
        onChange: e => setWidth(+e.target.value)
      }),

      React.createElement(
        "div",
        { className: "users" },
        Object.values(users).map(u =>
          React.createElement(
            "span",
            {
              key: u.id,
              style: {
                color: u.color,
                marginLeft: "10px",
                fontWeight: u.id === myIdRef.current ? "bold" : "normal"
              }
            },
            u.id === myIdRef.current ? "● You" : `● ${u.id.slice(0, 4)}`
          )
        )
      ),

      React.createElement(
        "div",
        { style: { marginLeft: "20px", fontSize: "12px", opacity: 0.8 } },
        activeDrawers.length > 0
          ? "Drawing: " +
              activeDrawers
                .map(id => (id === myIdRef.current ? "You" : id.slice(0, 4)))
                .join(", ")
          : "No one is drawing"
      )
    ),

    React.createElement("canvas", { ref: canvasRef, className: "draw-canvas" }),
    React.createElement("canvas", { ref: cursorCanvasRef, className: "cursor-canvas" })
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
