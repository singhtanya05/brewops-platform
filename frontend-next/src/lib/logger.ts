/**
 * Standardized Application Logger
 * Silences logs in production unless it's a warn/error.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  debug: (...args: any[]) => {
    if (!isProduction) {
      console.debug('[DEBUG]', ...args);
    }
  },
  
  info: (...args: any[]) => {
    if (!isProduction) {
      console.info('[INFO]', ...args);
    }
  },
  
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },
  
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
    
    // Safely attempt to send to the backend, ignore errors to prevent loops
    try {
      const errorPayload = {
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'ssr',
        messages: args.map(arg => 
          arg instanceof Error ? { message: arg.message, stack: arg.stack } : arg
        )
      };

      fetch('/api/v1/logs/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorPayload)
      }).catch(() => { /* silently fail to avoid log loops */ });
    } catch (e) {
      // Ignore
    }
  }
};
