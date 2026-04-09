import { NextRequest, NextResponse } from 'next/server'
import { captureLogger, semanticLogger, apiLogger, generalLogger } from '@/lib/logger'

export async function GET() {
  try {
    // Get recent logs from all loggers
    const captureLogs = captureLogger.getRecentLogs(50)
    const semanticLogs = semanticLogger.getRecentLogs(50)
    const apiLogs = apiLogger.getRecentLogs(50)
    const generalLogs = generalLogger.getRecentLogs(50)

    // Combine and sort all logs by timestamp
    const allLogs = [...captureLogs, ...semanticLogs, ...apiLogs, ...generalLogs]
      .map(log => {
        try {
          const entry = JSON.parse(log)
          return { ...entry, raw: log }
        } catch {
          return null
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-100) // Keep only last 100 logs

    return NextResponse.json({
      success: true,
      logs: allLogs.map(log => log.raw),
      summary: {
        total: allLogs.length,
        capture: captureLogs.length,
        semantic: semanticLogs.length,
        api: apiLogs.length,
        general: generalLogs.length,
        environment: typeof window !== 'undefined' ? 'browser' : 'server'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve logs' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    // Clear all log files
    captureLogger.clearLogs()
    semanticLogger.clearLogs()
    apiLogger.clearLogs()
    generalLogger.clearLogs()

    return NextResponse.json({
      success: true,
      message: 'All logs cleared successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to clear logs' },
      { status: 500 }
    )
  }
}
