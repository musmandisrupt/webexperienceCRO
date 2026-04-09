'use client'

import React, { useState, useEffect } from 'react'
import { EyeIcon, EyeSlashIcon, TrashIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface LogViewerProps {
  isOpen: boolean
  onClose: () => void
}

export default function LogViewer({ isOpen, onClose }: LogViewerProps) {
  const [logs, setLogs] = useState<string[]>([])
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/debug/logs')
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
        
        // Log the environment info
        if (data.summary?.environment) {
          console.log(`Logs environment: ${data.summary.environment}`)
        }
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
      // Fallback to browser logs if API fails
      try {
        const browserLogs = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('logs_')) {
            const logs = JSON.parse(localStorage.getItem(key) || '[]')
            browserLogs.push(...logs.map((log: any) => JSON.stringify(log)))
          }
        }
        setLogs(browserLogs)
      } catch (browserError) {
        console.error('Failed to get browser logs:', browserError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const clearLogs = async () => {
    try {
      await fetch('/api/debug/logs', { method: 'DELETE' })
      setLogs([])
    } catch (error) {
      console.error('Failed to clear logs:', error)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchLogs()
    }
  }, [isOpen])

  if (!isOpen) return null

  const filteredLogs = logs.filter(log => {
    if (filterLevel === 'all') return true
    try {
      const logEntry = JSON.parse(log)
      return logEntry.level === filterLevel
    } catch {
      return true
    }
  })

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl">
          {/* Header */}
          <div className="bg-gray-800 px-4 py-3 sm:px-6 flex items-center justify-between border-b border-gray-700">
            <div>
              <h3 className="text-lg font-medium text-white">🔍 Debug Logs</h3>
              <p className="text-sm text-gray-300">Capture process debugging and monitoring</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchLogs}
                disabled={isLoading}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded-md transition-colors"
                title="Refresh Logs"
              >
                <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={clearLogs}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors"
                title="Clear Logs"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="rounded-md bg-gray-700 text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-5 sm:p-6 bg-gray-900">
            {/* Filters */}
            <div className="mb-4 flex items-center space-x-4">
              <label className="text-sm text-gray-300">Filter Level:</label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="bg-gray-800 text-white text-sm rounded-md border border-gray-600 px-3 py-1"
              >
                <option value="all">All Levels</option>
                <option value="DEBUG">DEBUG</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
                <option value="FATAL">FATAL</option>
              </select>
              <span className="text-sm text-gray-400">
                {filteredLogs.length} of {logs.length} logs
              </span>
            </div>

            {/* Logs */}
            <div className="bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
              {filteredLogs.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  {isLoading ? 'Loading logs...' : 'No logs found'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLogs.map((log, index) => {
                    try {
                      const logEntry = JSON.parse(log)
                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-md text-sm font-mono ${
                            logEntry.level === 'ERROR' || logEntry.level === 'FATAL'
                              ? 'bg-red-900/20 border border-red-700'
                              : logEntry.level === 'WARN'
                              ? 'bg-yellow-900/20 border border-yellow-700'
                              : logEntry.level === 'INFO'
                              ? 'bg-blue-900/20 border border-blue-700'
                              : 'bg-gray-800 border border-gray-700'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  logEntry.level === 'ERROR' || logEntry.level === 'FATAL'
                                    ? 'bg-red-700 text-red-100'
                                    : logEntry.level === 'WARN'
                                    ? 'bg-yellow-700 text-yellow-100'
                                    : logEntry.level === 'INFO'
                                    ? 'bg-blue-700 text-blue-100'
                                    : 'bg-gray-700 text-gray-100'
                                }`}>
                                  {logEntry.level}
                                </span>
                                <span className="text-gray-400 text-xs">
                                  {new Date(logEntry.timestamp).toLocaleTimeString()}
                                </span>
                                <span className="text-gray-500 text-xs">
                                  [{logEntry.component}]
                                </span>
                              </div>
                              <div className="text-white">{logEntry.message}</div>
                              {logEntry.data && (
                                <div className="text-gray-300 text-xs mt-1">
                                  Data: {JSON.stringify(logEntry.data, null, 2)}
                                </div>
                              )}
                              {logEntry.error && (
                                <div className="text-red-300 text-xs mt-1">
                                  Error: {logEntry.error}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    } catch {
                      return (
                        <div key={index} className="p-3 bg-gray-800 border border-gray-700 rounded-md text-sm font-mono text-gray-400">
                          {log}
                        </div>
                      )
                    }
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
