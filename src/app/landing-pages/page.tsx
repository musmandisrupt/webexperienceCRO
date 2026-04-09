'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import LandingPageCard from '@/components/LandingPages/LandingPageCard'
import Link from 'next/link'

export default function LandingPagesPage() {
  const [landingPages, setLandingPages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [showSort, setShowSort] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'analyzed' | 'pending'>('all')
  const [competitorFilter, setCompetitorFilter] = useState('all')

  useEffect(() => {
    fetch('/api/landing-pages')
      .then(res => res.json())
      .then(data => {
        if (data.success) setLandingPages(data.landingPages)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const uniqueCompetitors = useMemo(() => {
    const names = new Set<string>()
    landingPages.forEach(p => {
      if (p.competitor?.name) names.add(p.competitor.name)
    })
    return Array.from(names).sort()
  }, [landingPages])

  const filteredPages = useMemo(() => {
    let pages = landingPages

    if (search) {
      const q = search.toLowerCase()
      pages = pages.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        p.url.toLowerCase().includes(q) ||
        (p.competitor?.name || '').toLowerCase().includes(q)
      )
    }

    if (statusFilter === 'analyzed') {
      pages = pages.filter(p => !!p.semanticAnalysis)
    } else if (statusFilter === 'pending') {
      pages = pages.filter(p => !p.semanticAnalysis)
    }

    if (competitorFilter !== 'all') {
      pages = pages.filter(p => p.competitor?.name === competitorFilter)
    }

    if (sortBy === 'newest') pages = [...pages].sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
    if (sortBy === 'oldest') pages = [...pages].sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime())
    if (sortBy === 'az') pages = [...pages].sort((a, b) => (a.title || a.url).localeCompare(b.title || b.url))
    if (sortBy === 'analyzed') pages = [...pages].sort((a, b) => (b.semanticAnalysis ? 1 : 0) - (a.semanticAnalysis ? 1 : 0))
    if (sortBy === 'pending') pages = [...pages].sort((a, b) => (a.semanticAnalysis ? 1 : 0) - (b.semanticAnalysis ? 1 : 0))

    return pages
  }, [landingPages, search, statusFilter, competitorFilter, sortBy])

  const handleDelete = useCallback((deletedId: string) => {
    setLandingPages(prev => prev.filter(page => page.id !== deletedId))
  }, [])

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full p-8 gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-white">Landing Pages</h1>
            <p className="text-sm text-[#64748B] mt-1">Browse and analyze captured competitor pages</p>
          </div>
        </div>

        {/* Filter Row */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#1E293B]">
            <svg className="w-4 h-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Search landing pages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-[13px] text-white placeholder:text-[#475569] outline-none"
            />
          </div>
          <button
            onClick={() => { setShowFilters(f => !f); setShowSort(false) }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${showFilters ? 'bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/30' : 'bg-[#1E293B] text-[#94A3B8] hover:bg-[#1E293B]/80'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
            Filters
          </button>
          <div className="relative">
            <button
              onClick={() => { setShowSort(s => !s); setShowFilters(false) }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${showSort ? 'bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/30' : 'bg-[#1E293B] text-[#94A3B8] hover:bg-[#1E293B]/80'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-4.5L16.5 16.5m0 0L12 12m4.5 4.5V3" />
              </svg>
              Sort
            </button>
            {showSort && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#1E293B] border border-[#334155] rounded-lg py-1 z-50 shadow-xl">
                {([
                  ['newest', 'Newest first'],
                  ['oldest', 'Oldest first'],
                  ['az', 'A\u2013Z by title'],
                  ['analyzed', 'Analyzed first'],
                  ['pending', 'Pending first'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => { setSortBy(value); setShowSort(false) }}
                    className={`w-full text-left px-4 py-2 text-[13px] transition-colors ${sortBy === value ? 'text-[#22D3EE] bg-[#22D3EE]/10' : 'text-[#94A3B8] hover:bg-[#334155] hover:text-white'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="flex items-center gap-4 px-4 py-3 bg-[#1E293B] border border-[#334155] rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#64748B] font-medium uppercase tracking-wide">Status</span>
              <div className="flex items-center rounded-lg overflow-hidden border border-[#334155]">
                {([['all', 'All'], ['analyzed', 'Analyzed'], ['pending', 'Pending']] as const).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${statusFilter === value ? 'bg-[#22D3EE]/10 text-[#22D3EE]' : 'text-[#94A3B8] hover:text-white'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-px h-6 bg-[#334155]" />
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#64748B] font-medium uppercase tracking-wide">Competitor</span>
              <select
                value={competitorFilter}
                onChange={(e) => setCompetitorFilter(e.target.value)}
                className="bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-1.5 text-[12px] text-[#94A3B8] outline-none focus:border-[#22D3EE]/50"
              >
                <option value="all">All competitors</option>
                {uniqueCompetitors.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#1E293B] rounded-xl overflow-hidden animate-pulse">
                <div className="h-[240px] bg-[#0F172A]" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-3/4 bg-[#0F172A] rounded" />
                  <div className="h-3 w-1/2 bg-[#0F172A] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
            <svg className="w-12 h-12 text-[#1E293B] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
            <h3 className="text-sm font-medium text-white mb-1">No landing pages</h3>
            <p className="text-sm text-[#475569] mb-6">Get started by capturing your first competitor landing page.</p>
            <Link href="/capture" className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#22D3EE] text-[#0A0F1C] text-[13px] font-semibold">
              Capture Page
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredPages.map((page) => (
              <LandingPageCard key={page.id} landingPage={page} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Capture Button */}
      <Link
        href="/capture"
        className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-[#22D3EE] text-[#0A0F1C] font-semibold rounded-full shadow-lg hover:bg-[#22D3EE]/90 transition-colors z-50"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Capture
      </Link>
    </DashboardLayout>
  )
}
