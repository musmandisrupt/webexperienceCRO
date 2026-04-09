'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import FoldAnalysisDisplay from '@/components/SemanticAnalysis/FoldAnalysisDisplay'
import CompetitorComparison from '@/components/SemanticAnalysis/CompetitorComparison'
import type { LandingPage, SemanticAnalysis } from '@/types'
import toast from 'react-hot-toast'

type ViewMode = 'analyze' | 'compare'

export default function SemanticAnalysisPage() {
  const searchParams = useSearchParams()
  const [landingPages, setLandingPages] = useState<LandingPage[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPage, setSelectedPage] = useState<LandingPage | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<SemanticAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  // Compare mode state
  const [viewMode, setViewMode] = useState<ViewMode>('analyze')
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set())
  const [isComparing, setIsComparing] = useState(false)
  const [comparisonResult, setComparisonResult] = useState<any>(null)

  // Startup groups for compare filtering
  const [startups, setStartups] = useState<any[]>([])
  const [selectedStartup, setSelectedStartup] = useState<string>('all')

  useEffect(() => {
    const pageIdFromUrl = searchParams.get('pageId')

    Promise.all([
      fetch('/api/landing-pages').then(r => r.json()),
      fetch('/api/competitor-groups').then(r => r.json()),
    ]).then(([pagesData, groupsData]) => {
      if (pagesData.success) {
        const pages = pagesData.landingPages || []
        setLandingPages(pages)
        // Auto-select from URL param, or first page
        const targetPage = pageIdFromUrl
          ? pages.find((p: LandingPage) => p.id === pageIdFromUrl)
          : pages[0]
        if (targetPage) handlePageSelect(targetPage)
      }
      if (groupsData.success) {
        setStartups(groupsData.groups || [])
      }
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  // Get competitor IDs belonging to the selected startup
  const startupCompetitorIds = useMemo(() => {
    if (selectedStartup === 'all') return null
    const startup = startups.find((s: any) => s.id === selectedStartup)
    if (!startup) return null
    return new Set((startup.competitors || []).map((c: any) => c.id))
  }, [startups, selectedStartup])

  const filteredPages = useMemo(() => {
    let pages = landingPages
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      pages = pages.filter(p =>
        (p.title || '').toLowerCase().includes(q) || p.url.toLowerCase().includes(q)
      )
    }
    // In compare mode, filter by startup group
    if (viewMode === 'compare' && startupCompetitorIds) {
      pages = pages.filter(p => p.competitorId && startupCompetitorIds.has(p.competitorId))
    }
    return pages
  }, [landingPages, searchTerm, viewMode, startupCompetitorIds])

  const analyzedPages = useMemo(() => {
    return landingPages.filter(p => p.semanticAnalysis)
  }, [landingPages])

  const avgConversionScore = useMemo(() => {
    const scores = landingPages
      .filter(p => p.semanticAnalysis)
      .map(p => {
        try {
          const parsed = typeof p.semanticAnalysis === 'string' ? JSON.parse(p.semanticAnalysis) : p.semanticAnalysis
          return parsed?.overallScores?.conversionScore || null
        } catch { return null }
      })
      .filter(Boolean) as number[]
    if (scores.length === 0) return null
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
  }, [landingPages])

  const handlePageSelect = (page: LandingPage) => {
    if (viewMode === 'compare') {
      toggleCompareSelection(page.id)
      return
    }
    setSelectedPage(page)
    if (page.semanticAnalysis) {
      try {
        const parsed = typeof page.semanticAnalysis === 'string' ? JSON.parse(page.semanticAnalysis) : page.semanticAnalysis
        setAnalysis(parsed)
      } catch { setAnalysis(null) }
    } else {
      setAnalysis(null)
    }
  }

  const toggleCompareSelection = (pageId: string) => {
    setSelectedForCompare(prev => {
      const next = new Set(prev)
      if (next.has(pageId)) {
        next.delete(pageId)
      } else {
        next.add(pageId)
      }
      return next
    })
  }

  const runAnalysis = async () => {
    if (!selectedPage) return
    if (analysis) {
      const confirmed = window.confirm(
        `Re-analyzing "${selectedPage?.title || selectedPage?.url}" will replace the existing analysis. Continue?`
      )
      if (!confirmed) return
    }
    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/semantic-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landingPageId: selectedPage.id }),
      })
      const result = await res.json()
      if (result.success) {
        setAnalysis(result.analysis)
        setSelectedPage({ ...selectedPage, semanticAnalysis: result.analysis })
        setLandingPages(prev => prev.map(p => p.id === selectedPage.id ? { ...p, semanticAnalysis: result.analysis } : p))
        toast.success('Analysis completed!')
      } else {
        toast.error(result.error || 'Analysis failed')
      }
    } catch {
      toast.error('Failed to run analysis')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const runComparison = async () => {
    if (selectedForCompare.size < 2) {
      toast.error('Select at least 2 analyzed pages to compare')
      return
    }
    setIsComparing(true)
    try {
      const res = await fetch('/api/competitor-comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageIds: Array.from(selectedForCompare) }),
      })
      const result = await res.json()
      if (result.success) {
        setComparisonResult(result.comparison)
        toast.success('Comparison generated!')
      } else {
        toast.error(result.error || 'Comparison failed')
      }
    } catch {
      toast.error('Failed to generate comparison')
    } finally {
      setIsComparing(false)
    }
  }

  const switchMode = (mode: ViewMode) => {
    setViewMode(mode)
    if (mode === 'analyze') {
      setSelectedForCompare(new Set())
      setComparisonResult(null)
      setSelectedStartup('all')
    }
  }

  const getStatus = (page: LandingPage) => {
    if (page.semanticAnalysis) return { icon: '✓', color: '#22D3EE', bg: '#22D3EE15' }
    return { icon: '○', color: '#64748B', bg: '#64748B15' }
  }

  return (
    <DashboardLayout>
      <div className="flex h-full">
        {/* Page List Sidebar */}
        <div className="w-[300px] flex-shrink-0 bg-[#0F172A] border-r border-[#1E293B] flex flex-col overflow-hidden">
          <div className="p-4 space-y-4">
            {/* Mode Toggle */}
            <div className="flex bg-[#0A0F1C] rounded-lg p-0.5">
              <button
                onClick={() => switchMode('analyze')}
                className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-colors ${
                  viewMode === 'analyze'
                    ? 'bg-[#1E293B] text-[#22D3EE]'
                    : 'text-[#64748B] hover:text-[#94A3B8]'
                }`}
              >
                Analyze
              </button>
              <button
                onClick={() => switchMode('compare')}
                className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-colors ${
                  viewMode === 'compare'
                    ? 'bg-[#1E293B] text-[#22D3EE]'
                    : 'text-[#64748B] hover:text-[#94A3B8]'
                }`}
              >
                Compare
              </button>
            </div>

            <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px]">
              {viewMode === 'compare' ? 'SELECT PAGES TO COMPARE' : 'PAGES TO ANALYZE'}
            </p>

            {viewMode === 'compare' && (
              <>
                <p className="text-[11px] text-[#475569]">
                  Select 2+ analyzed pages to generate a competitive intelligence report
                </p>
                {startups.length > 0 && (
                  <div>
                    <label className="block font-mono text-[9px] font-semibold text-[#475569] tracking-[1.5px] mb-1.5">FILTER BY STARTUP</label>
                    <select
                      value={selectedStartup}
                      onChange={e => { setSelectedStartup(e.target.value); setSelectedForCompare(new Set()) }}
                      className="w-full px-2.5 py-1.5 rounded-md bg-[#1E293B] text-xs text-white outline-none border border-[#334155] focus:border-[#22D3EE] transition-colors cursor-pointer"
                    >
                      <option value="all">All pages</option>
                      {startups.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.competitors?.length || 0} competitors)</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#1E293B]">
              <svg className="w-3.5 h-3.5 text-[#475569]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder="Search pages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent text-xs text-white placeholder:text-[#475569] outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-[#0F172A] rounded-lg p-3 animate-pulse">
                  <div className="h-3 w-3/4 bg-[#1E293B] rounded mb-2" />
                  <div className="h-2 w-1/2 bg-[#1E293B] rounded" />
                </div>
              ))
            ) : (
              filteredPages.map(page => {
                const isSelected = viewMode === 'analyze'
                  ? selectedPage?.id === page.id
                  : selectedForCompare.has(page.id)
                const status = getStatus(page)
                const isAnalyzed = !!page.semanticAnalysis
                const isDisabledForCompare = viewMode === 'compare' && !isAnalyzed

                return (
                  <button
                    key={page.id}
                    onClick={() => handlePageSelect(page)}
                    disabled={isDisabledForCompare}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      isDisabledForCompare
                        ? 'bg-[#0F172A] opacity-40 cursor-not-allowed'
                        : isSelected
                          ? 'bg-[#1E293B] ring-1 ring-[#22D3EE]'
                          : 'bg-[#0F172A] hover:bg-[#1E293B]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {viewMode === 'compare' && (
                          <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                            isSelected
                              ? 'bg-[#22D3EE] border-[#22D3EE]'
                              : 'border-[#475569]'
                          }`}>
                            {isSelected && (
                              <svg className="w-2.5 h-2.5 text-[#0A0F1C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                              </svg>
                            )}
                          </div>
                        )}
                        <span className="text-[13px] font-semibold text-white truncate">
                          {page.title || 'Untitled'}
                        </span>
                      </div>
                      <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ color: status.color, backgroundColor: status.bg }}>
                        {status.icon}
                      </span>
                      {(() => {
                        try {
                          const a = typeof page.semanticAnalysis === 'string' ? JSON.parse(page.semanticAnalysis) : page.semanticAnalysis
                          const score = a?.overallScores?.conversionScore
                          if (score) {
                            const color = score >= 8 ? '#22D3EE' : score >= 6 ? '#F59E0B' : '#EF4444'
                            return <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color, backgroundColor: `${color}15` }}>{score}/10</span>
                          }
                        } catch {}
                        return null
                      })()}
                    </div>
                    <p className={`font-mono text-[11px] text-[#475569] truncate ${viewMode === 'compare' ? 'ml-6' : ''}`}>
                      {page.url}
                    </p>
                    {viewMode === 'compare' && selectedForCompare.has(page.id) && page.screenshotUrl && (
                      <div className="mt-2 ml-6">
                        <img src={page.screenshotUrl} alt="preview"
                          className="w-full h-12 object-cover object-top rounded border border-[#334155] opacity-70" />
                      </div>
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* Compare Action */}
          {viewMode === 'compare' && (
            <div className="p-4 border-t border-[#1E293B]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-[#64748B]">
                  {selectedForCompare.size} selected
                </span>
                {selectedForCompare.size > 0 && (
                  <button
                    onClick={() => setSelectedForCompare(new Set())}
                    className="font-mono text-[10px] text-[#94A3B8] hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>
              <button
                onClick={runComparison}
                disabled={selectedForCompare.size < 2 || isComparing}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#22D3EE] text-[#0A0F1C] text-[13px] font-semibold disabled:opacity-40 hover:bg-[#22D3EE]/90 transition-colors"
              >
                {isComparing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-[#0A0F1C]/30 border-t-[#0A0F1C] rounded-full animate-spin" />
                    Comparing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                    Generate Comparison
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Main Panel */}
        <div className="flex-1 overflow-y-auto p-7 space-y-6">
          {viewMode === 'compare' ? (
            // Compare Mode
            comparisonResult ? (
              <CompetitorComparison comparison={comparisonResult} />
            ) : (
              <div className="flex-1 flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 rounded-2xl bg-[#1E293B] flex items-center justify-center mx-auto mb-5">
                    <svg className="w-8 h-8 text-[#22D3EE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Competitor Comparison</h3>
                  <p className="text-sm text-[#64748B] mb-6 leading-relaxed">
                    Select 2 or more analyzed landing pages from the sidebar to generate a competitive intelligence report.
                    The tool will compare messaging frameworks, page structures, and generate a recommended blueprint for your own page.
                  </p>
                  <div className="bg-[#1E293B] rounded-xl p-4 text-left space-y-3">
                    <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px]">WHAT YOU'LL GET</p>
                    <div className="space-y-2">
                      {[
                        'Framework scorecard with usage frequency & scores',
                        'Common patterns across competitors',
                        'Side-by-side structure comparison',
                        'Recommended page blueprint with fold-by-fold plan',
                        'Prioritized recommendations (must-have / should-have)',
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] mt-1.5 flex-shrink-0" />
                          <span className="text-[13px] text-[#94A3B8]">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {selectedForCompare.size > 0 && (
                    <div className="bg-[#1E293B] rounded-xl p-4 text-left space-y-2 mt-4">
                      <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px]">SELECTED FOR COMPARISON</p>
                      {Array.from(selectedForCompare).map(id => {
                        const page = landingPages.find(p => p.id === id)
                        return page ? (
                          <div key={id} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
                            <span className="text-[12px] text-[#94A3B8] truncate">{page.title || page.url}</span>
                          </div>
                        ) : null
                      })}
                    </div>
                  )}
                  {analyzedPages.length < 2 && (
                    <p className="text-xs text-[#F59E0B] mt-4">
                      You need at least 2 analyzed pages. Currently {analyzedPages.length} analyzed.
                    </p>
                  )}
                </div>
              </div>
            )
          ) : (
            // Analyze Mode
            selectedPage ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-white">{selectedPage.title || 'Untitled'}</h1>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-mono text-xs text-[#64748B]">{selectedPage.url}</span>
                      <span className="w-1 h-1 rounded-full bg-[#475569]" />
                      <span className="font-mono text-xs text-[#64748B]">Desktop · Full Page</span>
                      <span className="w-1 h-1 rounded-full bg-[#475569]" />
                      <span className="font-mono text-xs text-[#64748B]">
                        {selectedPage.capturedAt ? new Date(selectedPage.capturedAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={runAnalysis}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#22D3EE] text-[#0A0F1C] text-[13px] font-semibold hover:bg-[#22D3EE]/90 disabled:opacity-50 transition-colors"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-[#0A0F1C]/30 border-t-[#0A0F1C] rounded-full animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                        </svg>
                        {analysis ? 'Re-analyze' : 'Analyze'}
                      </>
                    )}
                  </button>
                </div>

                {analysis ? (
                  <FoldAnalysisDisplay
                    analysis={analysis}
                    screenshotUrl={selectedPage?.screenshotUrl}
                    landingPageId={selectedPage?.id}
                    onInsightSaved={() => toast.success('Insight saved!')}
                    avgBenchmark={avgConversionScore}
                  />
                ) : (
                  <div className="bg-[#1E293B] rounded-xl p-12 text-center">
                    <svg className="w-12 h-12 text-[#475569] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                    </svg>
                    <h3 className="text-lg font-medium text-white mb-2">No Analysis Yet</h3>
                    <p className="text-sm text-[#64748B] mb-6">Run semantic analysis to get detailed fold-by-fold insights</p>
                    <button onClick={runAnalysis} disabled={isAnalyzing} className="px-5 py-2.5 rounded-lg bg-[#22D3EE] text-[#0A0F1C] text-sm font-semibold disabled:opacity-50">
                      {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <svg className="w-12 h-12 text-[#1E293B] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                  </svg>
                  {landingPages.length === 0 ? (
                    <>
                      <h3 className="text-lg font-medium text-white mb-2">No Pages Captured Yet</h3>
                      <p className="text-sm text-[#64748B] mb-4">Capture a landing page first, then come back to analyze it.</p>
                      <a
                        href="/capture"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#22D3EE] text-[#0A0F1C] text-sm font-semibold hover:bg-[#22D3EE]/90 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Capture a Page
                      </a>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-medium text-white mb-2">Select a Landing Page</h3>
                      <p className="text-sm text-[#64748B]">Choose a page from the list to view or run analysis</p>
                    </>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
