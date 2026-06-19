import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

const roomBoards = {}; 
io.on("connection", (socket) => {
  console.log("client connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);

    if (!roomBoards[roomId]) {
      roomBoards[roomId] = [];
    }

    socket.emit("load-board", roomBoards[roomId]);
  });

  socket.on("draw-stroke", ({ roomId, strokeObject }) => {
    if (!roomBoards[roomId]) {
      roomBoards[roomId] = [];
    }
    roomBoards[roomId].push(strokeObject);

    socket.to(roomId).emit("draw-stroke", strokeObject);
  });

  socket.on("cursor-move", ({ roomId, x, y }) => {
    socket.to(roomId).emit("cursor-move", { x, y, socketId: socket.id });
  });
  
  socket.on("clear-board", (roomId) => {
    roomBoards[roomId] = [];
    socket.to(roomId).emit("clear-board");
  });
});

server.listen(3001, () => {
  console.log("server running on 3001");
});
