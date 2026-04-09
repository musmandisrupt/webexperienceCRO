import { LogLevel, LogEntry } from './logger-types'

export class Logger {
  private logDir: string
  private logFile: string
  private maxLogSize: number = 10 * 1024 * 1024 // 10MB
  private maxLogFiles: number = 5
  private isBrowser: boolean

  constructor(component: string = 'general') {
    this.isBrowser = typeof window !== 'undefined'
    
    if (this.isBrowser) {
      // Browser environment - use localStorage or console only
      this.logDir = ''
      this.logFile = ''
    } else {
      // Server environment - use file system
      this.logDir = `logs`
      this.logFile = `${component}-${new Date().toISOString().split('T')[0]}.log`
    }
  }

  private writeLog(entry: LogEntry): void {
    try {
      if (this.isBrowser) {
        // Browser: log to console and localStorage
        this.logToBrowser(entry)
      } else {
        // Server: log to file
        this.logToFile(entry)
      }
    } catch (error) {
      console.error('Failed to write log:', error)
    }
  }

  private logToBrowser(entry: LogEntry): void {
    // Always log to console in browser
    const consoleMessage = `[${entry.timestamp}] ${entry.level} [${entry.component}]: ${entry.message}`
    
    switch (entry.level) {
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(consoleMessage, entry.data || '', entry.error || '')
        break
      case LogLevel.WARN:
        console.warn(consoleMessage, entry.data || '')
        break
      case LogLevel.INFO:
        console.info(consoleMessage, entry.data || '')
        break
      case LogLevel.DEBUG:
        console.debug(consoleMessage, entry.data || '')
        break
    }

    // Try to store in localStorage for persistence
    try {
      const logsKey = `logs_${entry.component}`
      const existingLogs = localStorage.getItem(logsKey) || '[]'
      const logs = JSON.parse(existingLogs)
      logs.push(entry)
      
      // Keep only last 100 logs per component
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100)
      }
      
      localStorage.setItem(logsKey, JSON.stringify(logs))
    } catch (storageError) {
      // Ignore localStorage errors
    }
  }

  private logToFile(entry: LogEntry): void {
    if (this.isBrowser) return
    
    try {
      // Dynamic import to avoid browser bundling issues
      const fs = require('fs')
      const path = require('path')
      
      const fullLogDir = path.join(process.cwd(), this.logDir)
      const fullLogFile = path.join(fullLogDir, this.logFile)
      
      // Ensure log directory exists
      if (!fs.existsSync(fullLogDir)) {
        fs.mkdirSync(fullLogDir, { recursive: true })
      }
      
      const logLine = JSON.stringify(entry) + '\n'
      
      // Check if log file exists and get its size
      if (fs.existsSync(fullLogFile)) {
        const stats = fs.statSync(fullLogFile)
        if (stats.size > this.maxLogSize) {
          this.rotateLogs()
        }
      }
      
      fs.appendFileSync(fullLogFile, logLine)
      
      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        const consoleMessage = `[${entry.timestamp}] ${entry.level} [${entry.component}]: ${entry.message}`
        switch (entry.level) {
          case LogLevel.ERROR:
          case LogLevel.FATAL:
            console.error(consoleMessage, entry.data || '', entry.error || '')
            break
          case LogLevel.WARN:
            console.warn(consoleMessage, entry.data || '')
            break
          case LogLevel.INFO:
            console.info(consoleMessage, entry.data || '')
            break
          case LogLevel.DEBUG:
            console.debug(consoleMessage, entry.data || '')
            break
        }
      }
    } catch (error) {
      console.error('Failed to log to file:', error)
    }
  }

  private rotateLogs(): void {
    if (this.isBrowser) return
    
    try {
      const fs = require('fs')
      const path = require('path')
      
      const fullLogDir = path.join(process.cwd(), this.logDir)
      const fullLogFile = path.join(fullLogDir, this.logFile)
      
      const baseName = path.basename(this.logFile, '.log')
      const ext = path.extname(this.logFile)
      
      // Remove oldest log file if we have too many
      for (let i = this.maxLogFiles - 1; i >= 0; i--) {
        const oldFile = path.join(fullLogDir, `${baseName}-${i}${ext}`)
        if (fs.existsSync(oldFile)) {
          if (i === this.maxLogFiles - 1) {
            fs.unlinkSync(oldFile)
          } else {
            fs.renameSync(oldFile, path.join(fullLogDir, `${baseName}-${i + 1}${ext}`))
          }
        }
      }
      
      // Rename current log file
      const newFile = path.join(fullLogDir, `${baseName}-1${ext}`)
      if (fs.existsSync(fullLogFile)) {
        fs.renameSync(fullLogFile, newFile)
      }
    } catch (error) {
      console.error('Failed to rotate logs:', error)
    }
  }

  debug(component: string, message: string, data?: any): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      component,
      message,
      data
    })
  }

  info(component: string, message: string, data?: any): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      component,
      message,
      data
    })
  }

  warn(component: string, message: string, data?: any): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      component,
      message,
      data
    })
  }

  error(component: string, message: string, error?: Error, data?: any): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      component,
      message,
      data,
      error,
      trace: error?.stack
    })
  }

  fatal(component: string, message: string, error?: Error, data?: any): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.FATAL,
      component,
      message,
      data,
      error,
      trace: error?.stack
    })
  }

  // Method to get recent logs for debugging
  getRecentLogs(lines: number = 100): string[] {
    if (this.isBrowser) {
      try {
        const logsKey = `logs_${this.logDir.split('/').pop() || 'general'}`
        const existingLogs = localStorage.getItem(logsKey) || '[]'
        const logs = JSON.parse(existingLogs)
        return logs.slice(-lines).map((log: any) => JSON.stringify(log))
      } catch (error) {
        return []
      }
    } else {
      try {
        const fs = require('fs')
        const path = require('path')
        const fullLogFile = path.join(process.cwd(), this.logDir, this.logFile)
        
        if (!fs.existsSync(fullLogFile)) {
          return []
        }
        
        const content = fs.readFileSync(fullLogFile, 'utf-8')
        const logLines = content.trim().split('\n')
        return logLines.slice(-lines)
      } catch (error) {
        console.error('Failed to read log file:', error)
        return []
      }
    }
  }

  // Method to get logs by level
  getLogsByLevel(level: LogLevel, lines: number = 100): string[] {
    const allLogs = this.getRecentLogs(lines)
    const filteredLogs: string[] = []
    
    for (const line of allLogs) {
      try {
        const entry = JSON.parse(line)
        if (entry.level === level) {
          filteredLogs.push(line)
        }
      } catch {
        // Skip invalid JSON lines
      }
    }
    
    return filteredLogs
  }

  // Method to clear logs
  clearLogs(): void {
    if (this.isBrowser) {
      try {
        const logsKey = `logs_${this.logDir.split('/').pop() || 'general'}`
        localStorage.removeItem(logsKey)
      } catch (error) {
        // Ignore localStorage errors
      }
    } else {
      try {
        const fs = require('fs')
        const path = require('path')
        const fullLogFile = path.join(process.cwd(), this.logDir, this.logFile)
        
        if (fs.existsSync(fullLogFile)) {
          fs.writeFileSync(fullLogFile, '')
        }
      } catch (error) {
        console.error('Failed to clear log file:', error)
      }
    }
  }
}

// Create logger instances for different components
export const captureLogger = new Logger('capture')
export const semanticLogger = new Logger('semantic')
export const apiLogger = new Logger('api')
export const generalLogger = new Logger('general')

// Utility function to log function entry/exit
export function logFunction<T extends any[], R>(
  logger: Logger,
  component: string,
  functionName: string,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now()
    const functionId = `${functionName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    logger.info(component, `Function ${functionName} started`, { functionId, args })
    
    try {
      const result = await fn(...args)
      const duration = Date.now() - startTime
      logger.info(component, `Function ${functionName} completed successfully`, { 
        functionId, 
        duration, 
        result: typeof result === 'object' ? JSON.stringify(result) : result 
      })
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      logger.error(component, `Function ${functionName} failed`, error as Error, { 
        functionId, 
        duration, 
        args 
      })
      throw error
    }
  }
}

// Export default logger
export default generalLogger
