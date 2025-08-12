import { useEffect, useRef, useState } from "react";
import { Camera } from "@mediapipe/camera_utils";
import { Hands, Results } from "@mediapipe/hands";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { HAND_CONNECTIONS } from "@mediapipe/hands";
import { toast } from "sonner";

interface CameraFeedProps {
  onHandData: (results: Results) => void;
  isTracking: boolean;
}

export const CameraFeed = ({ onHandData, isTracking }: CameraFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [camera, setCamera] = useState<Camera | null>(null);
  const [hands, setHands] = useState<Hands | null>(null);

  useEffect(() => {
    const initializeMediaPipe = async () => {
      try {
        // Initialize MediaPipe Hands
        const handsInstance = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          },
        });

        handsInstance.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        handsInstance.onResults((results: Results) => {
          if (canvasRef.current) {
            const canvasCtx = canvasRef.current.getContext("2d");
            if (canvasCtx) {
              canvasCtx.save();
              canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

              if (results.multiHandLandmarks && isTracking) {
                for (const landmarks of results.multiHandLandmarks) {
                  drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                    color: "#00FFFF",
                    lineWidth: 2,
                  });
                  drawLandmarks(canvasCtx, landmarks, {
                    color: "#FF00FF",
                    lineWidth: 1,
                    radius: 3,
                  });
                }
              }
              canvasCtx.restore();
            }
          }
          onHandData(results);
        });

        setHands(handsInstance);

        // Initialize camera
        if (videoRef.current) {
          const cameraInstance = new Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && isTracking) {
                await handsInstance.send({ image: videoRef.current });
              }
            },
            width: 1280,
            height: 720,
          });

          await cameraInstance.start();
          setCamera(cameraInstance);
          setIsLoading(false);
          toast.success("AR Camera initialized!");
        }
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
        toast.error("Failed to initialize camera. Please check permissions.");
        setIsLoading(false);
      }
    };

    initializeMediaPipe();

    return () => {
      if (camera) {
        camera.stop();
      }
      if (hands) {
        hands.close();
      }
    };
  }, []);

  useEffect(() => {
    if (hands && camera) {
      if (isTracking) {
        camera.start();
      } else {
        camera.stop();
      }
    }
  }, [isTracking, camera, hands]);

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Initializing AR Camera...</p>
          </div>
        </div>
      )}
      
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        style={{ transform: "scaleX(-1)" }}
      />
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
        width={1280}
        height={720}
        style={{ transform: "scaleX(-1)" }}
      />
      
      {/* AR Grid Overlay */}
      <div className="absolute inset-0 ar-grid opacity-20 pointer-events-none" />
      
      {/* Status indicator */}
      <div className="absolute top-4 left-4 glass-panel px-3 py-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-neon-green animate-pulse-glow' : 'bg-muted'}`} />
          <span className="text-sm font-medium">
            {isTracking ? 'Tracking Active' : 'Tracking Paused'}
          </span>
        </div>
      </div>
    </div>
  );
};