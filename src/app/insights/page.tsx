'use client'

import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import InsightCard from '@/components/Insights/InsightCard'
import InsightFilters from '@/components/Insights/InsightFilters'
import { PlusIcon, LightBulbIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import type { Insight } from '@/types'

interface InsightWithRelations extends Insight {
  landingPage?: {
    id: string
    url: string
    title?: string
    competitor?: {
      id: string
      name: string
      website: string
    }
  }
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<InsightWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [confidence, setConfidence] = useState('')

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch('/api/insights')
        const data = await res.json()
        if (data.success) {
          setInsights(data.insights)
        }
      } catch (error) {
        console.error('Failed to fetch insights:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchInsights()
  }, [])

  const filteredInsights = useMemo(() => {
    return insights.filter((insight) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesTitle = insight.title.toLowerCase().includes(searchLower)
        const matchesDesc = insight.description.toLowerCase().includes(searchLower)
        if (!matchesTitle && !matchesDesc) return false
      }
      // Category filter
      if (category && insight.category !== category) return false
      // Confidence filter
      if (confidence && insight.confidence < Number(confidence)) return false
      return true
    })
  }, [insights, search, category, confidence])

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-bold text-white">Insights</h1>
          <p className="text-sm text-gray-400 mt-1">
            Steal, adapt, and avoid patterns from competitor analysis
          </p>
        </div>
        <Link
          href="/insights/new"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-[#22D3EE] text-[#0A0F1C] font-semibold text-sm hover:bg-[#06B6D4] transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Insight
        </Link>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {/* Filters */}
          <InsightFilters
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            confidence={confidence}
            onConfidenceChange={setConfidence}
            onClear={() => {
              setSearch('')
              setCategory('')
              setConfidence('')
            }}
          />

          {/* Loading skeleton */}
          {loading ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-[#1E293B] rounded-xl p-6 animate-pulse"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-6 w-16 bg-[#334155] rounded-full" />
                    <div className="flex space-x-2">
                      <div className="h-5 w-5 bg-[#334155] rounded" />
                      <div className="h-5 w-5 bg-[#334155] rounded" />
                    </div>
                  </div>
                  <div className="h-5 w-3/4 bg-[#334155] rounded mb-3" />
                  <div className="space-y-2 mb-4">
                    <div className="h-3 w-full bg-[#334155] rounded" />
                    <div className="h-3 w-5/6 bg-[#334155] rounded" />
                    <div className="h-3 w-2/3 bg-[#334155] rounded" />
                  </div>
                  <div className="h-4 w-1/3 bg-[#334155] rounded mb-4" />
                  <div className="border-t border-[#334155] pt-4">
                    <div className="h-3 w-1/2 bg-[#334155] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredInsights.length === 0 && insights.length === 0 ? (
            /* Empty state */
            <div className="text-center py-16">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[#1E293B] mb-4">
                <LightBulbIcon className="h-8 w-8 text-[#22D3EE]" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                No insights yet
              </h3>
              <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
                Run a semantic analysis on a landing page to generate insights
                automatically, or add one manually.
              </p>
              <div className="mt-6">
                <Link
                  href="/insights/new"
                  className="inline-flex items-center px-5 py-2.5 rounded-lg bg-[#22D3EE] text-[#0A0F1C] font-semibold text-sm hover:bg-[#06B6D4] transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Insight
                </Link>
              </div>
            </div>
          ) : filteredInsights.length === 0 ? (
            /* No results from filters */
            <div className="text-center py-12">
              <p className="text-gray-400">
                No insights match your current filters.
              </p>
            </div>
          ) : (
            /* Insights Grid */
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {filteredInsights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
