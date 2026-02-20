import { useEffect, useState } from "react";
import yanguY from "@/assets/yangu-y-icon.png";

interface Props {
  onComplete: () => void;
}

export function ImageAdsLoadingScreen({ onComplete }: Props) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Gathering info...");

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 99) {
          clearInterval(interval);
          return 99;
        }
        return prev + Math.floor(Math.random() * 8) + 2;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 50) setStatusText("Analyzing your product info...");
    if (progress >= 99) {
      const timer = setTimeout(onComplete, 600);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Rotating/pulsing Y logo */}
      <div className="relative mb-8">
        <div className="h-20 w-20 animate-yangu-spin">
          <img
            src={yanguY}
            alt="Loading"
            className="h-full w-full object-contain animate-yangu-pulse"
          />
        </div>
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-full bg-success/20 blur-xl animate-yangu-pulse" />
      </div>

      {/* Status text */}
      <p className="text-sm text-muted-foreground font-medium">
        {statusText} ({Math.min(progress, 99)}%)
      </p>
    </div>
  );
}
