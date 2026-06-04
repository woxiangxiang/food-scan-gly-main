import { useEffect, useState, useCallback } from "react";

export interface GlucoseEntry {
  id: string;
  value: number;
  timestamp: number;
}

const KEY = "bloodGlucose";

function read(): GlucoseEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function useGlucose() {
  const [entries, setEntries] = useState<GlucoseEntry[]>([]);

  useEffect(() => {
    setEntries(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setEntries(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = (next: GlucoseEntry[]) => {
    setEntries(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const add = useCallback(
    (value: number) => {
      const next = [
        ...read(),
        { id: crypto.randomUUID(), value, timestamp: Date.now() },
      ].sort((a, b) => a.timestamp - b.timestamp);
      persist(next);
    },
    [],
  );

  const remove = useCallback((id: string) => {
    persist(read().filter((e) => e.id !== id));
  }, []);

  return { entries, add, remove };
}
