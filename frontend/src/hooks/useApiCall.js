import { useState, useCallback, useEffect, useRef } from "react";

/**
 * Wraps an async function with loading / error / data state.
 *
 * Usage — manual trigger:
 *   const { data, loading, error, execute } = useApiCall(musicService.search);
 *   execute("radiohead");
 *
 * Usage — execute on mount:
 *   const { data, loading, error } = useApiCall(musicService.getAllMusic, { immediate: true });
 */
export function useApiCall(fn, { immediate = false, args = [] } = {}) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError]     = useState(null);

  // Keep fn stable — callers often pass inline arrow functions
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const execute = useCallback(async (...callArgs) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fnRef.current(...callArgs);
      setData(result);
      return result;
    } catch (err) {
      const message =
        err.response?.data?.message ??
        err.message ??
        "Something went wrong";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Run once on mount when immediate = true
  const ranRef = useRef(false);
  useEffect(() => {
    if (!immediate || ranRef.current) return;
    ranRef.current = true;
    execute(...args);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate]);

  return { data, loading, error, execute, setData };
}
