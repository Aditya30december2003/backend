const DEBUG_API_TIMING = process.env.DEBUG_API_TIMING === "1";

export function createRouteLogger(scope: string) {
  const requestId = `${scope}#${Math.random().toString(36).slice(2, 8)}`;
  const formatLabel = (label: string) => `${requestId}:${label}`;
  const log = (message: string, details?: unknown) => {
    if (!DEBUG_API_TIMING) return;
    if (details === undefined) {
      console.log(requestId, message);
      return;
    }
    console.log(requestId, message, details);
  };

  return {
    enabled: DEBUG_API_TIMING,
    start(label: string) {
      const timerLabel = formatLabel(label);
      if (DEBUG_API_TIMING) console.time(timerLabel);
      return timerLabel;
    },
    end(timerLabel: string) {
      if (DEBUG_API_TIMING) console.timeEnd(timerLabel);
    },
    log,
    async time<T>(label: string, run: () => Promise<T>, details?: unknown) {
      const timerLabel = formatLabel(label);
      if (details !== undefined) {
        log(`${label} start`, details);
      }
      if (DEBUG_API_TIMING) console.time(timerLabel);
      try {
        return await run();
      } finally {
        if (DEBUG_API_TIMING) console.timeEnd(timerLabel);
      }
    },
  };
}
