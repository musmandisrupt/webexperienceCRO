'use client'

import React, { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import Link from 'next/link'
import { safeFormatDate } from '@/lib/dateUtils'
import toast from 'react-hot-toast'

interface MyPage {
  id: string
  url: string
  title?: string | null
  description?: string | null
  screenshotUrl?: string | null
  semanticAnalysis?: string | null
  capturedAt: string
  isOwned: boolean
  competitor?: { id: string; name: string } | null
}

const gradients = [
  'from-[#0e7490] to-[#0F172A]',
  'from-[#0891b2] to-[#0F172A]',
  'from-[#06b6d4] to-[#0F172A]',
  'from-[#155e75] to-[#0F172A]',
  'from-[#164e63] to-[#0F172A]',
  'from-[#0d9488] to-[#0F172A]',
]

export default function MyPagesPage() {
  const [pages, setPages] = useState<MyPage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [captureUrl, setCaptureUrl] = useState('')
  const [isCapturing, setIsCapturing] = useState(false)

  const fetchPages = useCallback(() => {
    fetch('/api/my-pages')
      .then(res => res.json())
      .then(data => {
        if (data.success) setPages(data.landingPages || [])
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    fetchPages()
  }, [fetchPages])

  const handleCapture = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!captureUrl.trim()) return

    try {
      new URL(captureUrl)
    } catch {
      toast.error('Please enter a valid URL')
      return
    }

    setIsCapturing(true)
    try {
      const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: captureUrl, isOwned: true }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Page captured successfully!')
        setCaptureUrl('')
        setShowModal(false)
        fetchPages()
      } else {
        toast.error(data.error || 'Capture failed')
      }
    } catch {
      toast.error('Failed to capture page')
    } finally {
      setIsCapturing(false)
    }
  }

  const getConversionScore = (page: MyPage): number | null => {
    if (!page.semanticAnalysis) return null
    try {
      const parsed = typeof page.semanticAnalysis === 'string' ? JSON.parse(page.semanticAnalysis) : page.semanticAnalysis
      return parsed?.overallScores?.conversionScore ?? null
    } catch {
      return null
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#22D3EE'
    if (score >= 6) return '#F59E0B'
    return '#EF4444'
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full p-8 gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-white">My Pages</h1>
            <p className="text-sm text-[#64748B] mt-1">Track and analyze your own landing pages</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#22D3EE] text-[#0A0F1C] text-[13px] font-semibold hover:bg-[#22D3EE]/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Page
          </button>
        </div>

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
        ) : pages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-[#1E293B] flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-[#22D3EE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No pages tracked yet</h3>
            <p className="text-sm text-[#475569] mb-6">Add your own landing pages to track and analyze their performance.</p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#22D3EE] text-[#0A0F1C] text-[13px] font-semibold hover:bg-[#22D3EE]/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Your First Page
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {pages.map((page) => {
              const hasAnalysis = !!page.semanticAnalysis
              const conversionScore = getConversionScore(page)
              const gradientClass = gradients[Math.abs(page.id.charCodeAt(0)) % gradients.length]

              return (
                <Link
                  key={page.id}
                  href={`/landing-pages/${page.id}`}
                  className="block bg-[#1E293B] rounded-xl overflow-hidden group hover:ring-1 hover:ring-[#22D3EE]/20 transition-all duration-200 cursor-pointer"
                >
                  {/* Screenshot */}
                  <div className="relative h-[240px]">
                    {page.screenshotUrl ? (
                      <img
                        src={page.screenshotUrl}
                        alt={page.title || page.url}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-b ${gradientClass} flex items-center justify-center`}>
                        <svg className="w-10 h-10 text-[#334155]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                        </svg>
                      </div>
                    )}
                    {/* YOUR PAGE badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#22D3EE]/90 text-[#0A0F1C] text-[10px] font-bold tracking-wide uppercase backdrop-blur-sm">
                        YOUR PAGE
                      </span>
                    </div>
                    {/* Analysis status */}
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold tracking-wide backdrop-blur-sm ${
                        hasAnalysis
                          ? 'bg-[#22D3EE]/15 text-[#22D3EE]'
                          : 'bg-[#475569]/30 text-[#94A3B8]'
                      }`}>
                        {hasAnalysis ? 'ANALYZED' : 'PENDING'}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="text-[15px] font-semibold text-white truncate mb-1 group-hover:text-[#22D3EE] transition-colors">
                      {page.title || 'Untitled Page'}
                    </h3>
                    <p className="font-mono text-[11px] text-[#475569] truncate mb-3">{page.url}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[#475569]">
                        {safeFormatDate(page.capturedAt, 'MMM d, yyyy')}
                      </span>
                      {conversionScore !== null && (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-[#475569]">Score</span>
                          <span className="font-mono text-[13px] font-bold" style={{ color: getScoreColor(conversionScore) }}>
                            {conversionScore}<span className="text-[10px] text-[#475569]">/10</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Page Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isCapturing && setShowModal(false)} />
          <div className="relative bg-[#1E293B] border border-[#334155] rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Add Your Page</h2>
              <button
                onClick={() => !isCapturing && setShowModal(false)}
                className="text-[#64748B] hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCapture}>
              <div className="mb-5">
                <label className="block font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px] mb-2">
                  PAGE URL
                </label>
                <input
                  type="url"
                  value={captureUrl}
                  onChange={(e) => setCaptureUrl(e.target.value)}
                  placeholder="https://your-landing-page.com"
                  className="w-full px-4 py-3 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-white placeholder:text-[#475569] outline-none focus:border-[#22D3EE] transition-colors"
                  disabled={isCapturing}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isCapturing}
                  className="flex-1 py-2.5 rounded-lg border border-[#334155] text-[13px] font-medium text-[#94A3B8] hover:bg-[#334155]/30 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCapturing || !captureUrl.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#22D3EE] text-[#0A0F1C] text-[13px] font-semibold hover:bg-[#22D3EE]/90 transition-colors disabled:opacity-50"
                >
                  {isCapturing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-[#0A0F1C]/30 border-t-[#0A0F1C] rounded-full animate-spin" />
                      Capturing...
                    </>
                  ) : (
                    'Capture Page'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
