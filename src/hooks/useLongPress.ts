import { useRef, useCallback } from "react";

export function useLongPress(callback: () => void, delay = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didTriggerRef = useRef(false);

  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    didTriggerRef.current = false;
    timerRef.current = setTimeout(() => {
      didTriggerRef.current = true;
      callback();
    }, delay);
  }, [callback, delay]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
  };
}
