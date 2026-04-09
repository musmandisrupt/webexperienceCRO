'use client'

import React, { useState } from 'react'
import { PlayIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function TestProgressivePage() {
  const [url, setUrl] = useState('https://www.disrupt.com/')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<{
    regular?: any
    progressive?: any
  }>({})

  const testRegularCapture = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, competitorId: null }) // Remove competitorId for testing
      })
      const data = await response.json()
      setResults(prev => ({ ...prev, regular: data }))
    } catch (error) {
      console.error('Regular capture failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const testProgressiveCapture = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/progressive-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, competitorId: null }) // Remove competitorId for testing
      })
      const data = await response.json()
      setResults(prev => ({ ...prev, progressive: data }))
    } catch (error) {
      console.error('Progressive capture failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const testBoth = async () => {
    setIsLoading(true)
    try {
      // Test both capture methods
      const [regularResponse, progressiveResponse] = await Promise.all([
        fetch('/api/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, competitorId: null }) // Remove competitorId for testing
        }),
        fetch('/api/progressive-capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, competitorId: null }) // Remove competitorId for testing
        })
      ])

      const regularData = await regularResponse.json()
      const progressiveData = await progressiveResponse.json()

      setResults({ regular: regularData, progressive: progressiveData })
    } catch (error) {
      console.error('Testing both methods failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Progressive vs Regular Capture Test
          </h1>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
            />
          </div>

          <div className="flex space-x-4 mb-8">
            <button
              onClick={testRegularCapture}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              Test Regular Capture
            </button>

            <button
              onClick={testProgressiveCapture}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Test Progressive Capture
            </button>

            <button
              onClick={testBoth}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Test Both Methods
            </button>
          </div>

          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Capturing page...</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Regular Capture Results */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Regular Capture Results
              </h3>
              {results.regular ? (
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      results.regular.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {results.regular.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  {results.regular.success && (
                    <>
                      <div>
                        <span className="font-medium">Title:</span>
                        <span className="ml-2 text-gray-700">{results.regular.captureResult?.title || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium">Screenshot:</span>
                        <span className="ml-2 text-gray-700">{results.regular.captureResult?.screenshotPath || 'N/A'}</span>
                      </div>
                      {results.regular.captureResult?.screenshotPath && (
                        <img 
                          src={results.regular.captureResult.screenshotPath} 
                          alt="Regular capture"
                          className="w-full h-48 object-cover rounded border"
                        />
                      )}
                    </>
                  )}
                  {results.regular.error && (
                    <div className="text-red-600 text-sm">{results.regular.error}</div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No results yet</p>
              )}
            </div>

            {/* Progressive Capture Results */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Progressive Capture Results
              </h3>
              {results.progressive ? (
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      results.progressive.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {results.progressive.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  {results.progressive.success && (
                    <>
                      <div>
                        <span className="font-medium">Title:</span>
                        <span className="ml-2 text-gray-700">{results.progressive.captureResult?.title || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium">Screenshot:</span>
                        <span className="ml-2 text-gray-700">{results.progressive.captureResult?.screenshotPath || 'N/A'}</span>
                      </div>
                      {results.progressive.scrollProgress && (
                        <div className="bg-blue-50 p-3 rounded">
                          <h4 className="font-medium text-blue-900 mb-2">Scroll Progress:</h4>
                          <div className="text-sm text-blue-800 space-y-1">
                            <div>Total Scrolls: {results.progressive.scrollProgress.totalScrolls}</div>
                            <div>Content Loaded: {results.progressive.scrollProgress.contentLoaded ? 'Yes' : 'No'}</div>
                            <div>Animations Complete: {results.progressive.scrollProgress.animationsComplete ? 'Yes' : 'No'}</div>
                          </div>
                        </div>
                      )}
                      {results.progressive.captureResult?.screenshotPath && (
                        <img 
                          src={results.progressive.captureResult.screenshotPath} 
                          alt="Progressive capture"
                          className="w-full h-48 object-cover rounded border"
                        />
                      )}
                    </>
                  )}
                  {results.progressive.error && (
                    <div className="text-red-600 text-sm">{results.progressive.error}</div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No results yet</p>
              )}
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How Progressive Capture Works:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Scrolls through the page progressively to trigger lazy loading</li>
              <li>• Waits for animations and transitions to complete</li>
              <li>• Detects when new content is added dynamically</li>
              <li>• Takes screenshot after all progressive content is loaded</li>
              <li>• Returns to top of page for final capture</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
