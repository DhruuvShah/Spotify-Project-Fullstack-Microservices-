import { useState, useCallback } from "react";

/**
 * useState that persists to localStorage.
 *
 *   const [volume, setVolume] = useLocalStorage("player-volume", 1);
 *
 * The value is serialised with JSON.stringify / JSON.parse so it works with
 * numbers, booleans, and plain objects — not just strings.
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (valueOrUpdater) => {
      setStoredValue((prev) => {
        const next =
          typeof valueOrUpdater === "function"
            ? valueOrUpdater(prev)
            : valueOrUpdater;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Ignore — storage quota exceeded or private browsing
        }
        return next;
      });
    },
    [key]
  );

  const remove = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {}
    setStoredValue(initialValue);
  }, [key, initialValue]);

  return [storedValue, setValue, remove];
}
