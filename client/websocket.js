(function () {
  function createSocket(onMessage) {
    const ws = new WebSocket(`ws://${location.host}`);

    ws.onopen = () => {
      console.log("Connected to server");
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      onMessage(msg);
    };

    ws.onclose = () => {
      console.log("Disconnected");
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
