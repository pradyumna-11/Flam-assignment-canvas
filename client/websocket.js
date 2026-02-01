(function () {
  function createSocket(onMessage) {
    const roomId =
      new URLSearchParams(window.location.search).get("room") || "default";
    // Single WebSocket connection (room-aware)
    const ws = new WebSocket(`ws://${location.host}?room=${roomId}`);

    ws.onopen = () => {
      console.log("Connected to server (room:", roomId + ")");
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      onMessage(msg);
    };

    ws.onclose = () => {
      console.log("Disconnected from server");
    };

    function send(data) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    }

    return { send };
  }

  window.SocketClient = { createSocket };
})();
