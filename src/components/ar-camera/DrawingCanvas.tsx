import { useRef, useEffect, useState } from "react";
import { Results } from "@mediapipe/hands";

interface DrawingCanvasProps {
  handData: Results | null;
  isDrawing: boolean;
  brushColor: string;
  brushSize: number;
  onClear: () => void;
}

interface Point { x: number; y: number }

export const DrawingCanvas = ({ handData, isDrawing, brushColor, brushSize, onClear }: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastPointRef = useRef<Point | null>(null);
  const [isPointing, setIsPointing] = useState(false);

  // Initialize canvas once and on resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setup = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { clientWidth, clientHeight } = canvas;
      const prev = ctxRef.current?.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = Math.max(Math.floor(clientWidth * dpr), 1);
      canvas.height = Math.max(Math.floor(clientHeight * dpr), 1);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctxRef.current = ctx;
      if (prev) {
        // Clear (we'll not preserve previous on resize to avoid artifacts)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    setup();
    const ro = new ResizeObserver(setup);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Update brush style when color/size changes
  useEffect(() => {
    if (!ctxRef.current) return;
    ctxRef.current.strokeStyle = brushColor;
    ctxRef.current.lineWidth = brushSize;
  }, [brushColor, brushSize]);

  // Draw based on handData
  useEffect(() => {
    if (!handData || !isDrawing || !ctxRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    // Map normalized [0..1] to canvas CSS size
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;

    const hands = handData.multiHandLandmarks;
    if (!hands || hands.length === 0) {
      setIsPointing(false);
      lastPointRef.current = null;
      return;
    }

    const landmarks = hands[0];
    const indexTip = landmarks[8];
    const indexMcp = landmarks[5];
    const middleTip = landmarks[12];
    const middlePip = landmarks[10];

    if (!indexTip || !indexMcp || !middleTip || !middlePip) return;

    const x = (1 - indexTip.x) * cw; // mirror horizontally
    const y = indexTip.y * ch;

    // Simple pointing heuristic: index extended, middle folded
    const indexExtended = indexTip.y < indexMcp.y;
    const middleFolded = middleTip.y > middlePip.y;
    const pointing = indexExtended && middleFolded;
    setIsPointing(pointing);

    if (pointing) {
      const current: Point = { x, y };
      if (lastPointRef.current) {
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(current.x, current.y);
        ctx.stroke();
      }
      lastPointRef.current = current;
    } else {
      lastPointRef.current = null;
    }
  }, [handData, isDrawing]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    onClear();
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full" data-role="drawing-canvas" />

      {isDrawing && (
        <div className="absolute top-4 right-4 glass-panel px-3 py-2 pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isPointing ? 'bg-neon-green animate-pulse-glow' : 'bg-neon-cyan'}`} />
            <span className="text-sm font-medium">
              {isPointing ? 'Drawing' : 'Point to Draw'}
            </span>
            <button onClick={clearCanvas} className="ml-2 text-xs underline">Clear</button>
          </div>
        </div>
      )}
    </div>
  );
};
