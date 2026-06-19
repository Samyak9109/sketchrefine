import { useRef, useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Minus, Plus, RotateCcw, RotateCw, Trash2 } from "lucide-react";
import {
  addStroke,
  clearBoard,
  deleteStroke,
  setBoard,
  undoStroke,
  redoStroke,
  updateStroke,
} from "../redux/slices/boardslice";
import socket from "../socket/socket";
import { TEXT_FONT_SIZE } from "../constants/whiteboard.js";
import {
  drawDrawableOnCanvas,
  drawSegmentOnCanvas,
  drawSelectionOnCanvas,
} from "../utils/canvasRenderer.js";
import { getStrokeColor } from "../utils/color.js";
import {
  getHitHandle,
  isPointInDrawable,
  resizeDrawable,
  translateDrawable,
} from "../utils/geometry.js";
import {
  getPageBackgroundStyle,
  paintPageBackground,
} from "../utils/pageBackground.js";
import { createDrawableId } from "../utils/id.js";

const Canvas = ({ roomId }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef([]);
  const draftRef = useRef(null);
  const remoteDraftsRef = useRef({});
  const resizeRef = useRef(null);
  const moveRef = useRef(null);
  const textAreaRef = useRef(null);
  const dispatch = useDispatch();
  const strokes = useSelector((state) => state.board.strokes);
  const redoStack = useSelector((state) => state.board.redoStack);
  const color = useSelector((state) => state.tools.color);
  const opacity = useSelector((state) => state.tools.opacity);
  const width = useSelector((state) => state.tools.width);
  const tool = useSelector((state) => state.tools.tool);
  const shape = useSelector((state) => state.tools.shape);
  const theme = useSelector((state) => state.tools.theme);
  const pageStyle = useSelector((state) => state.tools.pageStyle);
  const [cursors, setCursors] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [textDraft, setTextDraft] = useState(null);
  const [eraserCursor, setEraserCursor] = useState(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    canvasRef.current.width = 800;
    canvasRef.current.height = 600;

    ctxRef.current = canvasRef.current.getContext("2d");
    ctxRef.current.lineCap = "round";
    ctxRef.current.lineJoin = "round";
    ctxRef.current.strokeStyle = "black";
    ctxRef.current.lineWidth = 3;
  }, []);

  const getCanvasPoint = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();

    return {
      x: ((event.clientX - rect.left) / rect.width) * canvasRef.current.width,
      y: ((event.clientY - rect.top) / rect.height) * canvasRef.current.height,
    };
  };

  const drawSegment = useCallback((segment) => {
    drawSegmentOnCanvas(ctxRef.current, segment);
  }, []);

  const drawDrawable = useCallback((item) => {
    drawDrawableOnCanvas(ctxRef.current, item);
  }, []);

  const drawSelection = useCallback((item) => {
    drawSelectionOnCanvas(ctxRef.current, item);
  }, []);

  const clearCanvas = useCallback(() => {
    ctxRef.current.clearRect(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height,
    );
  }, []);

  const redrawEverything = useCallback(() => {
    clearCanvas();

    strokes.forEach(drawDrawable);
    Object.values(remoteDraftsRef.current).forEach(drawDrawable);
    drawSelection(strokes.find((item) => item.id === selectedId));
  }, [clearCanvas, drawDrawable, drawSelection, selectedId, strokes]);

  const commitDrawableUpdate = useCallback(
    (updatedItem) => {
      dispatch(updateStroke(updatedItem));
      socket.emit("update-stroke", { roomId, strokeObject: updatedItem });
    },
    [dispatch, roomId],
  );

  const startDrawing = (event) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    window.dispatchEvent(new CustomEvent("whiteboard:board-pointerdown"));
    const point = getCanvasPoint(event);
    const strokeColor = getStrokeColor(tool, color, opacity);

    if (tool === "select" || tool === "move") {
      const selectedItem = strokes.find((item) => item.id === selectedId);
      const handle = selectedItem && getHitHandle(point, selectedItem);

      if (tool === "select" && selectedItem && handle) {
        resizeRef.current = {
          handleId: handle.id,
          item: selectedItem,
        };
        isDrawingRef.current = true;
        return;
      }

      const clickedItem = [...strokes]
        .reverse()
        .find((item) => isPointInDrawable(point, item));

      setSelectedId(clickedItem?.id ?? null);
      if (tool === "move" && clickedItem) {
        moveRef.current = {
          item: clickedItem,
          lastPoint: point,
        };
        isDrawingRef.current = true;
      }
      return;
    }

    if (tool === "text") {
      setSelectedId(null);
      setTextDraft({
        x: point.x,
        y: point.y,
        width: 240,
        height: 92,
        value: "",
      });
      return;
    }

    isDrawingRef.current = true;
    currentStrokeRef.current = [point];

    if (tool === "shape") {
      draftRef.current = {
        id: createDrawableId(),
        type: "shape",
        shape,
        color: strokeColor,
        width,
        start: point,
        end: point,
      };
      return;
    }

    ctxRef.current.strokeStyle = strokeColor;
    ctxRef.current.lineWidth = width;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(point.x, point.y);
  };

  const handleUndo = () => {
    const last = strokes[strokes.length - 1];
    if (!last) return;

    setSelectedId(null);
    dispatch(undoStroke());
    socket.emit("undo-stroke", roomId);
  };

  const handleRedo = () => {
    const restored = redoStack[redoStack.length - 1];
    if (!restored) return;

    dispatch(redoStroke());
    socket.emit("redo-stroke", { roomId, strokeObject: restored });
  };

  const draw = (event) => {
    if (!isDrawingRef.current) return;

    const point = getCanvasPoint(event);

    if (tool === "select") {
      const resizeState = resizeRef.current;
      if (!resizeState) return;

      const updatedItem = resizeDrawable(
        resizeState.item,
        resizeState.handleId,
        point,
      );
      resizeRef.current.item = updatedItem;
      commitDrawableUpdate(updatedItem);
      return;
    }

    if (tool === "move") {
      const moveState = moveRef.current;
      if (!moveState) return;

      const delta = {
        x: point.x - moveState.lastPoint.x,
        y: point.y - moveState.lastPoint.y,
      };
      const updatedItem = translateDrawable(moveState.item, delta);
      moveRef.current = {
        item: updatedItem,
        lastPoint: point,
      };
      setSelectedId(updatedItem.id);
      commitDrawableUpdate(updatedItem);
      return;
    }

    if (tool === "shape") {
      const draft = {
        ...draftRef.current,
        end: point,
      };
      draftRef.current = draft;

      redrawEverything();
      drawDrawable(draft);
      socket.emit("shape-preview", { roomId, draft });
      return;
    }

    const previousPoint =
      currentStrokeRef.current[currentStrokeRef.current.length - 1];
    const segment = {
      from: previousPoint,
      to: point,
      color: getStrokeColor(tool, color, opacity),
      width,
      operation: tool === "eraser" ? "erase" : "draw",
    };

    currentStrokeRef.current.push(point);

    drawSegment(segment);
    socket.emit("draw-segment", { roomId, segment });
  };

  const stopDrawing = (event) => {
    event?.currentTarget?.releasePointerCapture?.(event.pointerId);

    if (!isDrawingRef.current) return;

    isDrawingRef.current = false;

    if (tool === "shape") {
      const strokeObject = draftRef.current;
      draftRef.current = null;

      if (!strokeObject) return;

      setSelectedId(strokeObject.id);
      dispatch(addStroke(strokeObject));
      socket.emit("draw-stroke", { roomId, strokeObject });
      return;
    }

    if (tool === "select") {
      resizeRef.current = null;
      return;
    }

    if (tool === "move") {
      moveRef.current = null;
      return;
    }

    if (currentStrokeRef.current.length < 2) {
      currentStrokeRef.current = [];
      return;
    }

    const strokeObject = {
      id: createDrawableId(),
      type: tool === "eraser" ? "eraser" : "path",
      color: getStrokeColor(tool, color, opacity),
      width,
      points: currentStrokeRef.current,
    };

    dispatch(addStroke(strokeObject));
    socket.emit("draw-stroke", { roomId, strokeObject });
    currentStrokeRef.current = [];
  };

  const finishTextDraft = () => {
    if (!textDraft) return;

    const value = textDraft.value.trim();
    if (!value) {
      return;
    }

    const strokeObject = {
      id: createDrawableId(),
      type: "text",
      text: value,
      color: getStrokeColor(tool, color, opacity),
      width: 1,
      fontSize: TEXT_FONT_SIZE,
      start: { x: textDraft.x, y: textDraft.y },
      end: {
        x: textDraft.x + textDraft.width,
        y: textDraft.y + textDraft.height,
      },
    };

    setTextDraft(null);
    setSelectedId(strokeObject.id);
    dispatch(addStroke(strokeObject));
    socket.emit("draw-stroke", { roomId, strokeObject });
  };

  const handlePointerMove = (event) => {
    const { x, y } = getCanvasPoint(event);

    setEraserCursor(tool === "eraser" ? { x, y } : null);
    socket.emit("cursor-move", { roomId, x, y });
    draw(event);
  };

  const handlePointerLeave = () => {
    setEraserCursor(null);
    stopDrawing();
  };

  useEffect(() => {
    redrawEverything();
  }, [redrawEverything]);

  useEffect(() => {
    if (!textDraft) return;
    requestAnimationFrame(() => {
      textAreaRef.current?.focus();
    });
  }, [textDraft]);

  const handleClearClick = () => {
    clearCanvas();
    setSelectedId(null);
    dispatch(clearBoard());
    socket.emit("clear-board", roomId);
  };

  const handleDeleteClick = () => {
    if (!selectedId) {
      handleClearClick();
      return;
    }

    dispatch(deleteStroke(selectedId));
    socket.emit("delete-stroke", { roomId, strokeId: selectedId });
    setSelectedId(null);
  };

  const zoomOut = () => setZoom((current) => Math.max(0.5, current - 0.1));
  const zoomIn = () => setZoom((current) => Math.min(2, current + 0.1));

  useEffect(() => {
    const handleIncomingStroke = (strokeObject) => {
      delete remoteDraftsRef.current[strokeObject.id];
      dispatch(addStroke(strokeObject));
    };
    const handleIncomingSegment = (segment) => drawSegment(segment);
    const handleIncomingShapePreview = ({ socketId, draft }) => {
      remoteDraftsRef.current[draft.id ?? socketId] = draft;
      redrawEverything();
    };
    const handleIncomingClear = () => {
      remoteDraftsRef.current = {};
      clearCanvas();
      dispatch(clearBoard());
      setSelectedId(null);
    };
    const handleIncomingUpdate = (strokeObject) => {
      dispatch(updateStroke(strokeObject));
    };
    const handleIncomingDelete = (strokeId) => {
      dispatch(deleteStroke(strokeId));
      setSelectedId((current) => (current === strokeId ? null : current));
    };

    socket.on("draw-stroke", handleIncomingStroke);
    socket.on("draw-segment", handleIncomingSegment);
    socket.on("shape-preview", handleIncomingShapePreview);
    socket.on("update-stroke", handleIncomingUpdate);
    socket.on("delete-stroke", handleIncomingDelete);
    socket.on("clear-board", handleIncomingClear);

    return () => {
      socket.off("draw-stroke", handleIncomingStroke);
      socket.off("draw-segment", handleIncomingSegment);
      socket.off("shape-preview", handleIncomingShapePreview);
      socket.off("update-stroke", handleIncomingUpdate);
      socket.off("delete-stroke", handleIncomingDelete);
      socket.off("clear-board", handleIncomingClear);
    };
  }, [clearCanvas, dispatch, drawSegment, redrawEverything]);

  useEffect(() => {
    if (!roomId) return;
    remoteDraftsRef.current = {};
    currentStrokeRef.current = [];
    draftRef.current = null;
    resizeRef.current = null;
    moveRef.current = null;
    dispatch(clearBoard());
    socket.emit("join-room", roomId);
  }, [dispatch, roomId]);

  useEffect(() => {
    const handleIncomingUndo = () => dispatch(undoStroke());
    const handleIncomingRedo = (strokeObject) =>
      dispatch(redoStroke(strokeObject));

    socket.on("undo-stroke", handleIncomingUndo);
    socket.on("redo-stroke", handleIncomingRedo);

    return () => {
      socket.off("undo-stroke", handleIncomingUndo);
      socket.off("redo-stroke", handleIncomingRedo);
    };
  }, [dispatch]);

  useEffect(() => {
    const handleLoadBoard = (strokesArray) => {
      dispatch(setBoard(strokesArray));
    };

    socket.on("load-board", handleLoadBoard);

    return () => {
      socket.off("load-board", handleLoadBoard);
    };
  }, [dispatch]);

  useEffect(() => {
    const handleCursorMove = ({ x, y, socketId }) => {
      setCursors((prev) => ({
        ...prev,
        [socketId]: { x, y },
      }));
    };

    socket.on("cursor-move", handleCursorMove);

    return () => {
      socket.off("cursor-move", handleCursorMove);
    };
  }, []);

  useEffect(() => {
    const resizeCanvas = () => {
      const parent = canvasRef.current.parentElement;
      canvasRef.current.width = parent.clientWidth;
      canvasRef.current.height = parent.clientHeight;

      ctxRef.current.lineCap = "round";
      ctxRef.current.lineJoin = "round";

      redrawEverything();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, [redrawEverything]);

  useEffect(() => {
    const handleExportImage = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;

      const exportContext = exportCanvas.getContext("2d");
      paintPageBackground(
        exportContext,
        exportCanvas.width,
        exportCanvas.height,
        theme,
        pageStyle,
      );
      exportContext.drawImage(canvas, 0, 0);

      const link = document.createElement("a");
      link.download = `whiteboard-${roomId}.png`;
      link.href = exportCanvas.toDataURL("image/png");
      link.click();
    };

    window.addEventListener("whiteboard:export-image", handleExportImage);

    return () =>
      window.removeEventListener("whiteboard:export-image", handleExportImage);
  }, [pageStyle, roomId, theme]);

  const isDark = theme === "dark";
  const actionButtonClass = `grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-md transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
    isDark
      ? "text-slate-300 hover:bg-slate-800 hover:text-white"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
  }`;

  return (
    <main
      className="fixed inset-0 overflow-hidden"
      style={getPageBackgroundStyle(theme, pageStyle)}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          onPointerLeave={handlePointerLeave}
          className={`h-full w-full touch-none ${
            isDark && tool !== "eraser"
              ? "whiteboard-canvas--white-cursor"
              : tool === "text"
                ? "cursor-text"
                : tool === "select"
                  ? "cursor-default"
                  : tool === "move"
                    ? "cursor-grab active:cursor-grabbing"
                    : tool === "eraser"
                      ? "cursor-none"
                      : "cursor-crosshair"
          }`}
        />

        {tool === "eraser" && eraserCursor && (
          <div
            className={`pointer-events-none absolute z-10 rounded-full border-2 ${
              isDark
                ? "border-white bg-white/10 shadow-[0_0_0_2px_rgba(15,23,42,0.7)]"
                : "border-slate-900 bg-white/30 shadow-[0_0_0_2px_rgba(255,255,255,0.9)]"
            }`}
            style={{
              left: eraserCursor.x,
              top: eraserCursor.y,
              width: Math.max(width * 2, 18),
              height: Math.max(width * 2, 18),
              transform: "translate(-50%, -50%)",
            }}
          />
        )}

        {textDraft && (
          <textarea
            ref={textAreaRef}
            autoFocus
            placeholder="Type here..."
            value={textDraft.value}
            onBlur={finishTextDraft}
            onChange={(event) =>
              setTextDraft((current) => ({
                ...current,
                value: event.target.value,
              }))
            }
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setTextDraft(null);
                return;
              }

              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
            className={`absolute z-10 resize rounded border-2 border-dashed border-blue-500 p-2 text-2xl leading-snug shadow-lg outline-none ring-2 ring-blue-500/20 placeholder:text-slate-400 ${
              isDark
                ? "bg-slate-950/95 text-white caret-white"
                : "bg-white/95 text-slate-900"
            }`}
            style={{
              left: textDraft.x,
              top: textDraft.y,
              width: textDraft.width,
              minHeight: textDraft.height,
            }}
          />
        )}

        {Object.entries(cursors).map(([socketId, pos]) => (
          <div
            key={socketId}
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "red",
              pointerEvents: "none",
            }}
          />
        ))}
      </div>

      <div
        className={`whiteboard-actions fixed top-20 right-4 z-30 flex h-fit w-fit flex-col items-center gap-1 rounded-lg border p-1 shadow-lg backdrop-blur ${
          isDark
            ? "border-slate-700 bg-slate-950/92"
            : "border-slate-200 bg-white/95"
        }`}
      >
        <button
          type="button"
          onClick={zoomOut}
          aria-label="Zoom out"
          className={actionButtonClass}
        >
          <Minus size={18} strokeWidth={1.8} />
        </button>
        <span
          className={`whiteboard-zoom-label px-2 py-1 text-center text-sm font-semibold tabular-nums ${
            isDark ? "text-slate-200" : "text-slate-700"
          }`}
        >
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={zoomIn}
          aria-label="Zoom in"
          className={actionButtonClass}
        >
          <Plus size={18} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          onClick={handleDeleteClick}
          aria-label={selectedId ? "Delete selected item" : "Clear board"}
          className={actionButtonClass}
        >
          <Trash2 size={18} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          onClick={handleUndo}
          aria-label="Undo"
          className={actionButtonClass}
        >
          <RotateCcw size={18} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          onClick={handleRedo}
          aria-label="Redo"
          className={actionButtonClass}
        >
          <RotateCw size={18} strokeWidth={1.8} />
        </button>
      </div>
    </main>
  );
};

export default Canvas;
