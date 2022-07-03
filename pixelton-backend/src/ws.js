const WebSocket = require("ws");

const PORT = process.env.PORT || 9000;

const wsServer = new WebSocket.Server({ port: PORT });

let connections = [];

// Creating connection using websocket
wsServer.on("connection", (ws) => {
  console.log("new client connected");
  connections.push(ws);
  // sending message
  ws.on("message", (data) => {
    console.log(`Client has sent us: ${data}`);
    ws.send(`You sent: ${data}`);
  });
  // handling what to do when clients disconnects from server
  ws.on("close", () => {
    console.log("the client has connected");
    connections = connections.filter((conn) => conn !== ws);
  });
  // handling client connection error
  ws.onerror = function () {
    console.log("Some Error occurred");
    connections = connections.filter((conn) => conn !== ws);
  };
});
console.log("The WebSocket server is running on port " + PORT);

const getWSConnections = () => connections;

let queue = [];

const sendMassPixelPoints = (point) => {
  queue.push(point);
};

setInterval(() => {
  if (queue.length === 0) return;
  const clients = getWSConnections();
  clients.forEach((client) => {
    client.send(
      JSON.stringify({
        type: "paint_pixel",
        updates: queue,
      })
    );
  });
  queue = [];
}, 300);

export { getWSConnections, sendMassPixelPoints };
