const roomBoards = new Map();

export const getBoard = (roomId) => {
  if (!roomBoards.has(roomId)) {
    roomBoards.set(roomId, []);
  }

  return roomBoards.get(roomId);
};

export const setBoard = (roomId, board) => {
  roomBoards.set(roomId, board);
};

export const addStroke = (roomId, strokeObject) => {
  getBoard(roomId).push(strokeObject);
};

export const updateStroke = (roomId, strokeObject) => {
  const board = getBoard(roomId);
  const index = board.findIndex((stroke) => stroke.id === strokeObject.id);

  if (index === -1) return false;

  board[index] = strokeObject;
  return true;
};

export const deleteStroke = (roomId, strokeId) => {
  const board = getBoard(roomId);
  setBoard(
    roomId,
    board.filter((stroke) => stroke.id !== strokeId),
  );
};

export const clearBoard = (roomId) => {
  setBoard(roomId, []);
};

export const undoStroke = (roomId) => getBoard(roomId).pop() ?? null;

export const redoStroke = addStroke;
