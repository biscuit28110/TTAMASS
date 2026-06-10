type Level = 'log' | 'warn' | 'error';

function emit(level: Level, screen: string, message: string, data?: unknown) {
  const prefix = `[TTAMASS][${screen}]`;
  const formatted = data !== undefined ? `${message} ${JSON.stringify(data)}` : message;
  console[level](`${prefix} ${level.toUpperCase()}: ${formatted}`);
}

export const logger = {
  log: (screen: string, message: string, data?: unknown) => emit('log', screen, message, data),
  warn: (screen: string, message: string, data?: unknown) => emit('warn', screen, message, data),
  error: (screen: string, message: string, data?: unknown) => emit('error', screen, message, data),
};

// Global handler for native/non-React errors
const previousHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  logger.error('global', `${isFatal ? '[FATAL] ' : ''}${error?.message}`, { stack: error?.stack });
  previousHandler?.(error, isFatal);
});

// Unhandled promise rejections
const anyGlobal = global as unknown as Record<string, unknown>;
if (typeof anyGlobal['HermesInternal'] !== 'undefined') {
  // Hermes surfaces unhandled rejections via ErrorUtils — already covered above
} else {
  (global as unknown as { addEventListener?: (event: string, cb: (e: { reason: unknown }) => void) => void })
    .addEventListener?.('unhandledrejection', (e) => {
      logger.error('global', 'Unhandled promise rejection', e.reason);
    });
}
