/**
 * Structured logging utility for Datadog
 * 
 * This logger outputs JSON-formatted logs that Datadog can parse automatically
 * via Netlify Log Drains. Each log entry includes:
 * - Standard fields (level, message, timestamp)
 * - Context (service, env, version)
 * - Custom attributes for filtering and alerting
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  // Request context
  requestId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  
  // Business context
  earthquakeId?: string;
  region?: string;
  userId?: string;
  
  // Error context
  error?: Error | unknown;
  errorType?: string;
  
  // External service context
  service?: 'usgs' | 'mongodb' | 'openai' | 'pusher';
  
  // Custom attributes
  [key: string]: unknown;
}

interface StructuredLog {
  level: LogLevel;
  message: string;
  timestamp: string;
  
  // Datadog reserved attributes
  service: string;
  env: string;
  version: string;
  
  // Trace context (for APM correlation)
  dd?: {
    trace_id?: string;
    span_id?: string;
  };
  
  // Custom attributes
  [key: string]: unknown;
}

const SERVICE_NAME = 'baytremor';
const ENV = process.env.NODE_ENV || 'development';
const VERSION = process.env.NEXT_PUBLIC_VERSION || '1.0.0';

function formatError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      error: {
        kind: error.name,
        message: error.message,
        stack: error.stack,
      },
    };
  }
  return {
    error: {
      kind: 'UnknownError',
      message: String(error),
    },
  };
}

function createLog(level: LogLevel, message: string, context?: LogContext): StructuredLog {
  const log: StructuredLog = {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: SERVICE_NAME,
    env: ENV,
    version: VERSION,
  };
  
  if (context) {
    // Extract and format error if present
    if (context.error) {
      Object.assign(log, formatError(context.error));
      delete context.error;
    }
    
    // Add remaining context
    Object.assign(log, context);
  }
  
  return log;
}

function outputLog(log: StructuredLog): void {
  // Output as JSON for Datadog to parse
  const output = JSON.stringify(log);
  
  switch (log.level) {
    case 'error':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    case 'debug':
      console.debug(output);
      break;
    default:
      console.log(output);
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => {
    if (ENV === 'development') {
      outputLog(createLog('debug', message, context));
    }
  },
  
  info: (message: string, context?: LogContext) => {
    outputLog(createLog('info', message, context));
  },
  
  warn: (message: string, context?: LogContext) => {
    outputLog(createLog('warn', message, context));
  },
  
  error: (message: string, context?: LogContext) => {
    outputLog(createLog('error', message, context));
  },
};

// Request logging helper for API routes
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  context?: Omit<LogContext, 'method' | 'path' | 'statusCode' | 'duration'>
) {
  const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  
  logger[level](`${method} ${path} ${statusCode}`, {
    method,
    path,
    statusCode,
    duration,
    http: {
      method,
      url: path,
      status_code: statusCode,
    },
    ...context,
  });
}

// External service call logging
export function logExternalCall(
  service: LogContext['service'],
  operation: string,
  success: boolean,
  duration: number,
  context?: LogContext
) {
  const level: LogLevel = success ? 'info' : 'error';
  
  logger[level](`External call: ${service}.${operation}`, {
    service,
    operation,
    success,
    duration,
    external_service: service,
    ...context,
  });
}

export default logger;


