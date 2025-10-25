// Debug utilities for development and production debugging

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.level = this.getLogLevel();
  }

  private getLogLevel(): LogLevel {
    const envLevel = process.env.DEBUG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'ERROR': return LogLevel.ERROR;
      case 'WARN': return LogLevel.WARN;
      case 'INFO': return LogLevel.INFO;
      case 'DEBUG': return LogLevel.DEBUG;
      case 'TRACE': return LogLevel.TRACE;
      default: return this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    
    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data, null, 2)}`;
    }
    return `${prefix} ${message}`;
  }

  error(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      // eslint-disable-next-line no-console
      console.error(this.formatMessage('ERROR', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      // eslint-disable-next-line no-console
      console.warn(this.formatMessage('WARN', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      // eslint-disable-next-line no-console
      console.log(this.formatMessage('INFO', message, data));
    }
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      // eslint-disable-next-line no-console
      console.log(this.formatMessage('DEBUG', message, data));
    }
  }

  trace(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.TRACE)) {
      // eslint-disable-next-line no-console
      console.log(this.formatMessage('TRACE', message, data));
    }
  }

  // Specialized logging methods
  auth(message: string, data?: any): void {
    this.debug(`[AUTH] ${message}`, data);
  }

  email(message: string, data?: any): void {
    this.debug(`[EMAIL] ${message}`, data);
  }

  database(message: string, data?: any): void {
    this.debug(`[DATABASE] ${message}`, data);
  }

  api(message: string, data?: any): void {
    this.debug(`[API] ${message}`, data);
  }

  security(message: string, data?: any): void {
    this.warn(`[SECURITY] ${message}`, data);
  }

  performance(message: string, data?: any): void {
    this.info(`[PERFORMANCE] ${message}`, data);
  }
}

// Export singleton instance
export const logger = new Logger();

// Helper functions for common debugging scenarios
export const debugAuth = (message: string, data?: any) => logger.auth(message, data);
export const debugEmail = (message: string, data?: any) => logger.email(message, data);
export const debugDatabase = (message: string, data?: any) => logger.database(message, data);
export const debugApi = (message: string, data?: any) => logger.api(message, data);
export const debugSecurity = (message: string, data?: any) => logger.security(message, data);
export const debugPerformance = (message: string, data?: any) => logger.performance(message, data);

// Request timing utility
export class RequestTimer {
  private startTime: number;
  private operation: string;

  constructor(operation: string) {
    this.operation = operation;
    this.startTime = performance.now();
    logger.trace(`[TIMER] Started: ${operation}`);
  }

  end(data?: any): void {
    const duration = performance.now() - this.startTime;
    logger.performance(`[TIMER] Completed: ${this.operation}`, {
      duration: `${duration.toFixed(2)}ms`,
      ...data
    });
  }
}

// Error context helper
export const logError = (error: unknown, context?: string) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  logger.error(`Error${context ? ` in ${context}` : ''}`, {
    message: errorMessage,
    stack: errorStack,
    timestamp: new Date().toISOString()
  });
};
