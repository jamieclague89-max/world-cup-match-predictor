import { useState, useEffect } from 'react';

/**
 * Returns the current timestamp (ms), updated on the given interval.
 * Use a longer interval (e.g. 60 000) for non-critical displays to
 * minimise re-renders; use 1 000 for live countdown clocks.
 */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
