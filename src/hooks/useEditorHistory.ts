import { useState, useCallback, useRef } from "react";

const MAX_HISTORY = 50;

export function useEditorHistory(initialHtml: string | null) {
  const [history, setHistory] = useState<string[]>(initialHtml ? [initialHtml] : []);
  const [pointer, setPointer] = useState(0);
  const isUndoRedoRef = useRef(false);

  const pushState = useCallback((html: string) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }
    setHistory((prev) => {
      const newHist = [...prev.slice(0, pointer + 1), html].slice(-MAX_HISTORY);
      setPointer(newHist.length - 1);
      return newHist;
    });
  }, [pointer]);

  const undo = useCallback((): string | null => {
    if (pointer <= 0) return null;
    isUndoRedoRef.current = true;
    const newPtr = pointer - 1;
    setPointer(newPtr);
    return history[newPtr] || null;
  }, [pointer, history]);

  const redo = useCallback((): string | null => {
    if (pointer >= history.length - 1) return null;
    isUndoRedoRef.current = true;
    const newPtr = pointer + 1;
    setPointer(newPtr);
    return history[newPtr] || null;
  }, [pointer, history]);

  const canUndo = pointer > 0;
  const canRedo = pointer < history.length - 1;

  const initHistory = useCallback((html: string) => {
    setHistory([html]);
    setPointer(0);
  }, []);

  return { pushState, undo, redo, canUndo, canRedo, initHistory };
}
