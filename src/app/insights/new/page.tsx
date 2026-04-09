'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import { StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import Link from 'next/link'

interface LandingPage {
  id: string
  url: string
  title?: string
  competitor?: {
    id: string
    name: string
  }
}

const CATEGORIES = ['STEAL', 'ADAPT', 'AVOID'] as const

export default function NewInsightPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('')
  const [confidence, setConfidence] = useState(0)
  const [landingPageId, setLandingPageId] = useState('')
  const [landingPages, setLandingPages] = useState<LandingPage[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchLandingPages() {
      try {
        const res = await fetch('/api/landing-pages')
        const data = await res.json()
        if (data.success) {
          setLandingPages(data.landingPages)
        }
      } catch (error) {
        console.error('Failed to fetch landing pages:', error)
      }
    }
    fetchLandingPages()
  }, [])

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!title.trim()) {
      newErrors.title = 'Title is required'
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required'
    }
    if (!category) {
      newErrors.category = 'Please select a category'
    }
    if (confidence < 1) {
      newErrors.confidence = 'Please rate your confidence (1-5)'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const body: any = {
        title: title.trim(),
        description: description.trim(),
        category,
        confidence,
      }
      if (landingPageId) {
        body.landingPageId = landingPageId
      }

      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (data.success) {
        router.push('/insights')
      } else {
        setErrors({ form: data.error || 'Failed to create insight' })
      }
    } catch (error) {
      setErrors({ form: 'An unexpected error occurred' })
    } finally {
      setSubmitting(false)
    }
  }

  const categoryStyles: Record<string, { active: string; inactive: string }> = {
    STEAL: {
      active: 'bg-green-500/20 text-green-400 border-green-500/50',
      inactive: 'bg-[#0F172A] text-gray-400 border-[#334155] hover:border-green-500/50 hover:text-green-400',
    },
    ADAPT: {
      active: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      inactive: 'bg-[#0F172A] text-gray-400 border-[#334155] hover:border-yellow-500/50 hover:text-yellow-400',
    },
    AVOID: {
      active: 'bg-red-500/20 text-red-400 border-red-500/50',
      inactive: 'bg-[#0F172A] text-gray-400 border-[#334155] hover:border-red-500/50 hover:text-red-400',
    },
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-bold text-white">Add Insight</h1>
          <p className="text-sm text-gray-400 mt-1">
            Record a new insight from your competitor analysis
          </p>
        </div>
      </div>

      <div className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit}>
          <div className="bg-[#1E293B] rounded-xl p-6 space-y-6">
            {/* Form error */}
            {errors.form && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
                {errors.form}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (errors.title) setErrors((prev) => ({ ...prev, title: '' }))
                }}
                placeholder="e.g., Interactive pricing calculator"
                className="w-full bg-[#0F172A] border border-[#334155] text-white rounded-lg px-3 py-2.5 focus:border-[#22D3EE] focus:outline-none placeholder-gray-500"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-400">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  if (errors.description) setErrors((prev) => ({ ...prev, description: '' }))
                }}
                placeholder="Describe the insight and how it could be applied..."
                className="w-full bg-[#0F172A] border border-[#334155] text-white rounded-lg px-3 py-2.5 focus:border-[#22D3EE] focus:outline-none placeholder-gray-500 resize-none"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-400">{errors.description}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Category <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategory(cat)
                      if (errors.category) setErrors((prev) => ({ ...prev, category: '' }))
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      category === cat
                        ? categoryStyles[cat].active
                        : categoryStyles[cat].inactive
                    }`}
                  >
                    {cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="mt-1 text-xs text-red-400">{errors.category}</p>
              )}
            </div>

            {/* Confidence */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Confidence <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setConfidence(star)
                      if (errors.confidence) setErrors((prev) => ({ ...prev, confidence: '' }))
                    }}
                    className="p-0.5 transition-transform hover:scale-110"
                  >
                    {star <= confidence ? (
                      <StarIconSolid className="h-7 w-7 text-yellow-400" />
                    ) : (
                      <StarIcon className="h-7 w-7 text-gray-600 hover:text-yellow-400/50" />
                    )}
                  </button>
                ))}
                {confidence > 0 && (
                  <span className="ml-2 text-sm text-gray-400">
                    {confidence}/5
                  </span>
                )}
              </div>
              {errors.confidence && (
                <p className="mt-1 text-xs text-red-400">{errors.confidence}</p>
              )}
            </div>

            {/* Landing Page (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Landing Page <span className="text-gray-500">(optional)</span>
              </label>
              <select
                value={landingPageId}
                onChange={(e) => setLandingPageId(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#334155] text-white rounded-lg px-3 py-2.5 focus:border-[#22D3EE] focus:outline-none"
              >
                <option value="">No landing page</option>
                {landingPages.map((lp) => (
                  <option key={lp.id} value={lp.id}>
                    {lp.competitor?.name ? `${lp.competitor.name} - ` : ''}
                    {lp.title || lp.url}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <Link
              href="/insights"
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 border border-[#334155] hover:text-white hover:border-gray-400 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg bg-[#22D3EE] text-[#0A0F1C] font-semibold text-sm hover:bg-[#06B6D4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create Insight'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
