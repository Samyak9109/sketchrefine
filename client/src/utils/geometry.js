import { HIT_PADDING, HANDLE_SIZE } from "../constants/whiteboard.js";

export const getBoundsFromPoints = (points, padding = 0) => {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const left = Math.min(...xs) - padding;
  const right = Math.max(...xs) + padding;
  const top = Math.min(...ys) - padding;
  const bottom = Math.max(...ys) + padding;

  return {
    left,
    right,
    top,
    bottom,
    width: right - left,
    height: bottom - top,
  };
};

export const getDrawableBounds = (item) => {
  if (item.type === "path" || item.type === "eraser") {
    return getBoundsFromPoints(item.points, Math.max(item.width, HIT_PADDING));
  }

  return getBoundsFromPoints([item.start, item.end]);
};

export const getResizeHandles = (item) => {
  if (item.type === "shape" && ["arrow", "line"].includes(item.shape)) {
    return [
      { id: "start", x: item.start.x, y: item.start.y },
      { id: "end", x: item.end.x, y: item.end.y },
    ];
  }

  const bounds = getDrawableBounds(item);

  return [
    { id: "nw", x: bounds.left, y: bounds.top },
    { id: "ne", x: bounds.right, y: bounds.top },
    { id: "se", x: bounds.right, y: bounds.bottom },
    { id: "sw", x: bounds.left, y: bounds.bottom },
  ];
};

export const getDistanceToSegment = (point, start, end) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared,
    ),
  );
  const closest = {
    x: start.x + t * dx,
    y: start.y + t * dy,
  };

  return Math.hypot(point.x - closest.x, point.y - closest.y);
};

const isPointInBounds = (point, bounds) =>
  point.x >= bounds.left - HIT_PADDING &&
  point.x <= bounds.right + HIT_PADDING &&
  point.y >= bounds.top - HIT_PADDING &&
  point.y <= bounds.bottom + HIT_PADDING;

export const isPointInDrawable = (point, item) => {
  if (item.type === "shape" && ["arrow", "line"].includes(item.shape)) {
    return (
      getDistanceToSegment(point, item.start, item.end) <=
      Math.max(HIT_PADDING, item.width + 4)
    );
  }

  if (item.type === "path" || item.type === "eraser") {
    return item.points.some((pathPoint, index) => {
      const previous = item.points[index - 1];
      if (!previous) return false;
      return (
        getDistanceToSegment(point, previous, pathPoint) <=
        Math.max(HIT_PADDING, item.width + 4)
      );
    });
  }

  return isPointInBounds(point, getDrawableBounds(item));
};

export const getHitHandle = (point, item) =>
  getResizeHandles(item).find(
    (handle) =>
      Math.abs(point.x - handle.x) <= HANDLE_SIZE &&
      Math.abs(point.y - handle.y) <= HANDLE_SIZE,
  );

const resizeBoundsByHandle = (bounds, handleId, point) => {
  const next = { ...bounds };

  if (handleId.includes("n")) next.top = point.y;
  if (handleId.includes("s")) next.bottom = point.y;
  if (handleId.includes("w")) next.left = point.x;
  if (handleId.includes("e")) next.right = point.x;

  return next;
};

const scalePoint = (point, fromBounds, toBounds) => {
  const fromWidth = fromBounds.right - fromBounds.left || 1;
  const fromHeight = fromBounds.bottom - fromBounds.top || 1;

  return {
    x:
      toBounds.left +
      ((point.x - fromBounds.left) / fromWidth) * (toBounds.right - toBounds.left),
    y:
      toBounds.top +
      ((point.y - fromBounds.top) / fromHeight) * (toBounds.bottom - toBounds.top),
  };
};

export const resizeDrawable = (item, handleId, point) => {
  if (item.type === "shape" && ["arrow", "line"].includes(item.shape)) {
    return {
      ...item,
      [handleId]: point,
    };
  }

  const currentBounds = getDrawableBounds(item);
  const nextBounds = resizeBoundsByHandle(currentBounds, handleId, point);

  if (item.type === "path" || item.type === "eraser") {
    return {
      ...item,
      points: item.points.map((pathPoint) =>
        scalePoint(pathPoint, currentBounds, nextBounds),
      ),
    };
  }

  return {
    ...item,
    start: { x: nextBounds.left, y: nextBounds.top },
    end: { x: nextBounds.right, y: nextBounds.bottom },
  };
};

export const translateDrawable = (item, delta) => {
  if (item.type === "path" || item.type === "eraser") {
    return {
      ...item,
      points: item.points.map((pathPoint) => ({
        x: pathPoint.x + delta.x,
        y: pathPoint.y + delta.y,
      })),
    };
  }

  return {
    ...item,
    start: {
      x: item.start.x + delta.x,
      y: item.start.y + delta.y,
    },
    end: {
      x: item.end.x + delta.x,
      y: item.end.y + delta.y,
    },
  };
};
