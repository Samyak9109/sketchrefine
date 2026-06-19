import { GRID_COLORS, GRID_SIZE, PAGE_COLORS } from "../constants/whiteboard.js";

export const getPageBackgroundStyle = (theme, pageStyle) => {
  const backgroundColor = PAGE_COLORS[theme] ?? PAGE_COLORS.light;

  if (pageStyle !== "grid") {
    return { backgroundColor };
  }

  const gridColor = GRID_COLORS[theme] ?? GRID_COLORS.light;

  return {
    backgroundColor,
    backgroundImage: `
      linear-gradient(${gridColor} 1px, transparent 1px),
      linear-gradient(90deg, ${gridColor} 1px, transparent 1px)
    `,
    backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
  };
};

export const paintPageBackground = (ctx, width, height, theme, pageStyle) => {
  ctx.fillStyle = PAGE_COLORS[theme] ?? PAGE_COLORS.light;
  ctx.fillRect(0, 0, width, height);

  if (pageStyle !== "grid") return;

  ctx.save();
  ctx.strokeStyle = GRID_COLORS[theme] ?? GRID_COLORS.light;
  ctx.lineWidth = 1;

  for (let x = 0; x <= width; x += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
    ctx.stroke();
  }

  ctx.restore();
};
