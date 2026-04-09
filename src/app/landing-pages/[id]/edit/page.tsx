'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import PageHeader from '@/components/Layout/PageHeader'
import toast from 'react-hot-toast'

interface Competitor {
  id: string
  name: string
  website: string
  industry: string
}

interface LandingPage {
  id: string
  url: string
  title: string
  description: string | null
  competitorId: string | null
  competitor?: Competitor
}

export default function EditLandingPage() {
  const router = useRouter()
  const params = useParams()
  const landingPageId = params.id as string

  const [landingPage, setLandingPage] = useState<LandingPage | null>(null)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    competitorId: '',
  })

  useEffect(() => {
    // Fetch landing page data and competitors
    Promise.all([
      fetch(`/api/landing-pages/${landingPageId}`),
      fetch('/api/competitors')
    ])
      .then(async ([pageRes, competitorsRes]) => {
        const pageData = await pageRes.json()
        const competitorsData = await competitorsRes.json()

        if (pageData.success) {
          setLandingPage(pageData.landingPage)
          // Fallback to URL hostname if title is empty
          let title = pageData.landingPage.title || ''
          if (!title) {
            try {
              title = new URL(pageData.landingPage.url).hostname
            } catch {
              title = ''
            }
          }
          setFormData({
            title,
            description: pageData.landingPage.description || '',
            competitorId: pageData.landingPage.competitorId || '',
          })
        }

        if (competitorsData.success) {
          setCompetitors(competitorsData.competitors)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [landingPageId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch(`/api/landing-pages/${landingPageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update landing page')
      }

      toast.success('Landing page updated successfully')
      router.push('/landing-pages')
    } catch (error) {
      console.error('Error updating landing page:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update landing page. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Edit Landing Page"
          description="Update landing page information"
        />

        <div className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22D3EE] mx-auto"></div>
            <p className="mt-4 text-[#94A3B8]">Loading landing page...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!landingPage) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Landing Page Not Found"
          description="The requested landing page could not be found"
        />

        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-[#94A3B8]">Landing page not found.</p>
            <button
              onClick={() => router.push('/landing-pages')}
              className="mt-4 bg-[#22D3EE] text-[#0A0F1C] font-semibold px-4 py-2 rounded-lg hover:opacity-90"
            >
              Back to Landing Pages
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Edit Landing Page"
        description="Update landing page information"
      />

      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#1E293B] rounded-lg shadow p-6">
            {/* URL Display (read-only) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                URL (Read-only)
              </label>
              <div className="px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#64748B]">
                {landingPage.url}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-[#94A3B8] mb-2">
                  Page Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter page title"
                  className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-white focus:border-[#22D3EE] outline-none placeholder-[#64748B]"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-[#94A3B8] mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Enter page description"
                  className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-white focus:border-[#22D3EE] outline-none placeholder-[#64748B]"
                />
              </div>

              <div>
                <label htmlFor="competitorId" className="block text-sm font-medium text-[#94A3B8] mb-2">
                  Competitor
                </label>
                <select
                  id="competitorId"
                  name="competitorId"
                  value={formData.competitorId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-white focus:border-[#22D3EE] outline-none"
                >
                  <option value="">No competitor</option>
                  {competitors.map((competitor) => (
                    <option key={competitor.id} value={competitor.id}>
                      {competitor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/landing-pages')}
                  className="bg-[#0F172A] text-[#94A3B8] rounded-lg px-4 py-2 hover:opacity-80"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#22D3EE] text-[#0A0F1C] font-semibold rounded-lg px-5 py-2 hover:opacity-90 disabled:opacity-50"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
