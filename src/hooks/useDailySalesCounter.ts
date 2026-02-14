import { useState, useEffect, useRef } from "react";

/** Flip to true when real analytics backend is ready */
export const USE_LIVE_ANALYTICS = false;

const STORAGE_KEY = "yangu_daily_sales_value";
const DEFAULT_START = 1532492.32;
const SAVE_INTERVAL_MS = 5000;

function getStoredValue(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const n = parseFloat(raw);
      if (!isNaN(n) && n > 0) return n;
    }
  } catch {}
  return DEFAULT_START;
}

export function useDailySalesCounter(): string {
  const [value, setValue] = useState(getStoredValue);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    if (USE_LIVE_ANALYTICS) return;

    const tick = setInterval(() => {
      setValue((prev) => {
        const increment = 0.5 + Math.random() * 3;
        return +(prev + increment).toFixed(2);
      });
    }, 1000);

    const persist = setInterval(() => {
      try {
        localStorage.setItem(STORAGE_KEY, String(valueRef.current));
      } catch {}
    }, SAVE_INTERVAL_MS);

    return () => {
      clearInterval(tick);
      clearInterval(persist);
      try {
        localStorage.setItem(STORAGE_KEY, String(valueRef.current));
      } catch {}
    };
  }, []);

  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
