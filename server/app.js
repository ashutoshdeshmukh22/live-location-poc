const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

app.use(cors());

const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

app.get("/", (req, res) => {
  res.send("Live Location Sharing App");
});

const clients = {};

io.on("connection", (socket) => {
  console.log("New client connected");
  // Emit a notification to all clients when a new client connects
  io.emit("newUserAlert", {
    id: socket.id,
    message: `User ${socket.id} has joined!`,
  });

  // Store the client's id
  clients[socket.id] = null;

  // Event: Receive location data from client
  socket.on("sendLocation", (locationData) => {
    console.log("Received location data:", locationData);
    // Store location data in clients object
    clients[socket.id] = locationData;
    // Broadcast location data to all clients except the sender
    socket.broadcast.emit("updateLocation", { id: socket.id, ...locationData });
  });

  // Event: Client disconnects
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    delete clients[socket.id];
    // Notify other clients to remove the marker
    io.emit("removeLocation", { id: socket.id });
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
