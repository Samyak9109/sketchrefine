import { HANDLE_SIZE, TEXT_FONT_SIZE } from "../constants/whiteboard.js";
import { getDrawableBounds, getResizeHandles } from "./geometry.js";

export const drawSegmentOnCanvas = (ctx, { from, to, color, width, operation }) => {
  if (!ctx || !from || !to) return;

  ctx.save();
  ctx.globalCompositeOperation =
    operation === "erase" ? "destination-out" : "source-over";
  ctx.strokeStyle = operation === "erase" ? "#000000" : color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
};

const drawPath = (ctx, item) => {
  if (!item.points?.length) return;

  ctx.save();
  ctx.globalCompositeOperation =
    item.type === "eraser" ? "destination-out" : "source-over";
  ctx.strokeStyle = item.type === "eraser" ? "#000000" : item.color;
  ctx.lineWidth = item.width;
  ctx.beginPath();

  item.points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });

  ctx.stroke();
  ctx.restore();
};

const drawArrowHead = (ctx, from, to, width) => {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const size = Math.max(12, width * 3);

  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - size * Math.cos(angle - Math.PI / 6),
    to.y - size * Math.sin(angle - Math.PI / 6),
  );
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - size * Math.cos(angle + Math.PI / 6),
    to.y - size * Math.sin(angle + Math.PI / 6),
  );
  ctx.stroke();
};

const drawShapePath = (ctx, item) => {
  const { start, end } = item;
  const bounds = getDrawableBounds(item);
  const { left, right, top, bottom, width: boxWidth, height } = bounds;
  const centerX = left + boxWidth / 2;
  const centerY = top + height / 2;
  const skew = Math.min(boxWidth * 0.22, 34);

  if (["arrow", "line"].includes(item.shape)) {
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    return;
  }

  if (["rectangle", "process"].includes(item.shape)) {
    ctx.rect(left, top, boxWidth, height);
    return;
  }

  if (item.shape === "circle") {
    const radius = Math.max(Math.min(boxWidth, height) / 2, 1);
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    return;
  }

  if (["ellipse", "oval"].includes(item.shape)) {
    ctx.ellipse(
      centerX,
      centerY,
      Math.max(boxWidth / 2, 1),
      Math.max(height / 2, 1),
      0,
      0,
      Math.PI * 2,
    );
    return;
  }

  if (item.shape === "diamond") {
    ctx.moveTo(centerX, top);
    ctx.lineTo(right, centerY);
    ctx.lineTo(centerX, bottom);
    ctx.lineTo(left, centerY);
    ctx.closePath();
    return;
  }

  if (item.shape === "parallelogram") {
    ctx.moveTo(left + skew, top);
    ctx.lineTo(right, top);
    ctx.lineTo(right - skew, bottom);
    ctx.lineTo(left, bottom);
    ctx.closePath();
    return;
  }

  if (item.shape === "terminator") {
    const radius = Math.min(height / 2, boxWidth / 2);
    ctx.roundRect(left, top, boxWidth, height, radius);
    return;
  }

  if (item.shape === "hexagon") {
    const offset = Math.min(boxWidth * 0.22, 36);
    ctx.moveTo(left + offset, top);
    ctx.lineTo(right - offset, top);
    ctx.lineTo(right, centerY);
    ctx.lineTo(right - offset, bottom);
    ctx.lineTo(left + offset, bottom);
    ctx.lineTo(left, centerY);
    ctx.closePath();
    return;
  }

  if (item.shape === "document") {
    const wave = Math.min(height * 0.18, 24);
    ctx.moveTo(left, top);
    ctx.lineTo(right, top);
    ctx.lineTo(right, bottom - wave);
    ctx.quadraticCurveTo(centerX, bottom + wave, left, bottom - wave);
    ctx.closePath();
    return;
  }

  ctx.rect(left, top, boxWidth, height);
};

const drawShape = (ctx, item) => {
  if (!item.start || !item.end) return;

  ctx.strokeStyle = item.color;
  ctx.lineWidth = item.width;
  ctx.beginPath();
  drawShapePath(ctx, item);
  ctx.stroke();

  if (item.shape === "arrow") {
    drawArrowHead(ctx, item.start, item.end, item.width);
  }

  if (item.shape === "database") {
    const bounds = getDrawableBounds(item);
    const ellipseHeight = Math.min(bounds.height * 0.28, 32);
    ctx.beginPath();
    ctx.ellipse(
      bounds.left + bounds.width / 2,
      bounds.top + ellipseHeight / 2,
      Math.max(bounds.width / 2, 1),
      Math.max(ellipseHeight / 2, 1),
      0,
      0,
      Math.PI * 2,
    );
    ctx.moveTo(bounds.left, bounds.top + ellipseHeight / 2);
    ctx.lineTo(bounds.left, bounds.bottom - ellipseHeight / 2);
    ctx.moveTo(bounds.right, bounds.top + ellipseHeight / 2);
    ctx.lineTo(bounds.right, bounds.bottom - ellipseHeight / 2);
    ctx.ellipse(
      bounds.left + bounds.width / 2,
      bounds.bottom - ellipseHeight / 2,
      Math.max(bounds.width / 2, 1),
      Math.max(ellipseHeight / 2, 1),
      0,
      0,
      Math.PI,
    );
    ctx.stroke();
  }
};

const wrapText = (ctx, text, maxWidth) => {
  const lines = [];
  const paragraphs = text.split("\n");

  paragraphs.forEach((paragraph) => {
    const words = paragraph.split(" ");
    let line = "";

    words.forEach((word) => {
      const testLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    });

    lines.push(line);
  });

  return lines;
};

const drawText = (ctx, item) => {
  const bounds = getDrawableBounds(item);
  const fontSize = item.fontSize ?? TEXT_FONT_SIZE;
  const lineHeight = fontSize * 1.35;

  ctx.fillStyle = item.color;
  ctx.font = `${fontSize}px "Plus Jakarta Sans", sans-serif`;
  ctx.textBaseline = "top";

  wrapText(ctx, item.text, Math.max(bounds.width, 40)).forEach((line, index) => {
    ctx.fillText(line, bounds.left, bounds.top + index * lineHeight);
  });
};

export const drawDrawableOnCanvas = (ctx, item) => {
  if (!ctx || !item) return;

  if (item.type === "shape") {
    drawShape(ctx, item);
    return;
  }

  if (item.type === "text") {
    drawText(ctx, item);
    return;
  }

  drawPath(ctx, item);
};

export const drawSelectionOnCanvas = (ctx, item) => {
  if (!ctx || !item) return;

  ctx.save();
  ctx.strokeStyle = "#2563eb";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);

  const bounds = getDrawableBounds(item);
  ctx.strokeRect(bounds.left, bounds.top, bounds.width, bounds.height);

  ctx.setLineDash([]);
  getResizeHandles(item).forEach((handle) => {
    ctx.fillRect(
      handle.x - HANDLE_SIZE / 2,
      handle.y - HANDLE_SIZE / 2,
      HANDLE_SIZE,
      HANDLE_SIZE,
    );
    ctx.strokeRect(
      handle.x - HANDLE_SIZE / 2,
      handle.y - HANDLE_SIZE / 2,
      HANDLE_SIZE,
      HANDLE_SIZE,
    );
  });
  ctx.restore();
};
