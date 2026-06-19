import {
  addStroke,
  clearBoard,
  deleteStroke,
  getBoard,
  redoStroke,
  undoStroke,
  updateStroke,
} from "../services/roomStore.js";
import {
  isPoint,
  isSegment,
  isStrokeObject,
  normalizeRoomId,
} from "../utils/validation.js";

const emitClientError = (socket, message) => {
  socket.emit("whiteboard-error", { message });
};

export const registerWhiteboardSocket = (io) => {
  io.on("connection", (socket) => {
    socket.on("join-room", (rawRoomId) => {
      const roomId = normalizeRoomId(rawRoomId);
      if (!roomId) {
        emitClientError(socket, "Invalid room id.");
        return;
      }

      if (socket.data.roomId && socket.data.roomId !== roomId) {
        socket.leave(socket.data.roomId);
      }

      socket.data.roomId = roomId;
      socket.join(roomId);
      socket.emit("load-board", getBoard(roomId));
    });

    socket.on("draw-stroke", ({ roomId: rawRoomId, strokeObject } = {}) => {
      const roomId = normalizeRoomId(rawRoomId);
      if (!roomId || !isStrokeObject(strokeObject)) {
        emitClientError(socket, "Invalid stroke payload.");
        return;
      }

      addStroke(roomId, strokeObject);
      socket.to(roomId).emit("draw-stroke", strokeObject);
    });

    socket.on("draw-segment", ({ roomId: rawRoomId, segment } = {}) => {
      const roomId = normalizeRoomId(rawRoomId);
      if (!roomId || !isSegment(segment)) return;

      socket.to(roomId).emit("draw-segment", segment);
    });

    socket.on("shape-preview", ({ roomId: rawRoomId, draft } = {}) => {
      const roomId = normalizeRoomId(rawRoomId);
      if (!roomId || !isStrokeObject(draft)) return;

      socket.to(roomId).emit("shape-preview", { socketId: socket.id, draft });
    });

    socket.on("update-stroke", ({ roomId: rawRoomId, strokeObject } = {}) => {
      const roomId = normalizeRoomId(rawRoomId);
      if (!roomId || !isStrokeObject(strokeObject)) {
        emitClientError(socket, "Invalid update payload.");
        return;
      }

      updateStroke(roomId, strokeObject);
      socket.to(roomId).emit("update-stroke", strokeObject);
    });

    socket.on("delete-stroke", ({ roomId: rawRoomId, strokeId } = {}) => {
      const roomId = normalizeRoomId(rawRoomId);
      if (!roomId || strokeId === undefined || strokeId === null) {
        emitClientError(socket, "Invalid delete payload.");
        return;
      }

      deleteStroke(roomId, strokeId);
      socket.to(roomId).emit("delete-stroke", strokeId);
    });

    socket.on("cursor-move", ({ roomId: rawRoomId, x, y } = {}) => {
      const roomId = normalizeRoomId(rawRoomId);
      if (!roomId || !isPoint({ x, y })) return;

      socket.to(roomId).emit("cursor-move", { x, y, socketId: socket.id });
    });

    socket.on("clear-board", (rawRoomId) => {
      const roomId = normalizeRoomId(rawRoomId);
      if (!roomId) {
        emitClientError(socket, "Invalid room id.");
        return;
      }

      clearBoard(roomId);
      socket.to(roomId).emit("clear-board");
    });

    socket.on("undo-stroke", (rawRoomId) => {
      const roomId = normalizeRoomId(rawRoomId);
      if (!roomId) return;

      const removedStroke = undoStroke(roomId);
      if (removedStroke) {
        socket.to(roomId).emit("undo-stroke", removedStroke);
      }
    });

    socket.on("redo-stroke", ({ roomId: rawRoomId, strokeObject } = {}) => {
      const roomId = normalizeRoomId(rawRoomId);
      if (!roomId || !isStrokeObject(strokeObject)) {
        emitClientError(socket, "Invalid redo payload.");
        return;
      }

      redoStroke(roomId, strokeObject);
      socket.to(roomId).emit("redo-stroke", strokeObject);
    });
  });
};
