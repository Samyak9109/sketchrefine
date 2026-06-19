import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { isAllowedClientOrigin, PORT } from "./src/config/env.js";
import { registerWhiteboardSocket } from "./src/socket/whiteboardSocket.js";

const app = express();

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedClientOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS.`));
  },
};

app.use(cors(corsOptions));

app.get("/", (_request, response) => {
  response.json({ ok: true, service: "Scribbl Socket.IO server" });
});

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions,
});

registerWhiteboardSocket(io);

server.listen(PORT, () => {
  console.info(`server running on ${PORT}`);
});
