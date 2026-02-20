import { useEffect, useState } from "react";
import { YanguLoader } from "@/components/primitives/YanguLoader";

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

  return <YanguLoader statusText={statusText} progress={progress} />;
}
