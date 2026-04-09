export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  component: string
  message: string
  data?: any
  error?: Error
  trace?: string
}
