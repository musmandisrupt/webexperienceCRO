'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import { safeFormatDate } from '@/lib/dateUtils'
import type { LandingPage, SemanticAnalysis } from '@/types'

interface LandingPageDetail extends LandingPage {
  competitor?: { id: string; name: string; website: string; industry?: string }
  insights?: Array<{ id: string; title: string; category: string }>
}

export default function LandingPageDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [landingPage, setLandingPage] = useState<LandingPageDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/landing-pages/${id}`)
        const data = await res.json()
        if (data.success) {
          setLandingPage(data.landingPage)
        } else {
          setError(data.error || 'Failed to load landing page')
        }
      } catch {
        setError('Failed to load landing page')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22D3EE]" />
        </div>
      </DashboardLayout>
    )
  }

  if (error || !landingPage) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-[#94A3B8] mb-4">{error || 'Landing page not found'}</p>
          <Link href="/landing-pages" className="text-[#22D3EE] hover:underline text-sm">
            Back to Landing Pages
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const analysis = landingPage.semanticAnalysis as SemanticAnalysis | undefined

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/landing-pages"
            className="inline-flex items-center gap-2 text-sm text-[#94A3B8] hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back to Landing Pages
          </Link>
          <div className="flex gap-3">
            <Link
              href={`/capture?url=${encodeURIComponent(landingPage.url)}`}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[#1E293B] text-[#94A3B8] hover:text-white border border-[#334155] hover:border-[#475569] transition-colors"
            >
              Re-capture
            </Link>
            <Link
              href={`/semantic-analysis?pageId=${landingPage.id}`}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[#22D3EE]/10 text-[#22D3EE] hover:bg-[#22D3EE]/20 transition-colors"
            >
              Analyse in Semantic Analysis
            </Link>
          </div>
        </div>

        {/* Title + metadata */}
        <div className="bg-[#1E293B] rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-white">
                {landingPage.title || 'Untitled Page'}
              </h1>
              <a
                href={landingPage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-[#22D3EE] hover:underline break-all"
              >
                {landingPage.url}
              </a>
            </div>
            {analysis ? (
              <span className="font-mono text-xs font-semibold text-[#22D3EE] bg-[#22D3EE]/10 px-3 py-1 rounded">
                Analyzed
              </span>
            ) : (
              <span className="font-mono text-xs font-semibold text-[#F59E0B] bg-[#F59E0B]/10 px-3 py-1 rounded">
                Pending
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-[#94A3B8]">
            {landingPage.competitor && (
              <span className="font-mono bg-[#0F172A] px-3 py-1 rounded text-[#22D3EE]">
                {landingPage.competitor.name}
              </span>
            )}
            {landingPage.competitor?.industry && (
              <span className="font-mono bg-[#0F172A] px-3 py-1 rounded text-[#A78BFA]">
                {landingPage.competitor.industry}
              </span>
            )}
            <span className="font-mono bg-[#0F172A] px-3 py-1 rounded">
              {(landingPage as any).deviceType || 'Desktop'}
            </span>
            <span className="font-mono bg-[#0F172A] px-3 py-1 rounded">
              Captured {landingPage.capturedAt ? safeFormatDate(landingPage.capturedAt, 'MMM d, yyyy') : 'Unknown'}
            </span>
          </div>
        </div>

        {/* Screenshot */}
        {landingPage.screenshotUrl && (
          <div className="bg-[#1E293B] rounded-xl p-4">
            <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">Screenshot</h2>
            <div className="max-h-[600px] overflow-y-auto rounded-lg border border-[#334155]">
              <img
                src={landingPage.screenshotUrl}
                alt={landingPage.title || landingPage.url}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Semantic Analysis Summary */}
        {analysis && (
          <div className="bg-[#1E293B] rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider">Analysis Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0F172A] rounded-lg p-4 space-y-2">
                <p className="text-xs text-[#64748B] uppercase tracking-wider">Primary Goal</p>
                <p className="text-sm text-white">{analysis.pageFlow?.primaryGoal || 'N/A'}</p>
              </div>
              <div className="bg-[#0F172A] rounded-lg p-4 space-y-2">
                <p className="text-xs text-[#64748B] uppercase tracking-wider">Framework</p>
                <p className="text-sm text-white">{analysis.messagingFrameworks?.primaryFramework || 'N/A'}</p>
              </div>
              <div className="bg-[#0F172A] rounded-lg p-4 space-y-2">
                <p className="text-xs text-[#64748B] uppercase tracking-wider">Total Folds</p>
                <p className="text-sm text-white">{analysis.pageFlow?.totalFolds ?? 'N/A'}</p>
              </div>
              <div className="bg-[#0F172A] rounded-lg p-4 space-y-2">
                <p className="text-xs text-[#64748B] uppercase tracking-wider">Top Strengths</p>
                <ul className="space-y-1">
                  {(analysis.insights?.strengths?.slice(0, 3) || []).map((s, i) => (
                    <li key={i} className="text-sm text-white flex items-start gap-2">
                      <span className="text-[#22D3EE] mt-0.5">+</span>
                      <span>{s}</span>
                    </li>
                  ))}
                  {(!analysis.insights?.strengths?.length) && (
                    <li className="text-sm text-[#64748B]">N/A</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Extracted Content */}
        {landingPage.copiedText && (
          <div className="bg-[#1E293B] rounded-xl p-6 space-y-3">
            <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider">Extracted Content</h2>
            <div className="bg-[#0F172A] rounded-lg p-4 max-h-[300px] overflow-y-auto font-mono text-xs text-[#94A3B8]">
              <pre className="whitespace-pre-wrap">{landingPage.copiedText}</pre>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
