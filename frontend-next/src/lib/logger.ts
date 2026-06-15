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
  }
};
