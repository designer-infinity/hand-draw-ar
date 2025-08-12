import { useRef, useEffect, useState } from "react";
import { Results } from "@mediapipe/hands";

interface DrawingCanvasProps {
  handData: Results | null;
  isDrawing: boolean;
  brushColor: string;
  brushSize: number;
  onClear: () => void;
}

interface Point {
  x: number;
  y: number;
}

export const DrawingCanvas = ({ 
  handData, 
  isDrawing, 
  brushColor, 
  brushSize,
  onClear 
}: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPointing, setIsPointing] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !handData || !isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match container
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;

    if (handData.multiHandLandmarks && handData.multiHandLandmarks.length > 0) {
      const landmarks = handData.multiHandLandmarks[0]; // Use first hand
      
      // Get fingertip positions (landmark 8 is index fingertip)
      const indexTip = landmarks[8];
      const middleTip = landmarks[12];
      const indexMcp = landmarks[5]; // Index finger base
      
      if (indexTip && middleTip && indexMcp) {
        // Convert normalized coordinates to canvas coordinates
        const x = (1 - indexTip.x) * canvas.width; // Flip x for mirror effect
        const y = indexTip.y * canvas.height;
        
        // Check if index finger is extended (pointing gesture)
        const indexExtended = indexTip.y < indexMcp.y;
        const middleFolded = middleTip.y > landmarks[9].y; // Middle finger folded
        
        const currentlyPointing = indexExtended && middleFolded;
        setIsPointing(currentlyPointing);
        
        if (currentlyPointing) {
          const currentPoint = { x, y };
          
          if (lastPoint) {
            // Draw line from last point to current point
            ctx.beginPath();
            ctx.moveTo(lastPoint.x, lastPoint.y);
            ctx.lineTo(currentPoint.x, currentPoint.y);
            ctx.stroke();
          }
          
          setLastPoint(currentPoint);
        } else {
          setLastPoint(null);
        }
      }
    }
  }, [handData, isDrawing, brushColor, brushSize]);

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    onClear();
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ transform: "scaleX(1)" }}
      />
      
      {/* Drawing status indicator */}
      {isDrawing && (
        <div className="absolute top-4 right-4 glass-panel px-3 py-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isPointing ? 'bg-neon-green animate-pulse-glow' : 'bg-neon-cyan'}`} />
            <span className="text-sm font-medium">
              {isPointing ? 'Drawing' : 'Point to Draw'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};