'use client'

import React from 'react'

interface CompetitorComparisonProps {
  comparison: any
}

// Inline SVG icons
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8.5L6.5 12L13 4" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4L12 12M12 4L4 12" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ChartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="8" width="3" height="6" rx="0.5" fill="currentColor" />
    <rect x="6.5" y="5" width="3" height="9" rx="0.5" fill="currentColor" />
    <rect x="11" y="2" width="3" height="12" rx="0.5" fill="currentColor" />
  </svg>
)

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M1.5 14c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="11" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M11 9.5c2 0 3.5 1.5 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const LayersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1.5L1.5 5.5L8 9.5L14.5 5.5L8 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M1.5 8.5L8 12.5L14.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M1.5 11.5L8 15.5L14.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1L10 6H15L11 9.5L12.5 15L8 11.5L3.5 15L5 9.5L1 6H6L8 1Z" fill="currentColor" />
  </svg>
)

const BlueprintIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2 7H18M7 2V18" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12.5" cy="12.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

// Helper: score color
function getScoreColor(score: number): string {
  if (score >= 8) return '#22D3EE'
  if (score >= 6) return '#F59E0B'
  return '#EF4444'
}

// Helper: verdict badge color
function getVerdictColor(verdict: string): { bg: string; text: string } {
  const v = (verdict || '').toLowerCase()
  if (v === 'dominant') return { bg: 'rgba(34,211,238,0.15)', text: '#22D3EE' }
  if (v === 'common') return { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' }
  return { bg: 'rgba(100,116,139,0.15)', text: '#64748B' }
}

// Helper: importance badge color
function getImportanceColor(importance: string): { bg: string; text: string } {
  const i = (importance || '').toLowerCase()
  if (i === 'high') return { bg: 'rgba(34,211,238,0.15)', text: '#22D3EE' }
  if (i === 'medium') return { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' }
  return { bg: 'rgba(100,116,139,0.15)', text: '#64748B' }
}

// Helper: priority badge color
function getPriorityColor(priority: string): { bg: string; text: string } {
  const p = (priority || '').toLowerCase().replace(/[-_]/g, '')
  if (p.includes('musthave') || p === 'high') return { bg: 'rgba(34,211,238,0.15)', text: '#22D3EE' }
  if (p.includes('shouldhave') || p === 'medium') return { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' }
  return { bg: 'rgba(100,116,139,0.15)', text: '#64748B' }
}

// Competitor name badge
function CompetitorBadge({ name }: { name: string }) {
  return (
    <span
      className="font-mono text-[11px] px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(34,211,238,0.1)', color: '#22D3EE' }}
    >
      {name}
    </span>
  )
}

export default function CompetitorComparison({ comparison }: CompetitorComparisonProps) {
  if (!comparison) {
    return (
      <div className="flex items-center justify-center p-8 text-[#475569]">
        <p>No comparison data available</p>
      </div>
    )
  }

  const summary = comparison.summary || comparison
  const frameworks = comparison.frameworks || comparison.frameworkScorecard || []
  const commonPatterns = comparison.commonPatterns || comparison.patterns || []
  const structures = comparison.structures || comparison.structureComparison || comparison.competitors || []
  const blueprint = comparison.blueprint || comparison.recommendedPage || comparison.recommendation || {}
  const recommendations = comparison.recommendations || []

  const pagesCompared = summary.pagesCompared ?? structures.length ?? 0
  const competitorNames: string[] = summary.competitors
    || structures.map((s: any) => s.name || s.competitor || s.competitorName)
    || []
  const dominantFramework = summary.dominantFramework || blueprint.framework || {}
  const recommendedFolds = summary.recommendedFolds ?? blueprint.folds?.length ?? 0

  return (
    <div className="space-y-6" style={{ background: '#0A0F1C' }}>
      {/* ── Section 1: Summary Bar ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pages compared */}
        <div className="rounded-xl p-4" style={{ background: '#1E293B' }}>
          <div className="flex items-center gap-2 mb-2 text-[#64748B]">
            <ChartIcon />
            <span className="font-mono text-[11px] uppercase tracking-wider">Pages Compared</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">{pagesCompared}</p>
        </div>

        {/* Competitors */}
        <div className="rounded-xl p-4" style={{ background: '#1E293B' }}>
          <div className="flex items-center gap-2 mb-2 text-[#64748B]">
            <UsersIcon />
            <span className="font-mono text-[11px] uppercase tracking-wider">Competitors</span>
          </div>
          <p className="text-sm text-white font-mono leading-relaxed">
            {Array.isArray(competitorNames) ? competitorNames.join(', ') : competitorNames}
          </p>
        </div>

        {/* Dominant framework */}
        <div className="rounded-xl p-4" style={{ background: '#1E293B' }}>
          <div className="flex items-center gap-2 mb-2 text-[#64748B]">
            <StarIcon />
            <span className="font-mono text-[11px] uppercase tracking-wider">Dominant Framework</span>
          </div>
          <p className="text-lg font-bold text-[#22D3EE] font-mono">
            {typeof dominantFramework === 'string' ? dominantFramework : dominantFramework.name || 'N/A'}
          </p>
          {dominantFramework.score != null && (
            <span className="font-mono text-[11px] text-[#94A3B8]">Score: {dominantFramework.score}</span>
          )}
        </div>

        {/* Recommended folds */}
        <div className="rounded-xl p-4" style={{ background: '#1E293B' }}>
          <div className="flex items-center gap-2 mb-2 text-[#64748B]">
            <LayersIcon />
            <span className="font-mono text-[11px] uppercase tracking-wider">Recommended Folds</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">{recommendedFolds}</p>
        </div>
      </div>

      {/* ── Section 2: Framework Scorecard ── */}
      {frameworks.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ background: '#1E293B' }}>
          <div className="px-5 py-4 border-b border-[#0F172A]">
            <h3 className="text-[13px] font-semibold text-white uppercase tracking-wider font-mono">
              Framework Scorecard
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] font-mono uppercase text-[#64748B] tracking-wider" style={{ background: '#0F172A' }}>
                  <th className="px-5 py-3">Framework</th>
                  <th className="px-5 py-3">Used By</th>
                  <th className="px-5 py-3">Frequency</th>
                  <th className="px-5 py-3">Avg Score</th>
                  <th className="px-5 py-3">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {frameworks.map((fw: any, i: number) => {
                  const score = fw.avgScore ?? fw.score ?? 0
                  const scoreColor = getScoreColor(score)
                  const frequency = fw.frequency ?? fw.count ?? 0
                  const maxFreq = Math.max(...frameworks.map((f: any) => f.frequency ?? f.count ?? 1))
                  const freqPct = maxFreq > 0 ? (frequency / maxFreq) * 100 : 0
                  const verdict = fw.verdict || (freqPct > 75 ? 'dominant' : freqPct > 40 ? 'common' : 'rare')
                  const verdictColor = getVerdictColor(verdict)
                  const usedBy: string[] = fw.usedBy || fw.competitors || []

                  return (
                    <tr
                      key={i}
                      className="border-t border-[#0F172A] hover:bg-[#0F172A]/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <span className="font-mono text-sm text-white font-medium">{fw.name || fw.framework}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {usedBy.map((name: string, j: number) => (
                            <CompetitorBadge key={j} name={name} />
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full" style={{ background: '#0F172A' }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${freqPct}%`, background: '#22D3EE' }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-[#94A3B8]">{frequency}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full" style={{ background: '#0F172A' }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${(score / 10) * 100}%`, background: scoreColor }}
                            />
                          </div>
                          <span className="font-mono text-sm font-medium" style={{ color: scoreColor }}>
                            {score.toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="font-mono text-[11px] px-2.5 py-1 rounded-full capitalize"
                          style={{ background: verdictColor.bg, color: verdictColor.text }}
                        >
                          {verdict}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Section 3: Common Patterns ── */}
      {commonPatterns.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[13px] font-semibold text-white uppercase tracking-wider font-mono px-1">
            Common Patterns
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commonPatterns.map((pattern: any, i: number) => {
              const importance = pattern.importance || pattern.level || 'low'
              const impColor = getImportanceColor(importance)
              const foundIn: string[] = pattern.foundIn || pattern.competitors || []

              return (
                <div key={i} className="rounded-xl p-4" style={{ background: '#1E293B' }}>
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm text-white leading-relaxed flex-1 mr-3">
                      {pattern.description || pattern.pattern || pattern.name}
                    </p>
                    <span
                      className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap"
                      style={{ background: impColor.bg, color: impColor.text }}
                    >
                      {importance}
                    </span>
                  </div>
                  {foundIn.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] text-[#64748B] uppercase tracking-wider">Found in:</span>
                      {foundIn.map((name: string, j: number) => (
                        <CompetitorBadge key={j} name={name} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Section 4: Structure Comparison ── */}
      {structures.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[13px] font-semibold text-white uppercase tracking-wider font-mono px-1">
            Structure Comparison
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {structures.map((comp: any, i: number) => {
              const name = comp.name || comp.competitor || comp.competitorName || `Competitor ${i + 1}`
              const pageTitle = comp.pageTitle || comp.title || ''
              const totalFolds = comp.totalFolds ?? comp.folds?.length ?? comp.foldCount ?? 0
              const framework = comp.primaryFramework || comp.framework || ''
              const goal = comp.primaryGoal || comp.goal || ''
              const strengths: string[] = comp.strengths || []
              const weaknesses: string[] = comp.weaknesses || []

              return (
                <div key={i} className="rounded-xl overflow-hidden" style={{ background: '#1E293B' }}>
                  <div className="px-5 py-4 border-b border-[#0F172A] flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{name}</h4>
                      {pageTitle && (
                        <p className="text-[11px] text-[#64748B] font-mono mt-0.5">{pageTitle}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] text-[#94A3B8]">
                        {totalFolds} fold{totalFolds !== 1 ? 's' : ''}
                      </span>
                      {framework && (
                        <span
                          className="font-mono text-[11px] px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(34,211,238,0.15)', color: '#22D3EE' }}
                        >
                          {typeof framework === 'string' ? framework : framework.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    {goal && (
                      <div>
                        <span className="font-mono text-[10px] text-[#64748B] uppercase tracking-wider">Primary Goal</span>
                        <p className="text-sm text-[#94A3B8] mt-1">{goal}</p>
                      </div>
                    )}
                    {strengths.length > 0 && (
                      <div>
                        <span className="font-mono text-[10px] text-[#64748B] uppercase tracking-wider">Strengths</span>
                        <ul className="mt-1.5 space-y-1">
                          {strengths.map((s: string, j: number) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-[#94A3B8]">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#22D3EE' }} />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {weaknesses.length > 0 && (
                      <div>
                        <span className="font-mono text-[10px] text-[#64748B] uppercase tracking-wider">Weaknesses</span>
                        <ul className="mt-1.5 space-y-1">
                          {weaknesses.map((w: string, j: number) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-[#94A3B8]">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#F59E0B' }} />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Section 5: Blueprint — Your Recommended Page ── */}
      {blueprint && (blueprint.framework || blueprint.folds || blueprint.mustHave || blueprint.avoid) && (
        <div className="rounded-xl overflow-hidden" style={{ background: '#1E293B', border: '1px solid rgba(34,211,238,0.2)' }}>
          <div className="px-5 py-4 flex items-center gap-3" style={{ background: 'rgba(34,211,238,0.05)', borderBottom: '1px solid rgba(34,211,238,0.1)' }}>
            <span className="text-[#22D3EE]"><BlueprintIcon /></span>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Your Recommended Page
            </h3>
          </div>

          <div className="p-5 space-y-6">
            {/* Recommended Framework */}
            {blueprint.framework && (
              <div className="text-center py-4 rounded-xl" style={{ background: '#0F172A' }}>
                <span className="font-mono text-[10px] text-[#64748B] uppercase tracking-wider block mb-2">
                  Recommended Framework
                </span>
                <p className="text-2xl font-bold text-[#22D3EE] font-mono">
                  {typeof blueprint.framework === 'string' ? blueprint.framework : blueprint.framework.name}
                </p>
                {blueprint.framework.description && (
                  <p className="text-[13px] text-[#94A3B8] mt-2 max-w-lg mx-auto">
                    {blueprint.framework.description}
                  </p>
                )}
              </div>
            )}

            {/* Fold-by-fold blueprint */}
            {blueprint.folds && blueprint.folds.length > 0 && (
              <div>
                <h4 className="font-mono text-[11px] text-[#64748B] uppercase tracking-wider mb-3">
                  Fold-by-Fold Blueprint
                </h4>
                <div className="space-y-3">
                  {blueprint.folds.map((fold: any, i: number) => (
                    <div
                      key={i}
                      className="rounded-lg p-4 flex gap-4"
                      style={{ background: '#0F172A' }}
                    >
                      {/* Fold number */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-mono text-sm font-bold"
                        style={{ background: 'rgba(34,211,238,0.15)', color: '#22D3EE' }}
                      >
                        {fold.number ?? i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-white">
                            {fold.purpose || fold.name || fold.title || `Fold ${i + 1}`}
                          </span>
                          {(fold.framework || fold.pattern) && (
                            <span
                              className="font-mono text-[10px] px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(34,211,238,0.1)', color: '#22D3EE' }}
                            >
                              {fold.framework || fold.pattern}
                            </span>
                          )}
                        </div>
                        {fold.elements && fold.elements.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {fold.elements.map((el: string, j: number) => (
                              <span
                                key={j}
                                className="font-mono text-[10px] px-2 py-0.5 rounded"
                                style={{ background: 'rgba(148,163,184,0.1)', color: '#94A3B8' }}
                              >
                                {el}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Must-have and Avoid side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Must-have elements */}
              {blueprint.mustHave && blueprint.mustHave.length > 0 && (
                <div className="rounded-lg p-4" style={{ background: '#0F172A' }}>
                  <h4 className="font-mono text-[11px] text-[#22D3EE] uppercase tracking-wider mb-3">
                    Must-Have Elements
                  </h4>
                  <ul className="space-y-2">
                    {blueprint.mustHave.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#94A3B8]">
                        <span className="flex-shrink-0 mt-0.5"><CheckIcon /></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Avoid elements */}
              {blueprint.avoid && blueprint.avoid.length > 0 && (
                <div className="rounded-lg p-4" style={{ background: '#0F172A' }}>
                  <h4 className="font-mono text-[11px] text-[#EF4444] uppercase tracking-wider mb-3">
                    Avoid
                  </h4>
                  <ul className="space-y-2">
                    {blueprint.avoid.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#94A3B8]">
                        <span className="flex-shrink-0 mt-0.5"><XIcon /></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Section 6: Recommendations ── */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[13px] font-semibold text-white uppercase tracking-wider font-mono px-1">
            Recommendations
          </h3>
          <div className="space-y-3">
            {[...recommendations]
              .sort((a: any, b: any) => {
                const order: Record<string, number> = { 'must-have': 0, musthave: 0, high: 0, 'should-have': 1, shouldhave: 1, medium: 1, 'nice-to-have': 2, nicetohave: 2, low: 2 }
                const aP = order[(a.priority || '').toLowerCase().replace(/[-_]/g, '')] ?? 3
                const bP = order[(b.priority || '').toLowerCase().replace(/[-_]/g, '')] ?? 3
                return aP - bP
              })
              .map((rec: any, i: number) => {
                const priority = rec.priority || 'nice-to-have'
                const prColor = getPriorityColor(priority)
                const basedOn: string[] = rec.basedOn || rec.competitors || []

                return (
                  <div key={i} className="rounded-xl p-4" style={{ background: '#1E293B' }}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-semibold text-white flex-1 mr-3">
                        {rec.title || rec.name}
                      </h4>
                      <span
                        className="font-mono text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap"
                        style={{ background: prColor.bg, color: prColor.text }}
                      >
                        {priority}
                      </span>
                    </div>
                    {rec.description && (
                      <p className="text-[13px] text-[#94A3B8] leading-relaxed mb-3">
                        {rec.description}
                      </p>
                    )}
                    {basedOn.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] text-[#64748B] uppercase tracking-wider">Based on:</span>
                        {basedOn.map((name: string, j: number) => (
                          <CompetitorBadge key={j} name={name} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
