import { useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addStroke, clearBoard } from "../redux/slices/boardslice";
import socket from "../socket/socket";

const params = new URLSearchParams(window.location.search);

const Canvas = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef([]);
  const dispatch = useDispatch();
  const strokes = useSelector((state) => state.board.strokes);
  const color = useSelector((state) => state.tools.color);
  const width = useSelector((state) => state.tools.width);
  const [roomId, setRoomId] = useState(null);

  useEffect(() => {
    const existingRoom = params.get("room");
    if (existingRoom) {
      setRoomId(existingRoom);
    } else {
      const newRoom = crypto.randomUUID();
      window.history.replaceState(null, "", "?room=" + newRoom);
      setRoomId(newRoom);
    }
  }, []);

  useEffect(() => {
    canvasRef.current.width = 800;
    canvasRef.current.height = 600;

    ctxRef.current = canvasRef.current.getContext("2d");
    ctxRef.current.lineCap = "round";
    ctxRef.current.lineJoin = "round";
    ctxRef.current.strokeStyle = "black";
    ctxRef.current.lineWidth = 3;
  }, []);

  const startDrawing = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctxRef.current.strokeStyle = color;
    ctxRef.current.lineWidth = width;

    isDrawingRef.current = true;
    currentStrokeRef.current = [{ x, y }];

    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentStrokeRef.current.push({ x, y });

    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;

    const strokeObject = {
      id: Date.now(),
      color: color,
      width: width,
      points: currentStrokeRef.current,
    };

    dispatch(addStroke(strokeObject));
    socket.emit("draw-stroke", { roomId, strokeObject });
    currentStrokeRef.current = [];
  };

  const clearCanvas = () => {
    ctxRef.current.clearRect(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height,
    );
  };

  const redrawEverything = () => {
    clearCanvas();

    for (const stroke of strokes) {
      ctxRef.current.strokeStyle = stroke.color;
      ctxRef.current.lineWidth = stroke.width;
      ctxRef.current.beginPath();

      for (let index = 0; index < stroke.points.length; index++) {
        const point = stroke.points[index];
        if (index === 0) {
          ctxRef.current.moveTo(point.x, point.y);
        } else {
          ctxRef.current.lineTo(point.x, point.y);
        }
      }
      ctxRef.current.stroke();
    }
  };

  useEffect(() => {
    redrawEverything();
  }, [strokes]);

  const handleClearClick = () => {
    clearCanvas();
    dispatch(clearBoard());
    socket.emit("clear-board", roomId);
  };

  useEffect(() => {
    socket.on("connect", () => {
      console.log("connected:", socket.id);
    });
  }, []);

  useEffect(() => {
    const handleIncomingStroke = (strokeObject) =>
      dispatch(addStroke(strokeObject));
    const handleIncomingClear = () => {
      clearCanvas();
      dispatch(clearBoard());
    };

    socket.on("draw-stroke", handleIncomingStroke);
    socket.on("clear-board", handleIncomingClear);

    return () => {
      socket.off("draw-stroke", handleIncomingStroke);
      socket.off("clear-board", handleIncomingClear);
    };
  }, []);

  useEffect(() => {
    if (!roomId) return;
    socket.emit("join-room", roomId);
  }, [roomId]);

  useEffect(() => {
    const handleLoadBoard = (strokesArray) => {
      strokesArray.forEach((stroke) => {
        dispatch(addStroke(stroke));
      });
    };

    socket.on("load-board", handleLoadBoard);

    return () => {
      socket.off("load-board", handleLoadBoard);
    };
  }, []);

  return (
    <div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="border border-gray-300 rounded-lg shadow-md bg-white cursor-crosshair"
      ></canvas>
      <button
        onClick={handleClearClick}
        className="border bg-amber-700 p-2 m-2"
      >
        Clear
      </button>
    </div>
  );
};

export default Canvas;
