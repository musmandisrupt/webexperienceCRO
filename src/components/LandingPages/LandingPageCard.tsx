'use client'

import React, { useState, memo } from 'react'
import Link from 'next/link'
import { safeFormatDate } from '@/lib/dateUtils'
import type { LandingPage } from '@/types'

interface LandingPageCardProps {
  landingPage: LandingPage & {
    competitor?: { id: string; name: string; website: string; industry?: string }
    insights?: Array<{ id: string; title: string; category: string }>
  }
  onDelete?: (id: string) => void
}

const gradients = [
  'from-[#1a365d] to-[#0F172A]',
  'from-[#7c3aed] to-[#0F172A]',
  'from-[#065f46] to-[#0F172A]',
  'from-[#9f1239] to-[#0F172A]',
  'from-[#c2410c] to-[#0F172A]',
  'from-[#1e40af] to-[#0F172A]',
]

function LandingPageCardInner({ landingPage, onDelete }: LandingPageCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const hasAnalysis = !!(landingPage as any).semanticAnalysis
  const gradientClass = gradients[Math.abs(landingPage.id.charCodeAt(0)) % gradients.length]

  const handleDelete = async () => {
    if (!confirm('Delete this landing page?')) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/landing-pages/${landingPage.id}`, { method: 'DELETE' })
      if (res.ok) onDelete?.(landingPage.id)
    } catch (e) {
      console.error(e)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Link href={`/landing-pages/${landingPage.id}`} className="block bg-[#1E293B] rounded-xl overflow-hidden group hover:ring-1 hover:ring-[#22D3EE]/20 transition-all duration-200 cursor-pointer">
      {/* Screenshot */}
      <div className="relative h-[240px]">
        {landingPage.screenshotUrl ? (
          <img
            src={landingPage.screenshotUrl}
            alt={landingPage.title || landingPage.url}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-b ${gradientClass}`} />
        )}
        {/* Actions overlay */}
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/landing-pages/${landingPage.id}/edit`} onClick={(e) => e.stopPropagation()} className="p-1.5 rounded bg-[#0A0F1C]/80 text-[#94A3B8] hover:text-white">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
            </svg>
          </Link>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete() }} disabled={isDeleting} className="p-1.5 rounded bg-[#0A0F1C]/80 text-[#94A3B8] hover:text-[#EF4444] disabled:opacity-50">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-2.5">
        <h3 className="text-[15px] font-semibold text-white truncate">
          {landingPage.title || 'Untitled Page'}
        </h3>
        <p className="font-mono text-xs text-[#64748B] truncate">{landingPage.url}</p>

        {/* Tags */}
        <div className="flex gap-1.5 flex-wrap">
          {landingPage.competitor && (
            <span className="font-mono text-[10px] font-medium text-[#22D3EE] bg-[#0F172A] px-2 py-1 rounded">
              {landingPage.competitor.name}
            </span>
          )}
          {landingPage.competitor?.industry && (
            <span className="font-mono text-[10px] font-medium text-[#A78BFA] bg-[#0F172A] px-2 py-1 rounded">
              {landingPage.competitor.industry}
            </span>
          )}
          <span className="font-mono text-[10px] font-medium text-[#94A3B8] bg-[#0F172A] px-2 py-1 rounded">
            {(landingPage as any).deviceType || 'Desktop'}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <span className="font-mono text-[11px] text-[#475569]">
            {landingPage.capturedAt ? safeFormatDate(landingPage.capturedAt, 'MMM d, yyyy') : 'Unknown'}
          </span>
          {hasAnalysis ? (
            <span className="font-mono text-[10px] font-semibold text-[#22D3EE] bg-[#22D3EE]/10 px-2 py-0.5 rounded">
              ✓ Analyzed
            </span>
          ) : (
            <span className="font-mono text-[10px] font-semibold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded">
              ◐ Pending
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

const LandingPageCard = memo(LandingPageCardInner)
export default LandingPageCard
