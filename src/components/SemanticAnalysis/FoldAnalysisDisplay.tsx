'use client'

import React from 'react'
import type { SemanticAnalysis } from '@/types'

interface FoldAnalysisDisplayProps {
  analysis: SemanticAnalysis
  isLoading?: boolean
  screenshotUrl?: string
  landingPageId?: string
  onInsightSaved?: () => void
}

export default function FoldAnalysisDisplay({ analysis, isLoading, screenshotUrl, landingPageId, onInsightSaved }: FoldAnalysisDisplayProps) {
  const [expandedFolds, setExpandedFolds] = React.useState<Set<number>>(new Set([1, 2]))
  const [activeTab, setActiveTab] = React.useState<'flow' | 'insights' | 'folds' | 'frameworks'>('flow')
  const [showLegend, setShowLegend] = React.useState(false)
  const [imgDimensions, setImgDimensions] = React.useState<{ width: number; height: number } | null>(null)
  const [insightModal, setInsightModal] = React.useState<{
    text: string
    category: 'STEAL' | 'ADAPT' | 'AVOID'
  } | null>(null)
  const [savingInsight, setSavingInsight] = React.useState(false)

  // Load screenshot dimensions to calculate fold slices
  React.useEffect(() => {
    if (!screenshotUrl) return
    const img = new Image()
    img.onload = () => setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight })
    img.src = screenshotUrl
  }, [screenshotUrl])

  if (!analysis) {
    return (
      <div className="flex items-center justify-center p-8 text-[#475569]">
        <p>No analysis data available</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 gap-3">
        <div className="w-5 h-5 border-2 border-[#1E293B] border-t-[#22D3EE] rounded-full animate-spin" />
        <span className="text-[#94A3B8]">Loading analysis...</span>
      </div>
    )
  }

  const toggleFold = (foldNumber: number) => {
    const next = new Set(expandedFolds)
    next.has(foldNumber) ? next.delete(foldNumber) : next.add(foldNumber)
    setExpandedFolds(next)
  }

  const saveInsight = async () => {
    if (!insightModal || !landingPageId) return
    setSavingInsight(true)
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: insightModal.text.substring(0, 100),
          description: insightModal.text,
          category: insightModal.category,
          confidence: 4,
          landingPageId,
        }),
      })
      if (res.ok) {
        setInsightModal(null)
        onInsightSaved?.()
      }
    } catch (e) {
      console.error('Failed to save insight', e)
    } finally {
      setSavingInsight(false)
    }
  }

  const tabs = [
    { key: 'flow' as const, label: 'Overview' },
    { key: 'insights' as const, label: 'Insights' },
    { key: 'folds' as const, label: 'Fold Analysis' },
    { key: 'frameworks' as const, label: 'Framework' },
  ]

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22D3EE'
    if (score >= 60) return '#F59E0B'
    return '#EF4444'
  }

  return (
    <div>
      {(analysis.overallScores || analysis.pageFlow) && (
        <div className="bg-[#1E293B] rounded-xl p-5 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-0">
              {analysis.pageFlow?.primaryGoal && (
                <p className="text-sm font-medium text-white mb-1 leading-snug">{analysis.pageFlow.primaryGoal}</p>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                {analysis.messagingFrameworks?.primaryFramework && (
                  <span className="font-mono text-[10px] font-bold text-[#22D3EE] bg-[#22D3EE]/10 px-2 py-0.5 rounded">
                    {analysis.messagingFrameworks.primaryFramework}
                  </span>
                )}
                {analysis.messagingFrameworks?.secondaryFrameworks?.map((fw: string) => (
                  <span key={fw} className="font-mono text-[10px] text-[#64748B] bg-[#0F172A] px-2 py-0.5 rounded">{fw}</span>
                ))}
                {analysis.pageFlow?.totalFolds > 0 && (
                  <span className="font-mono text-[10px] text-[#64748B]">{analysis.pageFlow.totalFolds} folds detected</span>
                )}
              </div>
            </div>
            <div className="flex items-stretch gap-3">
              {analysis.overallScores?.conversionScore !== undefined && (() => {
                const score = analysis.overallScores.conversionScore
                const color = getScoreColor(score * 10)
                return (
                  <div className="text-center bg-[#0F172A] rounded-lg px-5 py-3">
                    <p className="font-mono text-[9px] font-semibold text-[#475569] tracking-[1.5px] mb-1">CONVERSION</p>
                    <p className="text-2xl font-bold" style={{ color }}>{score}<span className="text-sm text-[#475569]">/10</span></p>
                  </div>
                )
              })()}
              {analysis.overallScores?.valuePropositionClarity !== undefined && (() => {
                const score = analysis.overallScores.valuePropositionClarity
                const color = getScoreColor(score * 10)
                return (
                  <div className="text-center bg-[#0F172A] rounded-lg px-5 py-3">
                    <p className="font-mono text-[9px] font-semibold text-[#475569] tracking-[1.5px] mb-1">VALUE PROP</p>
                    <p className="text-2xl font-bold" style={{ color }}>{score}<span className="text-sm text-[#475569]">/10</span></p>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Tabs + Legend Toggle */}
      <div className="flex items-center justify-between border-b border-[#1E293B] mb-6">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 text-[13px] font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? 'text-[#22D3EE] border-[#22D3EE]'
                  : 'text-[#64748B] border-transparent hover:text-[#94A3B8]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowLegend(!showLegend)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors mb-1 ${
            showLegend ? 'bg-[#22D3EE]/10 text-[#22D3EE]' : 'text-[#64748B] hover:text-[#94A3B8] hover:bg-[#1E293B]'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
          </svg>
          Legend
        </button>
      </div>

      {/* Legend Panel */}
      {showLegend && (
        <div className="bg-[#1E293B] rounded-xl p-5 mb-6 space-y-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px]">ANALYSIS LEGEND</p>
            <button onClick={() => setShowLegend(false)} className="text-[#475569] hover:text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Scoring */}
            <div>
              <p className="font-mono text-[10px] font-semibold text-white tracking-[1px] mb-2">CONVERSION SCORES</p>
              <div className="space-y-1.5 text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#22D3EE]" />
                  <span className="text-[#94A3B8]"><span className="text-white font-medium">8-10</span> — Strong conversion potential</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#F59E0B]" />
                  <span className="text-[#94A3B8]"><span className="text-white font-medium">6-7</span> — Good, room to improve</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#EF4444]" />
                  <span className="text-[#94A3B8]"><span className="text-white font-medium">1-5</span> — Needs improvement</span>
                </div>
              </div>
              <p className="text-[10px] text-[#475569] mt-2 leading-relaxed">
                Scores are based on CTA presence, benefit language, social proof signals, and content specificity per fold.
              </p>
            </div>

            {/* Frameworks */}
            <div>
              <p className="font-mono text-[10px] font-semibold text-white tracking-[1px] mb-2">MESSAGING FRAMEWORKS</p>
              <div className="space-y-1.5 text-[12px]">
                <div className="flex items-start gap-2">
                  <span className="font-mono text-[#22D3EE] font-bold text-[10px] w-12 flex-shrink-0 mt-0.5">AIDA</span>
                  <span className="text-[#94A3B8]">Attention → Interest → Desire → Action</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-[#22D3EE] font-bold text-[10px] w-12 flex-shrink-0 mt-0.5">PAS</span>
                  <span className="text-[#94A3B8]">Problem → Agitation → Solution</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-[#22D3EE] font-bold text-[10px] w-12 flex-shrink-0 mt-0.5">FAB</span>
                  <span className="text-[#94A3B8]">Features → Advantages → Benefits</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-[#22D3EE] font-bold text-[10px] w-12 flex-shrink-0 mt-0.5">BAB</span>
                  <span className="text-[#94A3B8]">Before → After → Bridge</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-[#22D3EE] font-bold text-[10px] w-12 flex-shrink-0 mt-0.5">QUEST</span>
                  <span className="text-[#94A3B8]">Qualify → Understand → Educate → Stimulate → Transition</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-[#22D3EE] font-bold text-[10px] w-12 flex-shrink-0 mt-0.5">4Ps</span>
                  <span className="text-[#94A3B8]">Promise → Picture → Proof → Push</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-[#22D3EE] font-bold text-[10px] w-12 flex-shrink-0 mt-0.5">Story</span>
                  <span className="text-[#94A3B8]">StoryBrand — Hero → Problem → Guide → Plan → CTA</span>
                </div>
              </div>
            </div>

            {/* Insight Categories */}
            <div>
              <p className="font-mono text-[10px] font-semibold text-white tracking-[1px] mb-2">INSIGHT CATEGORIES</p>
              <div className="space-y-1.5 text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
                  <span className="text-[#94A3B8]"><span className="text-[#22D3EE] font-medium">Strengths</span> — What the page does well</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                  <span className="text-[#94A3B8]"><span className="text-[#F59E0B] font-medium">Improvements</span> — Areas to strengthen</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
                  <span className="text-[#94A3B8]"><span className="text-[#22D3EE] font-medium">CRO Tips</span> — Conversion optimization actions</span>
                </div>
              </div>

              <p className="font-mono text-[10px] font-semibold text-white tracking-[1px] mt-4 mb-2">FOLD ELEMENTS</p>
              <div className="space-y-1.5 text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
                  <span className="text-[#94A3B8]">Detected page elements (CTAs, forms, images)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                  <span className="text-[#94A3B8]">Missing or weak elements</span>
                </div>
              </div>

              <p className="font-mono text-[10px] font-semibold text-white tracking-[1px] mt-4 mb-2">VERDICT BADGES</p>
              <div className="space-y-1.5 text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[#22D3EE] bg-[#22D3EE]/10 px-1.5 py-0.5 rounded">dominant</span>
                  <span className="text-[#94A3B8]">Used by 70%+ of pages</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.5 rounded">common</span>
                  <span className="text-[#94A3B8]">Used by 30-70% of pages</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[#64748B] bg-[#64748B]/10 px-1.5 py-0.5 rounded">rare</span>
                  <span className="text-[#94A3B8]">Used by &lt;30% of pages</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fold Analysis Tab */}
      {activeTab === 'folds' && (
        <div className="space-y-4">
          {analysis.foldAnalysis && Array.isArray(analysis.foldAnalysis) ? (() => {
            const totalFolds = analysis.foldAnalysis.length
            return analysis.foldAnalysis.map((fold, index) => {
            const foldNum = fold?.foldNumber || index + 1
            const isExpanded = expandedFolds.has(foldNum)
            const conversionScore = fold?.scores?.conversionPotential
              ? fold.scores.conversionPotential * 10
              : fold?.conversionPoints?.length
                ? Math.min(fold.conversionPoints.length * 20, 100)
                : 0
            const scoreColor = getScoreColor(conversionScore)

            return (
              <div key={foldNum} className="bg-[#1E293B] rounded-xl overflow-hidden">
                {/* Fold Header */}
                <button
                  onClick={() => toggleFold(foldNum)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-[#0F172A] hover:bg-[#0F172A]/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center font-mono text-[13px] font-bold ${
                      isExpanded ? 'bg-[#22D3EE] text-[#0A0F1C]' : 'bg-[#1E293B] text-white border border-[#475569]'
                    }`}>
                      {foldNum}
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-semibold text-white">{fold?.title || `Fold ${foldNum}`}</h4>
                      <p className="font-mono text-[11px] text-[#64748B]">
                        {fold?.pixelRange || `${(foldNum - 1) * 900}px — ${foldNum * 900}px`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#64748B]">Conversion Score</span>
                    <div className="w-20 h-1.5 rounded-full bg-[#0A0F1C]">
                      <div className="h-1.5 rounded-full" style={{ width: `${Math.min(conversionScore, 100)}%`, backgroundColor: scoreColor }} />
                    </div>
                    <span className="font-mono text-xs font-bold" style={{ color: scoreColor }}>
                      {conversionScore}%
                    </span>
                    <svg className={`w-4 h-4 text-[#64748B] transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-5 space-y-4">
                    {/* Fold preview disabled — equal-height division produces inaccurate crops.
                        Re-enable when real pixel ranges are available from DOM-based fold detection. */}

                    {fold?.scores && (
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                          { label: 'CLARITY', value: fold.scores.clarity },
                          { label: 'PERSUASION', value: fold.scores.persuasion },
                          { label: 'CONVERSION', value: fold.scores.conversionPotential },
                        ].map(({ label, value }) => {
                          const color = value >= 8 ? '#22D3EE' : value >= 6 ? '#F59E0B' : '#EF4444'
                          return (
                            <div key={label} className="bg-[#0F172A] rounded-lg p-3">
                              <p className="font-mono text-[9px] font-semibold text-[#64748B] tracking-[1.5px] mb-2">{label}</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-[#1E293B]">
                                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${value * 10}%`, backgroundColor: color }} />
                                </div>
                                <span className="font-mono text-xs font-bold" style={{ color }}>{value}/10</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Analysis + Elements row */}
                    <div className="flex gap-5">
                      {/* Analysis */}
                      <div className="flex-1 space-y-3">
                        <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px]">ANALYSIS</p>
                        <p className="text-[13px] text-[#94A3B8] leading-relaxed">
                          {fold?.description || fold?.purpose || 'No analysis available'}
                        </p>
                        {fold?.contentStrategy && (
                          <p className="text-[13px] text-[#94A3B8] leading-relaxed">{fold.contentStrategy}</p>
                        )}
                      </div>
                      {/* Elements */}
                      <div className="w-[220px] flex-shrink-0 space-y-2.5">
                        <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px]">ELEMENTS DETECTED</p>
                        {fold?.elements && Array.isArray(fold.elements) ? fold.elements.map((el, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
                            <span className="text-xs text-[#94A3B8]">{el}</span>
                          </div>
                        )) : (
                          <p className="text-xs text-[#475569]">No elements data</p>
                        )}
                        {fold?.conversionPoints && Array.isArray(fold.conversionPoints) && fold.conversionPoints.length > 0 && (
                          <>
                            {fold.conversionPoints.map((pt, i) => (
                              <div key={`cp-${i}`} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
                                <span className="text-xs text-[#94A3B8]">{pt}</span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })})() : (
            <div className="text-center text-[#475569] py-8">No fold analysis data available</div>
          )}
        </div>
      )}

      {/* Page Flow Tab */}
      {activeTab === 'flow' && (
        <div className="space-y-6">
          {/* Primary Goal */}
          <div className="bg-[#1E293B] rounded-xl p-5">
            <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px] mb-2">PRIMARY GOAL</p>
            <p className="text-white font-medium">{analysis.pageFlow?.primaryGoal || 'No primary goal identified'}</p>
          </div>

          {/* User Journey */}
          <div className="bg-[#1E293B] rounded-xl p-5">
            <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px] mb-4">USER JOURNEY</p>
            <div className="space-y-3">
              {analysis.pageFlow?.userJourney && Array.isArray(analysis.pageFlow.userJourney) ? analysis.pageFlow.userJourney.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md bg-[#0F172A] flex items-center justify-center font-mono text-[11px] font-bold text-[#22D3EE]">
                    {i + 1}
                  </div>
                  <span className="text-sm text-[#94A3B8]">{step}</span>
                </div>
              )) : (
                <p className="text-sm text-[#475569]">No user journey data</p>
              )}
            </div>
          </div>

          {analysis.pageFlow?.conversionFunnel && Array.isArray(analysis.pageFlow.conversionFunnel) && analysis.pageFlow.conversionFunnel.length > 0 && (
            <div className="bg-[#1E293B] rounded-xl p-5">
              <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px] mb-4">CONVERSION FUNNEL</p>
              <div className="flex items-stretch gap-0">
                {analysis.pageFlow.conversionFunnel.map((step: string, i: number) => {
                  const colors = ['#22D3EE', '#38BDF8', '#60A5FA', '#818CF8']
                  const color = colors[i % colors.length]
                  return (
                    <div key={i} className="flex-1 relative">
                      <div className="rounded-lg p-3 mr-1" style={{ backgroundColor: `${color}15`, borderLeft: `2px solid ${color}` }}>
                        <p className="font-mono text-[9px] font-bold mb-1" style={{ color }}>{i + 1}</p>
                        <p className="text-xs text-[#94A3B8] leading-relaxed">{step}</p>
                      </div>
                      {i < analysis.pageFlow.conversionFunnel.length - 1 && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
                          <svg className="w-3 h-3 text-[#334155]" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="bg-[#1E293B] rounded-xl p-5">
            <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px] mb-2">PAGE STRUCTURE</p>
            <p className="text-sm text-[#94A3B8]">
              This page contains <span className="font-bold text-white">{analysis.pageFlow?.totalFolds || 0} distinct visual folds</span>, each designed to guide users through the conversion journey.
            </p>
          </div>

          {analysis.overallScores && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1E293B] rounded-xl p-5">
                  <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px] mb-3">CONVERSION SCORE</p>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-bold" style={{ color: getScoreColor((analysis.overallScores.conversionScore || 0) * 10) }}>
                      {analysis.overallScores.conversionScore}
                    </span>
                    <span className="text-[#475569] text-lg mb-1">/10</span>
                  </div>
                  {analysis.overallScores.conversionJustification && (
                    <p className="text-xs text-[#64748B] leading-relaxed">{analysis.overallScores.conversionJustification}</p>
                  )}
                </div>
                <div className="bg-[#1E293B] rounded-xl p-5">
                  <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px] mb-3">VALUE PROP CLARITY</p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold" style={{ color: getScoreColor((analysis.overallScores.valuePropositionClarity || 0) * 10) }}>
                      {analysis.overallScores.valuePropositionClarity}
                    </span>
                    <span className="text-[#475569] text-lg mb-1">/10</span>
                  </div>
                </div>
              </div>

              {analysis.overallScores.ctaEffectiveness && (
                <div className="bg-[#1E293B] rounded-xl p-5">
                  <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px] mb-4">CTA EFFECTIVENESS</p>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(analysis.overallScores.ctaEffectiveness).map(([key, value]) => (
                      <div key={key} className="bg-[#0F172A] rounded-lg p-3">
                        <p className="font-mono text-[9px] font-semibold text-[#475569] tracking-[1px] mb-1 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-xs text-[#94A3B8]">{value as string}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-5">
          {analysis.persuasionInventory && (
            <div className="bg-[#1E293B] rounded-xl p-5">
              <p className="font-mono text-[10px] font-semibold text-[#22D3EE] tracking-[2px] mb-4">PERSUASION ARSENAL</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'trustSignals', label: 'TRUST SIGNALS', color: '#22D3EE' },
                  { key: 'socialProof', label: 'SOCIAL PROOF', color: '#818CF8' },
                  { key: 'urgencyTriggers', label: 'URGENCY TRIGGERS', color: '#F59E0B' },
                  { key: 'emotionalTriggers', label: 'EMOTIONAL TRIGGERS', color: '#F472B6' },
                ].map(({ key, label, color }) => {
                  const items = (analysis.persuasionInventory as any)[key] as string[]
                  if (!items || items.length === 0) return null
                  return (
                    <div key={key}>
                      <p className="font-mono text-[9px] font-semibold tracking-[1.5px] mb-2" style={{ color }}>{label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {items.map((item: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded text-[11px] text-[#94A3B8]"
                            style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Strengths */}
          <div className="bg-[#1E293B] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
              <p className="font-mono text-[10px] font-semibold text-[#22D3EE] tracking-[2px]">STRENGTHS</p>
            </div>
            <ul className="space-y-2">
              {analysis.insights?.strengths && Array.isArray(analysis.insights.strengths) ? analysis.insights.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 group">
                  <span className="text-[#22D3EE] mt-0.5">•</span>
                  <span className="text-[13px] text-[#94A3B8] flex-1">{s}</span>
                  {landingPageId && (
                    <button
                      onClick={() => setInsightModal({ text: s, category: 'STEAL' })}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5 p-1 rounded hover:bg-[#22D3EE]/10 text-[#475569] hover:text-[#22D3EE]"
                      title="Save as Insight"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  )}
                </li>
              )) : <li className="text-[13px] text-[#475569]">No strengths data</li>}
            </ul>
          </div>

          {/* Improvements */}
          <div className="bg-[#1E293B] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
              <p className="font-mono text-[10px] font-semibold text-[#F59E0B] tracking-[2px]">IMPROVEMENTS</p>
            </div>
            <ul className="space-y-2">
              {analysis.insights?.improvements && Array.isArray(analysis.insights.improvements) ? analysis.insights.improvements.map((s, i) => (
                <li key={i} className="flex items-start gap-2 group">
                  <span className="text-[#F59E0B] mt-0.5">•</span>
                  <span className="text-[13px] text-[#94A3B8] flex-1">{s}</span>
                  {landingPageId && (
                    <button
                      onClick={() => setInsightModal({ text: s, category: 'ADAPT' })}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5 p-1 rounded hover:bg-[#22D3EE]/10 text-[#475569] hover:text-[#22D3EE]"
                      title="Save as Insight"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  )}
                </li>
              )) : <li className="text-[13px] text-[#475569]">No improvements data</li>}
            </ul>
          </div>

          {/* Conversion Optimization */}
          <div className="bg-[#1E293B] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
              <p className="font-mono text-[10px] font-semibold text-[#22D3EE] tracking-[2px]">CONVERSION OPTIMIZATION</p>
            </div>
            <ul className="space-y-2">
              {analysis.insights?.conversionOptimization && Array.isArray(analysis.insights.conversionOptimization) ? analysis.insights.conversionOptimization.map((s, i) => (
                <li key={i} className="flex items-start gap-2 group">
                  <span className="text-[#22D3EE] mt-0.5">•</span>
                  <span className="text-[13px] text-[#94A3B8] flex-1">{s}</span>
                  {landingPageId && (
                    <button
                      onClick={() => setInsightModal({ text: s, category: 'STEAL' })}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5 p-1 rounded hover:bg-[#22D3EE]/10 text-[#475569] hover:text-[#22D3EE]"
                      title="Save as Insight"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  )}
                </li>
              )) : <li className="text-[13px] text-[#475569]">No conversion data</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Messaging Frameworks Tab */}
      {activeTab === 'frameworks' && (
        <div className="space-y-5">
          {/* Primary Framework */}
          <div className="bg-[#1E293B] rounded-xl p-5">
            <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px] mb-2">PRIMARY FRAMEWORK</p>
            <p className="text-lg font-semibold text-white">{analysis.messagingFrameworks?.primaryFramework || 'None identified'}</p>
          </div>

          {/* Framework Mapping Table */}
          {analysis.messagingFrameworks?.frameworkMapping && analysis.messagingFrameworks.frameworkMapping.length > 0 && (
            <div className="bg-[#1E293B] rounded-xl overflow-hidden">
              <div className="px-5 pt-5 pb-3">
                <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px]">FRAMEWORK MAPPING</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#0F172A]">
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold text-[#64748B] tracking-[1px]">SECTION</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold text-[#64748B] tracking-[1px]">FRAMEWORK</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold text-[#64748B] tracking-[1px]">ELEMENTS</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold text-[#64748B] tracking-[1px]">NOTES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.messagingFrameworks.frameworkMapping.map((mapping, i) => (
                      <tr key={i} className="border-b border-[#0F172A] last:border-0">
                        <td className="px-5 py-3 text-sm font-medium text-white">{mapping.section}</td>
                        <td className="px-5 py-3">
                          <span className="font-mono text-[10px] font-bold text-[#22D3EE] bg-[#22D3EE]/10 px-2 py-0.5 rounded">{mapping.framework}</span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="space-y-1">
                            {Object.entries(mapping.elements).map(([key, value]) =>
                              value ? (
                                <div key={key} className="text-xs">
                                  <span className="text-[#64748B] capitalize">{key}: </span>
                                  <span className="text-[#94A3B8]">{value as string}</span>
                                </div>
                              ) : null
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-[#94A3B8]">{mapping.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Missing Elements */}
          {analysis.messagingFrameworks?.missingElements && analysis.messagingFrameworks.missingElements.length > 0 && (
            <div className="bg-[#1E293B] rounded-xl p-5">
              <p className="font-mono text-[10px] font-semibold text-[#F59E0B] tracking-[2px] mb-3">MISSING ELEMENTS</p>
              <div className="space-y-3">
                {analysis.messagingFrameworks.missingElements.map((el, i) => (
                  <div key={i} className="bg-[#0F172A] rounded-lg p-3">
                    <p className="text-sm font-medium text-white mb-1">{el.issue}</p>
                    <p className="text-xs text-[#94A3B8]"><span className="text-[#F59E0B]">Impact:</span> {el.impact}</p>
                    <p className="text-xs text-[#94A3B8]"><span className="text-[#22D3EE]">Fix:</span> {el.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversion Scores */}
          {analysis.messagingFrameworks?.conversionScores && analysis.messagingFrameworks.conversionScores.length > 0 && (
            <div className="bg-[#1E293B] rounded-xl overflow-hidden">
              <div className="px-5 pt-5 pb-3">
                <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px]">CONVERSION POTENTIAL PER FOLD</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#0F172A]">
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold text-[#64748B] tracking-[1px]">FOLD</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold text-[#64748B] tracking-[1px]">FRAMEWORK</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold text-[#64748B] tracking-[1px]">SCORE</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold text-[#64748B] tracking-[1px]">NOTES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.messagingFrameworks.conversionScores.map((score, i) => {
                      const pct = (score.score / 10) * 100
                      const color = score.score >= 8 ? '#22D3EE' : score.score >= 6 ? '#F59E0B' : '#EF4444'
                      return (
                        <tr key={i} className="border-b border-[#0F172A] last:border-0">
                          <td className="px-5 py-3 text-sm font-medium text-white">{score.fold}</td>
                          <td className="px-5 py-3">
                            <span className="font-mono text-[10px] text-[#94A3B8] bg-[#0F172A] px-2 py-0.5 rounded">{score.framework}</span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 rounded-full bg-[#0A0F1C]">
                                <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                              </div>
                              <span className="font-mono text-xs font-bold" style={{ color }}>{score.score}/10</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-xs text-[#94A3B8]">{score.notes}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Framework Analysis */}
          {analysis.messagingFrameworks?.frameworkAnalysis && (
            <div className="bg-[#1E293B] rounded-xl p-5">
              <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px] mb-2">OVERALL ANALYSIS</p>
              <p className="text-[13px] text-[#94A3B8] leading-relaxed">{analysis.messagingFrameworks.frameworkAnalysis}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#1E293B] font-mono text-[11px] text-[#475569]">
        <span>Analyzed {analysis.metadata?.analysisDate ? new Date(analysis.metadata.analysisDate).toLocaleDateString() : ''}</span>
        <span>{((analysis.metadata?.processingTime || 0) / 1000).toFixed(2)}s processing</span>
      </div>

      {insightModal && (
        <div className="fixed inset-0 bg-[#0A0F1C]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E293B] rounded-2xl p-6 w-full max-w-md border border-[#334155]">
            <h3 className="text-white font-semibold mb-4">Save as Insight</h3>
            <p className="text-sm text-[#94A3B8] mb-4 bg-[#0F172A] rounded-lg p-3">{insightModal.text}</p>
            <div className="mb-4">
              <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[1.5px] mb-2">CATEGORY</p>
              <div className="flex gap-2">
                {(['STEAL', 'ADAPT', 'AVOID'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setInsightModal({ ...insightModal, category: cat })}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      insightModal.category === cat
                        ? cat === 'STEAL' ? 'bg-[#22D3EE] text-[#0A0F1C]'
                          : cat === 'ADAPT' ? 'bg-[#F59E0B] text-[#0A0F1C]'
                          : 'bg-[#EF4444] text-white'
                        : 'bg-[#0F172A] text-[#64748B] hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setInsightModal(null)} className="flex-1 py-2.5 rounded-lg bg-[#0F172A] text-sm text-[#64748B] hover:text-white">
                Cancel
              </button>
              <button onClick={saveInsight} disabled={savingInsight} className="flex-1 py-2.5 rounded-lg bg-[#22D3EE] text-[#0A0F1C] text-sm font-semibold disabled:opacity-50">
                {savingInsight ? 'Saving...' : 'Save Insight'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
