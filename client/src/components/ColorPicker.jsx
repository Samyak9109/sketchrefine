import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { SAVED_COLOR_DEFAULTS } from "../constants/whiteboard.js";
import {
  clamp,
  formatColorValue,
  hexToRgb,
  hsvToHex,
  normalizeHex,
  parseColorValue,
  rgbToHsv,
} from "../utils/color.js";

const ColorPicker = ({ color, opacity, onColorChange, onOpacityChange }) => {
  const pickerRef = useRef(null);
  const isPickingRef = useRef(false);
  const initialColor = normalizeHex(color) ?? "#111827";
  const [hsv, setHsv] = useState(() => rgbToHsv(hexToRgb(initialColor)));
  const [colorFormat, setColorFormat] = useState("hex");
  const [colorInput, setColorInput] = useState(initialColor);
  const [savedColors, setSavedColors] = useState(SAVED_COLOR_DEFAULTS);

  const commitHsv = (nextHsv) => {
    setHsv(nextHsv);
    const nextHex = hsvToHex(nextHsv);
    setColorInput(formatColorValue(colorFormat, nextHex));
    onColorChange(nextHex);
  };

  const applyColor = (nextColor) => {
    const normalized = normalizeHex(nextColor);
    if (!normalized) return;

    const nextHsv = rgbToHsv(hexToRgb(normalized));
    setHsv((current) => ({
      ...nextHsv,
      hue: nextHsv.saturation === 0 ? current.hue : nextHsv.hue,
    }));
    setColorInput(formatColorValue(colorFormat, normalized));
    onColorChange(normalized);
  };

  const updateFromPickerPoint = (event) => {
    const rect = pickerRef.current.getBoundingClientRect();
    const x = clamp(event.clientX - rect.left, 0, rect.width);
    const y = clamp(event.clientY - rect.top, 0, rect.height);

    commitHsv({
      ...hsv,
      saturation: x / rect.width,
      value: 1 - y / rect.height,
    });
  };

  const handlePickerPointerDown = (event) => {
    isPickingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPickerPoint(event);
  };

  const handlePickerPointerMove = (event) => {
    if (!isPickingRef.current) return;
    updateFromPickerPoint(event);
  };

  const handlePickerPointerUp = () => {
    isPickingRef.current = false;
  };

  const handleColorInputBlur = () => {
    const normalized = parseColorValue(colorFormat, colorInput);
    if (!normalized) {
      setColorInput(formatColorValue(colorFormat, color));
      return;
    }

    applyColor(normalized);
  };

  const handleColorFormatChange = (event) => {
    const nextFormat = event.target.value;
    setColorFormat(nextFormat);
    setColorInput(formatColorValue(nextFormat, color));
  };

  const addSavedColor = () => {
    if (savedColors.includes(color)) return;
    setSavedColors((current) => [...current, color]);
  };

  const markerStyle = {
    left: `${hsv.saturation * 100}%`,
    top: `${(1 - hsv.value) * 100}%`,
  };

  return (
    <section className="fixed bottom-24 left-1/2 z-40 w-[min(320px,calc(100vw-1rem))] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
      <div
        ref={pickerRef}
        aria-label="Pick color saturation and brightness"
        role="slider"
        aria-valuetext={`${Math.round(hsv.saturation * 100)}% saturation, ${Math.round(hsv.value * 100)}% brightness`}
        tabIndex={0}
        onPointerDown={handlePickerPointerDown}
        onPointerMove={handlePickerPointerMove}
        onPointerUp={handlePickerPointerUp}
        className="relative h-[280px] cursor-crosshair rounded-md focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.hue} 100% 50%))`,
        }}
      >
        <span
          className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_0_0_1px_rgba(15,23,42,0.3)]"
          style={markerStyle}
        />
      </div>

      <div className="mt-4 space-y-3">
        <input
          aria-label="Hue"
          className="color-slider h-3 w-full cursor-pointer appearance-none rounded-full"
          type="range"
          min="0"
          max="360"
          value={Math.round(hsv.hue)}
          onChange={(event) =>
            commitHsv({ ...hsv, hue: Number(event.target.value) })
          }
        />

        <input
          aria-label="Opacity"
          className="opacity-slider h-3 w-full cursor-pointer appearance-none rounded-full"
          style={{
            "--picker-color": color,
          }}
          type="range"
          min="0"
          max="100"
          value={Math.round(opacity * 100)}
          onChange={(event) => onOpacityChange(Number(event.target.value) / 100)}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <label className="block w-[5.25rem] min-w-0">
          <span className="sr-only">Color format</span>
          <select
            aria-label="Color format"
            value={colorFormat}
            onChange={handleColorFormatChange}
            className="min-h-11 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-medium uppercase text-slate-700 outline-none transition-colors duration-200 hover:bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="hex">Hex</option>
            <option value="rgb">RGB</option>
            <option value="hsl">HSL</option>
          </select>
        </label>
        <label className="order-3 flex min-h-11 min-w-0 flex-[1_0_100%] items-center gap-2 rounded-md border border-slate-200 bg-white px-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
          <span
            className="h-4 w-4 shrink-0 rounded-full"
            style={{ backgroundColor: color, opacity }}
          />
          <input
            aria-label={`${colorFormat.toUpperCase()} color value`}
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-800 outline-none"
            value={colorInput}
            placeholder={
              colorFormat === "rgb"
                ? "17, 24, 39"
                : colorFormat === "hsl"
                  ? "222, 47%, 11%"
                  : "#111827"
            }
            onBlur={handleColorInputBlur}
            onChange={(event) => setColorInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
          />
        </label>
        <label className="ml-auto flex min-h-11 w-20 min-w-0 items-center rounded-md border border-slate-200 bg-white px-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
          <span className="sr-only">Opacity percent</span>
          <input
            className="w-full bg-transparent text-right text-sm font-medium text-slate-800 outline-none"
            type="number"
            min="0"
            max="100"
            value={Math.round(opacity * 100)}
            onChange={(event) =>
              onOpacityChange(clamp(Number(event.target.value), 0, 100) / 100)
            }
          />
          <span className="text-sm text-slate-500">%</span>
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">Saved</span>
        <button
          type="button"
          onClick={addSavedColor}
          className="flex min-h-10 cursor-pointer items-center gap-1 rounded-md px-2 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <Plus size={16} strokeWidth={1.8} />
          Add
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {savedColors.map((savedColor) => (
          <button
            key={savedColor}
            type="button"
            aria-label={`Use saved color ${savedColor}`}
            onClick={() => applyColor(savedColor)}
            className={`h-6 w-6 cursor-pointer rounded-full transition-shadow duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
              color === savedColor
                ? "ring-2 ring-violet-600 ring-offset-2"
                : "hover:ring-2 hover:ring-slate-300 hover:ring-offset-2"
            }`}
            style={{
              backgroundColor: savedColor,
              border: savedColor === "#FFFFFF" ? "1px solid #CBD5E1" : undefined,
            }}
          />
        ))}
      </div>
    </section>
  );
};

export default ColorPicker;
