import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { CLIENT_ORIGIN, PORT } from "./src/config/env.js";
import { registerWhiteboardSocket } from "./src/socket/whiteboardSocket.js";

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
  },
});

registerWhiteboardSocket(io);

server.listen(PORT, () => {
  console.info(`server running on ${PORT}`);
});
