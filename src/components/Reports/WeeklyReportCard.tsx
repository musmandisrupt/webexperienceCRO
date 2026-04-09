import Link from 'next/link'
import { format } from 'date-fns'
import { safeFormatDate } from '@/lib/dateUtils'
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  ShareIcon,
  CalendarIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import type { WeeklyReport } from '@/types'

interface WeeklyReportCardProps {
  report: WeeklyReport & {
    insights?: Array<{
      id: string
      title: string
      category: string
      landingPage?: {
        competitor?: {
          name: string
        }
      }
    }>
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'STEAL':
      return 'text-green-600 bg-green-100'
    case 'ADAPT':
      return 'text-yellow-600 bg-yellow-100'
    case 'AVOID':
      return 'text-red-600 bg-red-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'STEAL':
      return LightBulbIcon
    case 'ADAPT':
      return PencilIcon
    case 'AVOID':
      return ExclamationTriangleIcon
    default:
      return LightBulbIcon
  }
}

export default function WeeklyReportCard({ report }: WeeklyReportCardProps) {
  const insightsByCategory = report.insights?.reduce((acc, insight) => {
    if (!acc[insight.category]) {
      acc[insight.category] = []
    }
    acc[insight.category].push(insight)
    return acc
  }, {} as Record<string, typeof report.insights>) || {}

  return (
    <div className="card p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {report.title}
          </h3>
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <CalendarIcon className="h-4 w-4 mr-2" />
            {safeFormatDate(report.weekStart, 'MMM d')} - {safeFormatDate(report.weekEnd, 'MMM d, yyyy')}
          </div>
          {report.summary && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {report.summary}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <Link
            href={`/reports/${report.id}`}
            className="text-gray-400 hover:text-gray-500"
          >
            <EyeIcon className="h-5 w-5" />
          </Link>
          <Link
            href={`/reports/${report.id}/edit`}
            className="text-gray-400 hover:text-gray-500"
          >
            <PencilIcon className="h-5 w-5" />
          </Link>
          <button className="text-gray-400 hover:text-gray-500">
            <ShareIcon className="h-5 w-5" />
          </button>
          <button className="text-gray-400 hover:text-gray-500">
            <DocumentArrowDownIcon className="h-5 w-5" />
          </button>
          <button className="text-gray-400 hover:text-red-500">
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Insights Summary */}
      {report.insights && report.insights.length > 0 && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {['STEAL', 'ADAPT', 'AVOID'].map((category) => {
              const categoryInsights = insightsByCategory[category] || []
              const IconComponent = getCategoryIcon(category)
              
              return (
                <div key={category} className="text-center">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(category)} mb-2`}>
                    <IconComponent className="h-4 w-4 mr-1" />
                    {category}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {categoryInsights.length}
                  </div>
                  <div className="text-xs text-gray-500">
                    insight{categoryInsights.length !== 1 ? 's' : ''}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Recent Insights Preview */}
          {report.insights.slice(0, 3).map((insight) => {
            const IconComponent = getCategoryIcon(insight.category)
            return (
              <div key={insight.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className={`p-1 rounded ${getCategoryColor(insight.category)}`}>
                    <IconComponent className="h-3 w-3" />
                  </div>
                  <span className="ml-3 text-sm text-gray-900 truncate">
                    {insight.title}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {insight.landingPage?.competitor?.name}
                </span>
              </div>
            )
          })}

          {report.insights.length > 3 && (
            <div className="text-center mt-3">
              <Link
                href={`/reports/${report.id}`}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View {report.insights.length - 3} more insights →
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
        <span>Created {safeFormatDate(report.createdAt, 'MMM d, yyyy')}</span>
        <Link
          href={`/reports/${report.id}/export`}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Export report →
        </Link>
      </div>
    </div>
  )
}
