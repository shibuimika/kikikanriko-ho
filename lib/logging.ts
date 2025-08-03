// Structured logging utility
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  route?: string;
  request_id?: string;
  model?: string;
  latency_ms?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  outcome?: 'success' | 'error' | 'retry';
  [key: string]: any;
}

class Logger {
  private createLogEntry(
    level: LogEntry['level'], 
    message: string, 
    metadata?: Partial<LogEntry>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...metadata
    };
  }

  info(message: string, metadata?: Partial<LogEntry>) {
    const logEntry = this.createLogEntry('info', message, metadata);
    console.log(JSON.stringify(logEntry));
  }

  warn(message: string, metadata?: Partial<LogEntry>) {
    const logEntry = this.createLogEntry('warn', message, metadata);
    console.warn(JSON.stringify(logEntry));
  }

  error(message: string, metadata?: Partial<LogEntry>) {
    const logEntry = this.createLogEntry('error', message, metadata);
    console.error(JSON.stringify(logEntry));
  }

  // Specific method for API route logging
  apiCall(
    route: string,
    request_id: string,
    model: string,
    latency_ms: number,
    prompt_tokens: number,
    completion_tokens: number,
    outcome: 'success' | 'error' | 'retry',
    message: string = 'API call completed'
  ) {
    this.info(message, {
      route,
      request_id,
      model,
      latency_ms,
      prompt_tokens,
      completion_tokens,
      outcome
    });
  }
}

export const logger = new Logger();