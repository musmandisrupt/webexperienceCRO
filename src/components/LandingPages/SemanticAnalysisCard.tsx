'use client'

import React, { useState } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

interface SemanticAnalysisCardProps {
  analysis: any
  title?: string
  showDetails?: boolean
}

export default function SemanticAnalysisCard({ 
  analysis, 
  title = "Semantic Analysis", 
  showDetails = false 
}: SemanticAnalysisCardProps) {
  const [isExpanded, setIsExpanded] = useState(showDetails)

  if (!analysis) return null

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🧠 {title}</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          {isExpanded ? (
            <>
              <EyeSlashIcon className="h-4 w-4 mr-1" />
              Hide Details
            </>
          ) : (
            <>
              <EyeIcon className="h-4 w-4 mr-1" />
              Show Details
            </>
          )}
        </button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{analysis.totalFolds}</div>
          <div className="text-sm text-blue-700">Total Folds</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {analysis.foldSegments?.filter((f: any) => f.confidence > 0.7).length || 0}
          </div>
          <div className="text-sm text-green-700">High Confidence</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {analysis.pageFlow?.conversionPoints?.length || 0}
          </div>
          <div className="text-sm text-purple-700">Conversion Points</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {Math.round(analysis.metadata?.processingTime || 0)}ms
          </div>
          <div className="text-sm text-orange-700">Processing Time</div>
        </div>
      </div>

      {/* User Journey */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">🛤️ User Journey</h4>
        <div className="flex flex-wrap gap-2">
          {analysis.pageFlow?.userJourney?.map((step: string, index: number) => (
            <div key={index} className="flex items-center">
              <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                {step}
              </span>
              {index < analysis.pageFlow.userJourney.length - 1 && (
                <span className="mx-2 text-gray-400">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Results */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Fold Analysis */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">📊 Fold Analysis</h4>
            <div className="space-y-3">
              {analysis.foldSegments?.map((fold: any, index: number) => (
                <div key={fold.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">Fold {index + 1}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      fold.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                      fold.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {Math.round(fold.confidence * 100)}% confidence
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Section:</span> {fold.sectionType}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Tags:</span> {fold.tags.join(', ')}
                  </div>
                  {fold.content && (
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Content:</span> {fold.content.substring(0, 100)}...
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Conversion Points */}
          {analysis.pageFlow?.conversionPoints?.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">🎯 Conversion Points</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.pageFlow.conversionPoints.map((point: string, index: number) => (
                  <span key={index} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                    {point}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Sections */}
          {analysis.pageFlow?.keySections?.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">🔑 Key Sections</h4>
              <div className="space-y-2">
                {analysis.pageFlow.keySections.map((section: string, index: number) => (
                  <div key={index} className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                    {section}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
