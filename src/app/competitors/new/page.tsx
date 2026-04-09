'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import PageHeader from '@/components/Layout/PageHeader'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'

const competitorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  website: z.string().url('Please enter a valid URL'),
  description: z.string().optional(),
  industry: z.string().optional(),
})

type CompetitorFormData = z.infer<typeof competitorSchema>

export default function NewCompetitorPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompetitorFormData>({
    resolver: zodResolver(competitorSchema),
  })

  const onSubmit = async (data: CompetitorFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/competitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create competitor')
      }
      
      toast.success('Competitor added successfully!')
      router.push('/competitors')
    } catch (error) {
      console.error('Error creating competitor:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add competitor. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Add New Competitor"
        description="Track a new competitor to analyze their landing pages and strategies"
      />
      
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="card p-6">
              <div className="space-y-6">
                <div>
                  <label className="label">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Stripe, Notion, Figma"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">
                    Website URL *
                  </label>
                  <input
                    type="url"
                    className="input"
                    placeholder="https://example.com"
                    {...register('website')}
                  />
                  {errors.website && (
                    <p className="mt-2 text-sm text-red-600">{errors.website.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">
                    Industry
                  </label>
                  <select
                    className="input"
                    {...register('industry')}
                  >
                    <option value="">Select an industry</option>
                    <option value="SaaS">SaaS</option>
                    <option value="Fintech">Fintech</option>
                    <option value="E-commerce">E-commerce</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Developer Tools">Developer Tools</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="label">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className="input"
                    placeholder="Brief description of what this company does"
                    {...register('description')}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Adding...' : 'Add Competitor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
