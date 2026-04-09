'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { safeFormatDate } from '@/lib/dateUtils'
import toast from 'react-hot-toast'
import type { Competitor } from '@/types'

interface CompetitorCardProps {
  competitor: Competitor
  onRefresh?: () => void
  onDelete?: (competitorId: string) => Promise<void> | void
  group?: { id: string; name: string } | null
}

export default function CompetitorCard({ competitor, onRefresh, onDelete, group }: CompetitorCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const landingPageCount = competitor.landingPages?.length || 0

  const confirmDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(competitor.id)
      toast.success(`${competitor.name} deleted`)
      setShowDeleteConfirm(false)
    } catch {
      toast.error('Failed to delete competitor')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div
        className="relative rounded-xl p-5 transition-all duration-200"
        style={{
          background: '#1E293B',
          border: isHovered ? '1px solid #334155' : '1px solid transparent',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Delete button - shows on hover */}
        {onDelete && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="absolute top-3 right-3 p-1.5 rounded-lg transition-all duration-200"
            style={{
              opacity: isHovered ? 1 : 0,
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#EF4444',
            }}
            title="Delete competitor"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        )}

        {/* Name and website */}
        <div className="mb-3">
          <h3 style={{ color: 'white', fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>
            {competitor.name}
          </h3>
          <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#64748B' }}>
            {competitor.website}
          </p>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {competitor.industry && (
            <span
              className="inline-flex items-center rounded-md px-2 py-0.5"
              style={{
                background: 'rgba(34, 211, 238, 0.1)',
                color: '#22D3EE',
                fontFamily: 'monospace',
                fontSize: '10px',
                fontWeight: 500,
              }}
            >
              {competitor.industry}
            </span>
          )}
          {group && (
            <span
              className="inline-flex items-center rounded-md px-2 py-0.5"
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                color: '#F59E0B',
                fontFamily: 'monospace',
                fontSize: '10px',
                fontWeight: 500,
              }}
            >
              {group.name}
            </span>
          )}
        </div>

        {/* Description */}
        {competitor.description && (
          <p className="line-clamp-2 mb-3" style={{ fontSize: '13px', color: '#94A3B8' }}>
            {competitor.description}
          </p>
        )}

        {/* Landing pages count */}
        <div className="flex items-center gap-1.5 mb-4" style={{ color: '#64748B', fontSize: '12px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span style={{ fontFamily: 'monospace' }}>
            {landingPageCount} landing page{landingPageCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Footer links */}
        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: '1px solid #334155' }}
        >
          <Link
            href={`/capture?competitor=${competitor.id}`}
            className="flex items-center gap-1.5 transition-colors duration-150"
            style={{ color: '#22D3EE', fontSize: '12px', fontFamily: 'monospace', textDecoration: 'none' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Capture
          </Link>

          {landingPageCount > 0 && (
            <Link
              href={`/landing-pages?competitor=${competitor.id}`}
              className="flex items-center gap-1.5 transition-colors duration-150"
              style={{ color: '#94A3B8', fontSize: '12px', fontFamily: 'monospace', textDecoration: 'none' }}
            >
              View Pages
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="rounded-xl p-6 w-full max-w-md"
            style={{ background: '#1E293B' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg"
                style={{ background: 'rgba(239, 68, 68, 0.15)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </div>
              <div>
                <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 600 }}>Delete Competitor</h3>
                <p style={{ color: '#94A3B8', fontSize: '13px' }}>This action cannot be undone.</p>
              </div>
            </div>

            <div
              className="rounded-lg p-3 mb-5"
              style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
            >
              <p style={{ color: '#EF4444', fontSize: '13px' }}>
                <strong>{competitor.name}</strong> and {landingPageCount} landing page{landingPageCount !== 1 ? 's' : ''} will be permanently deleted.
              </p>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm transition-colors"
                style={{ color: '#94A3B8', background: '#0F172A' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{ background: '#EF4444', color: 'white' }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
