import { useState, useCallback } from "react";
import { Results } from "@mediapipe/hands";
import { CameraFeed } from "./CameraFeed";
import { DrawingCanvas } from "./DrawingCanvas";
import { ARControls } from "./ARControls";
import { toast } from "sonner";

export const ARDrawingApp = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [handData, setHandData] = useState<Results | null>(null);
  const [brushColor, setBrushColor] = useState("#00FFFF");
  const [brushSize, setBrushSize] = useState(4);

  const handleHandData = useCallback((results: Results) => {
    setHandData(results);
  }, []);

  const handleToggleTracking = () => {
    setIsTracking(!isTracking);
    if (!isTracking) {
      toast.success("Hand tracking started!");
    } else {
      toast.info("Hand tracking paused");
    }
  };

  const handleToggleDrawing = () => {
    setIsDrawing(!isDrawing);
    if (!isDrawing) {
      toast.success("Drawing mode activated! Point with your index finger to draw.");
    } else {
      toast.info("Drawing mode deactivated");
    }
  };

  const handleClear = () => {
    toast.success("Drawing cleared!");
  };

  const handleCapture = () => {
    // Create a composite image of camera feed + drawing
    const video = document.querySelector('video');
    const drawingCanvas = document.querySelector('canvas:last-of-type') as HTMLCanvasElement;
    
    if (video && drawingCanvas) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame (flipped)
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
        
        // Draw the drawing canvas on top
        ctx.drawImage(drawingCanvas, 0, 0, canvas.width, canvas.height);
        
        // Download the image
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ar-drawing-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("AR drawing saved!");
          }
        }, 'image/png');
      }
    }
  };

  return (
    <div className="w-screen h-screen relative bg-background overflow-hidden">
      {/* Main Camera View */}
      <div className="w-full h-full relative">
        <CameraFeed 
          onHandData={handleHandData}
          isTracking={isTracking}
        />
        
        {/* Drawing Layer */}
        <DrawingCanvas
          handData={handData}
          isDrawing={isDrawing}
          brushColor={brushColor}
          brushSize={brushSize}
          onClear={handleClear}
        />
        
        {/* Controls */}
        <ARControls
          isTracking={isTracking}
          isDrawing={isDrawing}
          brushColor={brushColor}
          brushSize={brushSize}
          onToggleTracking={handleToggleTracking}
          onToggleDrawing={handleToggleDrawing}
          onColorChange={setBrushColor}
          onSizeChange={setBrushSize}
          onClear={handleClear}
          onCapture={handleCapture}
        />
      </div>

      {/* Header */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
        <div className="glass-panel px-6 py-3">
          <h1 className="text-2xl font-bold bg-gradient-ar bg-clip-text text-transparent">
            AR Hand Drawing
          </h1>
        </div>
      </div>

      {/* Instructions */}
      {!isTracking && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2">
          <div className="glass-panel px-4 py-2 max-w-md text-center">
            <p className="text-sm text-muted-foreground">
              Click play to start hand tracking, then activate drawing mode and point with your index finger to draw in AR!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};