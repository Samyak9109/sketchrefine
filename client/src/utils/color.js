import { DEFAULT_DRAWING_COLOR } from "../constants/whiteboard.js";

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const normalizeHex = (hex) => {
  const value = hex.trim().replace("#", "");

  if (/^[0-9a-fA-F]{3}$/.test(value)) {
    return `#${value
      .split("")
      .map((char) => char + char)
      .join("")
      .toUpperCase()}`;
  }

  if (/^[0-9a-fA-F]{6}$/.test(value)) {
    return `#${value.toUpperCase()}`;
  }

  return null;
};

export const hexToRgb = (hex) => {
  const normalized = normalizeHex(hex) ?? DEFAULT_DRAWING_COLOR;

  return {
    red: parseInt(normalized.slice(1, 3), 16),
    green: parseInt(normalized.slice(3, 5), 16),
    blue: parseInt(normalized.slice(5, 7), 16),
  };
};

export const rgbToHex = ({ red, green, blue }) =>
  `#${[red, green, blue]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;

export const hexToRgba = (hex, opacity) => {
  const { red, green, blue } = hexToRgb(hex);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
};

export const getStrokeColor = (tool, color, opacity) =>
  tool === "eraser" ? "#ffffff" : hexToRgba(color, opacity);

export const rgbToHsl = ({ red, green, blue }) => {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;
  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === r) hue = ((g - b) / delta) % 6;
    if (max === g) hue = (b - r) / delta + 2;
    if (max === b) hue = (r - g) / delta + 4;
    hue *= 60;
  }

  return {
    hue: Math.round(hue < 0 ? hue + 360 : hue),
    saturation: Math.round(saturation * 100),
    lightness: Math.round(lightness * 100),
  };
};

export const hslToRgb = ({ hue, saturation, lightness }) => {
  const normalizedHue = (((hue % 360) + 360) % 360) / 60;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs((normalizedHue % 2) - 1));
  const match = lightness - chroma / 2;
  let rgb;

  if (normalizedHue < 1) rgb = [chroma, x, 0];
  else if (normalizedHue < 2) rgb = [x, chroma, 0];
  else if (normalizedHue < 3) rgb = [0, chroma, x];
  else if (normalizedHue < 4) rgb = [0, x, chroma];
  else if (normalizedHue < 5) rgb = [x, 0, chroma];
  else rgb = [chroma, 0, x];

  return {
    red: Math.round((rgb[0] + match) * 255),
    green: Math.round((rgb[1] + match) * 255),
    blue: Math.round((rgb[2] + match) * 255),
  };
};

const getNumericParts = (value) =>
  value.match(/-?\d*\.?\d+/g)?.map(Number).filter(Number.isFinite) ?? [];

export const formatColorValue = (format, hex) => {
  const normalized = normalizeHex(hex) ?? DEFAULT_DRAWING_COLOR;
  const rgb = hexToRgb(normalized);

  if (format === "rgb") {
    return `${rgb.red}, ${rgb.green}, ${rgb.blue}`;
  }

  if (format === "hsl") {
    const hsl = rgbToHsl(rgb);
    return `${hsl.hue}, ${hsl.saturation}%, ${hsl.lightness}%`;
  }

  return normalized;
};

export const parseColorValue = (format, value) => {
  if (format === "hex") {
    return normalizeHex(value);
  }

  const numbers = getNumericParts(value);

  if (format === "rgb" && numbers.length >= 3) {
    return rgbToHex({
      red: Math.round(clamp(numbers[0], 0, 255)),
      green: Math.round(clamp(numbers[1], 0, 255)),
      blue: Math.round(clamp(numbers[2], 0, 255)),
    });
  }

  if (format === "hsl" && numbers.length >= 3) {
    return rgbToHex(
      hslToRgb({
        hue: numbers[0],
        saturation: clamp(numbers[1], 0, 100) / 100,
        lightness: clamp(numbers[2], 0, 100) / 100,
      }),
    );
  }

  return null;
};

export const rgbToHsv = ({ red, green, blue }) => {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;

  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    if (max === g) hue = (b - r) / delta + 2;
    if (max === b) hue = (r - g) / delta + 4;
    hue *= 60;
  }

  return {
    hue: hue < 0 ? hue + 360 : hue,
    saturation: max === 0 ? 0 : delta / max,
    value: max,
  };
};

export const hsvToRgb = ({ hue, saturation, value }) => {
  const chroma = value * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const match = value - chroma;
  let rgb;

  if (hue < 60) rgb = [chroma, x, 0];
  else if (hue < 120) rgb = [x, chroma, 0];
  else if (hue < 180) rgb = [0, chroma, x];
  else if (hue < 240) rgb = [0, x, chroma];
  else if (hue < 300) rgb = [x, 0, chroma];
  else rgb = [chroma, 0, x];

  return {
    red: Math.round((rgb[0] + match) * 255),
    green: Math.round((rgb[1] + match) * 255),
    blue: Math.round((rgb[2] + match) * 255),
  };
};

export const hsvToHex = (hsv) => rgbToHex(hsvToRgb(hsv));
