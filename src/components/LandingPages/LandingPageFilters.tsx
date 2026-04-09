'use client'

import { useState, useEffect, useCallback } from 'react'
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'

interface Competitor {
  id: string
  name: string
  industry?: string
}

interface LandingPageFiltersProps {
  onFilterChange: (filters: {
    search: string
    competitorId: string
    industry: string
    dateRange: string
  }) => void
}

const industries = [
  'Fintech',
  'Productivity',
  'Design',
  'Communication',
  'Project Management',
  'E-commerce',
  'Developer Tools',
  'SaaS',
  'Marketplace',
  'Social Media',
]

export default function LandingPageFilters({ onFilterChange }: LandingPageFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [dateRange, setDateRange] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [competitors, setCompetitors] = useState<Competitor[]>([])

  // Load competitors from API
  useEffect(() => {
    fetch('/api/competitors')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCompetitors(data.competitors)
        }
      })
      .catch(console.error)
  }, [])

  // Notify parent when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFilterChange({
        search: searchTerm,
        competitorId: selectedCompetitor,
        industry: selectedIndustry,
        dateRange: dateRange,
      })
    }, 300) // 300ms debounce for search, immediate for others

    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedCompetitor, selectedIndustry, dateRange, onFilterChange])

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedCompetitor('')
    setSelectedIndustry('')
    setDateRange('')
  }

  const dateRanges = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by URL, title, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <FunnelIcon className="h-4 w-4 mr-2" />
          Filters
        </button>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Competitor Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Competitor
              </label>
              <select
                value={selectedCompetitor}
                onChange={(e) => setSelectedCompetitor(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="">All Competitors</option>
                {competitors.map((competitor) => (
                  <option key={competitor.id} value={competitor.id}>
                    {competitor.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Industry Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="">All Industries</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Captured
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                {dateRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear all filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
