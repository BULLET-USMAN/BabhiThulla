type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    const safeContext = context ? this.sanitizeContext(context) : undefined;
    const contextStr = safeContext ? ` ${JSON.stringify(safeContext)}` : '';

    if (level === 'error') {
      console.error(`[${timestamp}] [ERROR] ${message}${contextStr}`);
    } else if (level === 'warn') {
      console.warn(`[${timestamp}] [WARN] ${message}${contextStr}`);
    } else if (level === 'debug') {
      if (process.env.DEBUG || process.env.NODE_ENV === 'development') {
        console.debug(`[${timestamp}] [DEBUG] ${message}${contextStr}`);
      }
    } else {
      console.log(`[${timestamp}] [INFO] ${message}${contextStr}`);
    }
  }

  /**
   * Masks sensitive credentials like reconnect tokens and private player hands from logs.
   */
  private sanitizeContext(context: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(context)) {
      if (/token|credential|secret|password/i.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (key === 'hand' || key === 'myHand') {
        sanitized[key] = Array.isArray(val) ? `[Card count: ${val.length}]` : val;
      } else if (typeof val === 'object' && val !== null) {
        sanitized[key] = this.sanitizeContext(val as Record<string, unknown>);
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log('error', message, context);
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }
}

export const logger = new Logger();
