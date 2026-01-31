(function () {
  function createCanvasEngine(canvas) {
    const ctx = canvas.getContext("2d");

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
      ctx.scale(dpr, dpr);

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }

    resize();
    window.addEventListener("resize", resize);

    let drawing = false;

    const state = {
      tool: "brush",
      color: "#000000",
      width: 4,
    };

    function setTool(tool) {
      state.tool = tool;
    }

    function setColor(color) {
      state.color = color;
    }

    function setWidth(w) {
      state.width = w;
    }

    function start(x, y) {
      drawing = true;
      ctx.beginPath();
      ctx.moveTo(x, y);
    }

    function move(x, y) {
      if (!drawing) return;

      ctx.strokeStyle = state.color;
      ctx.lineWidth = state.width;

      if (state.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
      } else {
        ctx.globalCompositeOperation = "source-over";
      }

      ctx.lineTo(x, y);
      ctx.stroke();
    }

    function end() {
      drawing = false;
      ctx.closePath();
    }

    function clear() {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
    }

    return {
      setTool,
      setColor,
      setWidth,
      start,
      move,
      end,
      clear,
      getState: () => ({ ...state })
    };

  }

  window.CanvasEngine = { createCanvasEngine };
})();
