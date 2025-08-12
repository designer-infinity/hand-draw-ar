import { Button } from "@/components/ui/button";
import { Play, Pause, Eraser, Palette, Camera } from "lucide-react";
import { useState } from "react";

interface ARControlsProps {
  isTracking: boolean;
  isDrawing: boolean;
  brushColor: string;
  brushSize: number;
  onToggleTracking: () => void;
  onToggleDrawing: () => void;
  onColorChange: (color: string) => void;
  onSizeChange: (size: number) => void;
  onClear: () => void;
  onCapture: () => void;
}

const colors = [
  "#00FFFF", // Cyan
  "#FF00FF", // Magenta
  "#00FF00", // Green
  "#FFFF00", // Yellow
  "#FF6600", // Orange
  "#FF0000", // Red
  "#FFFFFF", // White
  "#8800FF", // Purple
];

const sizes = [2, 4, 8, 12, 16];

export const ARControls = ({
  isTracking,
  isDrawing,
  brushColor,
  brushSize,
  onToggleTracking,
  onToggleDrawing,
  onColorChange,
  onSizeChange,
  onClear,
  onCapture,
}: ARControlsProps) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
      <div className="glass-panel p-4">
        <div className="flex items-center gap-4">
          {/* Main Controls */}
          <Button
            variant={isTracking ? "default" : "secondary"}
            size="lg"
            onClick={onToggleTracking}
            className="neon-glow"
          >
            {isTracking ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>

          <Button
            variant={isDrawing ? "default" : "secondary"}
            size="lg"
            onClick={onToggleDrawing}
            disabled={!isTracking}
          >
            <Palette className="w-5 h-5" />
          </Button>

          {/* Color Picker */}
          <div className="relative">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="relative overflow-hidden"
            >
              <div 
                className="absolute inset-0 opacity-50"
                style={{ backgroundColor: brushColor }}
              />
              <Palette className="w-5 h-5 relative z-10" />
            </Button>
            
            {showColorPicker && (
              <div className="absolute bottom-full mb-2 left-0 glass-panel p-2">
                <div className="grid grid-cols-4 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-lg border-2 hover:scale-110 transition-transform ${
                        brushColor === color ? 'border-primary' : 'border-border'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        onColorChange(color);
                        setShowColorPicker(false);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Size Picker */}
          <div className="relative">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowSizePicker(!showSizePicker)}
            >
              <div 
                className="w-4 h-4 bg-primary rounded-full"
                style={{ 
                  width: `${Math.min(brushSize, 16)}px`,
                  height: `${Math.min(brushSize, 16)}px`
                }}
              />
            </Button>
            
            {showSizePicker && (
              <div className="absolute bottom-full mb-2 left-0 glass-panel p-2">
                <div className="flex flex-col gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      className={`flex items-center justify-center w-12 h-8 rounded border hover:bg-secondary ${
                        brushSize === size ? 'bg-primary text-primary-foreground' : ''
                      }`}
                      onClick={() => {
                        onSizeChange(size);
                        setShowSizePicker(false);
                      }}
                    >
                      <div 
                        className="bg-current rounded-full"
                        style={{ 
                          width: `${Math.min(size, 12)}px`,
                          height: `${Math.min(size, 12)}px`
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Clear */}
          <Button
            variant="destructive"
            size="lg"
            onClick={onClear}
            disabled={!isDrawing}
          >
            <Eraser className="w-5 h-5" />
          </Button>

          {/* Capture */}
          <Button
            variant="outline"
            size="lg"
            onClick={onCapture}
            className="neon-glow"
          >
            <Camera className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};