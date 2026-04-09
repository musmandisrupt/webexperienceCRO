'use client'

import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { InsightType } from '@/types'

interface InsightFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  category: string
  onCategoryChange: (value: string) => void
  confidence: string
  onConfidenceChange: (value: string) => void
  onClear: () => void
}

const categories = [
  { value: '', label: 'All' },
  { value: InsightType.STEAL, label: 'Steal' },
  { value: InsightType.ADAPT, label: 'Adapt' },
  { value: InsightType.AVOID, label: 'Avoid' },
]

const confidenceLevels = [
  { value: '', label: 'All Confidence' },
  { value: '5', label: '5 Stars' },
  { value: '4', label: '4+ Stars' },
  { value: '3', label: '3+ Stars' },
  { value: '2', label: '2+ Stars' },
  { value: '1', label: '1+ Stars' },
]

export default function InsightFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  confidence,
  onConfidenceChange,
  onClear,
}: InsightFiltersProps) {
  const hasActiveFilters = search || category || confidence

  return (
    <div className="bg-[#1E293B] rounded-lg border border-[#334155] p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-[#64748B]" />
          </div>
          <input
            type="text"
            placeholder="Search insights..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 rounded-lg bg-transparent border border-[#334155] text-white placeholder-[#64748B] focus:border-[#22D3EE] outline-none sm:text-sm"
          />
        </div>

        {/* Confidence Dropdown */}
        <select
          value={confidence}
          onChange={(e) => onConfidenceChange(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-white focus:border-[#22D3EE] outline-none sm:text-sm"
        >
          {confidenceLevels.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm text-[#94A3B8] hover:text-white transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onCategoryChange(cat.value)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              category === cat.value
                ? 'bg-[#22D3EE] text-[#0A0F1C]'
                : 'bg-[#0F172A] text-[#94A3B8] border border-[#334155] hover:border-[#22D3EE] hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  )
}
