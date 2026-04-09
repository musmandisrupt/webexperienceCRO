import DashboardLayout from '@/components/Layout/DashboardLayout'
import PageHeader from '@/components/Layout/PageHeader'
import WeeklyReportCard from '@/components/Reports/WeeklyReportCard'
import { PlusIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

// Mock data - replace with real data from database
const reports = [
  {
    id: '1',
    title: 'Week of November 13-19, 2023',
    weekStart: new Date('2023-11-13'),
    weekEnd: new Date('2023-11-19'),
    summary: 'Focus on pricing page strategies and mobile optimization patterns. Key findings include interactive calculators and social proof placement.',
    createdAt: new Date('2023-11-20'),
    insights: [
      {
        id: '1',
        title: 'Interactive pricing calculator',
        category: 'STEAL',
        landingPage: { competitor: { name: 'Stripe' } },
      },
      {
        id: '2',
        title: 'Social proof through customer logos',
        category: 'ADAPT',
        landingPage: { competitor: { name: 'Notion' } },
      },
      {
        id: '3',
        title: 'Overly complex hero section',
        category: 'AVOID',
        landingPage: { competitor: { name: 'Figma' } },
      },
    ],
  },
  {
    id: '2',
    title: 'Week of November 6-12, 2023',
    weekStart: new Date('2023-11-06'),
    weekEnd: new Date('2023-11-12'),
    summary: 'Analysis of onboarding flows and feature positioning across key competitors. Identified several anti-patterns to avoid.',
    createdAt: new Date('2023-11-13'),
    insights: [
      {
        id: '4',
        title: 'Progressive onboarding flow',
        category: 'STEAL',
        landingPage: { competitor: { name: 'Slack' } },
      },
      {
        id: '5',
        title: 'Feature-heavy navigation',
        category: 'AVOID',
        landingPage: { competitor: { name: 'Monday.com' } },
      },
    ],
  },
]

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Weekly Reports"
        description="Curated insights organized into weekly Steal/Adapt/Avoid reports"
        action={
          <div className="flex items-center space-x-3">
            <button className="btn-secondary flex items-center">
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Export All
            </button>
            <Link
              href="/reports/new"
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Report
            </Link>
          </div>
        }
      />
      
      <div className="p-6">
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reports</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first weekly report.</p>
            <div className="mt-6">
              <Link
                href="/reports/new"
                className="btn-primary flex items-center justify-center mx-auto w-auto"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Report
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {reports.map((report) => (
              <WeeklyReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
