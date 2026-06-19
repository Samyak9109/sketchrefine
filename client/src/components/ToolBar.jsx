import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowUpRight,
  Circle,
  Copy,
  Database,
  Diamond,
  Download,
  Eraser,
  FileText,
  Hash,
  Hand,
  Hexagon,
  Layers3,
  LogIn,
  MousePointer2,
  Minus,
  Moon,
  PenLine,
  Plus,
  Shapes,
  Square,
  Sun,
  Type,
  Users,
} from "lucide-react";
import {
  setPageStyle,
  setColor,
  setOpacity,
  setShape,
  setTool,
  setWidth,
  toggleTheme,
} from "../redux/slices/toolSlice.js";
import ColorPicker from "./ColorPicker.jsx";

const tools = [
  { id: "select", label: "Select", Icon: MousePointer2 },
  { id: "move", label: "Move", Icon: Hand },
  { id: "pen", label: "Draw", Icon: PenLine },
  { id: "text", label: "Text", Icon: Type },
  { id: "eraser", label: "Erase", Icon: Eraser },
  { id: "shape", label: "Shapes", Icon: Shapes },
];

const shapes = [
  { id: "rectangle", label: "Rectangle", Icon: Square },
  { id: "circle", label: "Circle", Icon: Circle },
  { id: "ellipse", label: "Ellipse", Icon: Circle },
  { id: "oval", label: "Oval", Icon: Circle },
  { id: "line", label: "Line", Icon: Minus },
  { id: "arrow", label: "Arrow", Icon: ArrowUpRight },
  { id: "diamond", label: "Decision", Icon: Diamond },
  { id: "parallelogram", label: "Data", Icon: Square },
  { id: "database", label: "Database", Icon: Database },
  { id: "document", label: "Document", Icon: FileText },
  { id: "terminator", label: "Terminator", Icon: Square },
  { id: "hexagon", label: "Preparation", Icon: Hexagon },
  { id: "process", label: "Process", Icon: Square },
];

const pageTypes = [
  { id: "blank", label: "Blank page", Icon: Square },
  { id: "grid", label: "Grid page", Icon: Hash },
];

const ToolButton = ({ active, label, onClick, children, theme = "light" }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className={`grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-md transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
      active
        ? "bg-blue-600 text-white"
        : theme === "dark"
          ? "text-slate-300 hover:bg-slate-800 hover:text-white"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
    }`}
  >
    {children}
  </button>
);

const ToolBar = ({ roomId, onCreateRoom, onJoinRoom, onLeaveRoom }) => {
  const dispatch = useDispatch();
  const color = useSelector((state) => state.tools.color);
  const opacity = useSelector((state) => state.tools.opacity);
  const width = useSelector((state) => state.tools.width);
  const tool = useSelector((state) => state.tools.tool);
  const shape = useSelector((state) => state.tools.shape);
  const theme = useSelector((state) => state.tools.theme);
  const pageStyle = useSelector((state) => state.tools.pageStyle);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isShapePaletteOpen, setIsShapePaletteOpen] = useState(false);
  const [isRoomPanelOpen, setIsRoomPanelOpen] = useState(false);
  const [roomInput, setRoomInput] = useState("");
  const [isRoomCopied, setIsRoomCopied] = useState(false);

  const handleExportImage = () => {
    window.dispatchEvent(new CustomEvent("whiteboard:export-image"));
  };

  const handleJoinRoom = (event) => {
    event.preventDefault();
    if (!roomInput.trim()) return;

    onJoinRoom(roomInput);
    setRoomInput("");
    setIsRoomPanelOpen(false);
  };

  const handleCreateRoom = () => {
    onCreateRoom();
    setRoomInput("");
    setIsRoomPanelOpen(false);
  };

  const handleLeaveRoom = () => {
    onLeaveRoom();
    setRoomInput("");
    setIsRoomPanelOpen(false);
  };

  const handleCopyRoomId = async () => {
    try {
      await navigator.clipboard?.writeText(window.location.href);
      setIsRoomCopied(true);
      window.setTimeout(() => setIsRoomCopied(false), 1600);
    } catch (err) {
      console.error("Failed to copy URL", err);
    }
  };

  const handleToolClick = (toolId) => {
    if (toolId === "shape") {
      setIsColorPickerOpen(false);
      setIsShapePaletteOpen((current) => {
        const shouldOpen = !(tool === "shape" && current);
        if (shouldOpen) dispatch(setTool("shape"));
        return shouldOpen;
      });
      return;
    }

    setIsShapePaletteOpen(false);
    dispatch(setTool(toolId));
  };

  const visibleRoomId =
    roomId.length > 18 ? `${roomId.slice(0, 8)}...${roomId.slice(-6)}` : roomId;
  const isDark = theme === "dark";
  const surfaceClass = isDark
    ? "border-slate-700 bg-slate-950/92 text-slate-100"
    : "border-slate-200 bg-white/95 text-slate-700";
  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-500";
  const strongTextClass = isDark ? "text-white" : "text-slate-950";
  const subtleSurfaceClass = isDark
    ? "border-slate-700 bg-slate-900"
    : "border-slate-200 bg-slate-50";
  const inputClass = isDark
    ? "border-slate-700 bg-slate-950 text-white placeholder:text-slate-500"
    : "border-slate-200 bg-white text-slate-950 placeholder:text-slate-400";

  useEffect(() => {
    const closePanels = () => {
      setIsColorPickerOpen(false);
      setIsShapePaletteOpen(false);
      setIsRoomPanelOpen(false);
    };

    window.addEventListener("whiteboard:board-pointerdown", closePanels);

    return () =>
      window.removeEventListener("whiteboard:board-pointerdown", closePanels);
  }, []);

  return (
    <>
      <header className="whiteboard-header fixed left-0 right-0 top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 shadow-sm backdrop-blur ${surfaceClass}`}
        >
          <div
            className={`grid h-7 w-7 place-items-center rounded ${
              isDark ? "bg-white text-slate-950" : "bg-slate-950 text-white"
            }`}
          >
            <Layers3 size={16} strokeWidth={2} />
          </div>
          <span className={`text-base font-semibold tracking-tight ${strongTextClass}`}>
            Scribbl
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Export board as image"
            onClick={handleExportImage}
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <Download size={16} strokeWidth={1.9} />
            <span className="hidden sm:inline">Export image</span>
          </button>
        </div>
      </header>

      {isRoomPanelOpen && (
        <section
          className={`whiteboard-room-panel fixed top-32 sm:top-auto bottom-auto sm:bottom-20 left-4 z-40 w-[min(360px,calc(100vw-1rem))] rounded-2xl border p-4 shadow-2xl ${surfaceClass}`}
        >
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-600/10 text-blue-600">
              <Hash size={18} strokeWidth={1.9} />
            </div>
            <div className="min-w-0">
              <h2 className={`text-sm font-bold ${strongTextClass}`}>Rooms</h2>
              <p
                className={`mt-1 text-sm leading-5 ${
                  isDark ? "text-slate-300" : "text-slate-600"
                }`}
              >
                Create a new board room or join an existing room by id.
              </p>
            </div>
          </div>

          <div className={`mt-4 rounded-lg border px-3 py-2 ${subtleSurfaceClass}`}>
            <span
              className={`text-xs font-semibold uppercase tracking-wide ${mutedTextClass}`}
            >
              Current room
            </span>
            <div className="mt-1 flex items-center gap-2">
              <p className={`min-w-0 flex-1 break-all text-sm font-semibold ${strongTextClass}`}>
                {roomId}
              </p>
              <button
                type="button"
                aria-label="Copy room id"
                onClick={handleCopyRoomId}
                className={`grid min-h-10 min-w-10 shrink-0 cursor-pointer place-items-center rounded-md border transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  isDark
                    ? "border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <Copy size={16} strokeWidth={1.9} />
              </button>
            </div>
            {isRoomCopied && (
              <p className="mt-2 text-xs font-semibold text-emerald-700">
                Room id copied
              </p>
            )}
          </div>

          <form className="mt-4 space-y-3" onSubmit={handleJoinRoom}>
            <label className="block">
              <span
                className={`text-sm font-semibold ${
                  isDark ? "text-slate-200" : "text-slate-700"
                }`}
              >
                Room id
              </span>
              <input
                className={`mt-2 min-h-11 w-full rounded-lg border px-3 text-sm font-medium outline-none transition-colors duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${inputClass}`}
                value={roomInput}
                onChange={(event) => setRoomInput(event.target.value)}
                placeholder="design-review"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="submit"
                className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <LogIn size={16} strokeWidth={1.9} />
                Join
              </button>
              <button
                type="button"
                onClick={handleCreateRoom}
                className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  isDark
                    ? "border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800 hover:text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <Plus size={16} strokeWidth={1.9} />
                New room
              </button>
            </div>
            <button
              type="button"
              onClick={handleLeaveRoom}
              className="min-h-11 w-full cursor-pointer rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 transition-colors duration-200 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              Leave room
            </button>
          </form>
        </section>
      )}

      {isShapePaletteOpen && (
        <div
          className={`whiteboard-shape-palette fixed bottom-20 left-1/2 z-30 grid max-w-[calc(100vw-1rem)] -translate-x-1/2 grid-cols-4 gap-2 rounded-lg border p-2 shadow-lg backdrop-blur sm:grid-cols-6 ${surfaceClass}`}
        >
          {shapes.map(({ id, label, Icon }) => (
            <ToolButton
              key={id}
              label={label}
              active={shape === id}
              theme={theme}
              onClick={() => dispatch(setShape(id))}
            >
              <Icon size={18} strokeWidth={1.8} />
            </ToolButton>
          ))}
        </div>
      )}

      {isColorPickerOpen && (
        <ColorPicker
          color={color}
          opacity={opacity}
          onColorChange={(nextColor) => dispatch(setColor(nextColor))}
          onOpacityChange={(nextOpacity) => dispatch(setOpacity(nextOpacity))}
        />
      )}

      <div
        className={`whiteboard-tool-dock fixed bottom-4 left-1/2 z-30 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-2 overflow-x-auto rounded-lg border p-2 shadow-lg backdrop-blur ${surfaceClass}`}
      >
        <div className="flex items-center gap-1">
          {tools.map(({ id, label, Icon }) => (
            <ToolButton
              key={id}
              label={label}
              active={tool === id}
              theme={theme}
              onClick={() => handleToolClick(id)}
            >
              <Icon size={18} strokeWidth={1.8} />
            </ToolButton>
          ))}
        </div>

        <div className={`h-8 w-px shrink-0 ${isDark ? "bg-slate-700" : "bg-slate-200"}`} />

        <button
          type="button"
          aria-label="Open color picker"
          title="Color"
          onClick={() => {
            setIsShapePaletteOpen(false);
            setIsColorPickerOpen((current) => !current);
          }}
          className={`grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-md border transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
            isColorPickerOpen
              ? "border-violet-500 bg-violet-50"
              : isDark
                ? "border-slate-700 bg-slate-950 hover:bg-slate-800"
                : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <span
            className="h-7 w-7 rounded-full border border-slate-200 shadow-inner"
            style={{ backgroundColor: color, opacity }}
          />
        </button>

        <label
          className={`flex min-h-11 min-w-40 items-center gap-2 rounded-md border px-3 ${
            isDark ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-white"
          }`}
        >
          <span
            className={`text-xs font-semibold tabular-nums ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            {width}px
          </span>
          <input
            aria-label="Stroke width"
            className="w-28 cursor-pointer accent-blue-600"
            type="range"
            min="1"
            max="32"
            value={width}
            onChange={(e) => dispatch(setWidth(Number(e.target.value)))}
          />
        </label>

        <div className={`h-8 w-px shrink-0 ${isDark ? "bg-slate-700" : "bg-slate-200"}`} />

        <div
          className={`flex min-h-11 items-center rounded-md border p-1 ${
            isDark ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-white"
          }`}
        >
          {pageTypes.map(({ id, label, Icon }) => (
            <ToolButton
              key={id}
              label={label}
              active={pageStyle === id}
              theme={theme}
              onClick={() => dispatch(setPageStyle(id))}
            >
              <Icon size={17} strokeWidth={1.8} />
            </ToolButton>
          ))}
        </div>

        <ToolButton
          label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          active={isDark}
          theme={theme}
          onClick={() => dispatch(toggleTheme())}
        >
          {isDark ? (
            <Sun size={18} strokeWidth={1.8} />
          ) : (
            <Moon size={18} strokeWidth={1.8} />
          )}
        </ToolButton>
      </div>

      <button
        type="button"
        aria-label="Open room controls"
        onClick={() => {
          setRoomInput("");
          setIsRoomPanelOpen((current) => !current);
        }}
        className={`whiteboard-room-button fixed top-16 sm:top-auto bottom-auto sm:bottom-4 left-4 z-30 flex min-h-11 max-w-[min(320px,calc(100vw-2rem))] cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-semibold shadow-sm backdrop-blur transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
          isRoomPanelOpen
            ? "border-blue-500 bg-blue-50 text-blue-800"
            : isDark
              ? "border-slate-700 bg-slate-950/92 text-slate-200 hover:bg-slate-900 hover:text-white"
              : "border-slate-200 bg-white/95 text-slate-700 hover:bg-slate-100 hover:text-slate-950"
        }`}
      >
        <Users size={17} strokeWidth={1.8} />
        <span className={`whiteboard-room-prefix ${mutedTextClass}`}>Room</span>
        <span className={`truncate ${strongTextClass}`}>{visibleRoomId}</span>
      </button>
    </>
  );
};

export default ToolBar;
