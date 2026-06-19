export const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

export const normalizeRoomId = (roomId) =>
  isNonEmptyString(roomId) ? roomId.trim() : null;

export const isPoint = (value) =>
  value &&
  typeof value.x === "number" &&
  Number.isFinite(value.x) &&
  typeof value.y === "number" &&
  Number.isFinite(value.y);

export const isStrokeObject = (value) =>
  value &&
  (typeof value.id === "string" || typeof value.id === "number") &&
  typeof value.type === "string";

export const isSegment = (value) =>
  value &&
  isPoint(value.from) &&
  isPoint(value.to) &&
  typeof value.width === "number" &&
  Number.isFinite(value.width);
