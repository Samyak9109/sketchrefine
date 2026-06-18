import { useRef, useEffect } from "react";

const Canvas = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawingRef = useRef(false);

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

    isDrawingRef.current = true;

    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
  };

  const stopDrawing = (e) => {
    isDrawingRef.current = false;
  };
  const clearCanvas = () => {
    ctxRef.current.clearRect(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height,
    );
  };
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
      <button onClick={clearCanvas} className="border bg-amber-700 p-2 m-2">Clear</button>
    </div>
  );
};

export default Canvas;
