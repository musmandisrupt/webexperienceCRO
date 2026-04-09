import Link from 'next/link'
import { safeFormatDate } from '@/lib/dateUtils'
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import type { Insight } from '@/types'
import { InsightType } from '@/types'
import { clsx } from 'clsx'

interface InsightCardProps {
  insight: Insight & {
    landingPage?: {
      id: string
      url: string
      title?: string
      competitor?: {
        id: string
        name: string
        website: string
      }
    }
  }
}

const categoryConfig = {
  [InsightType.STEAL]: {
    label: 'Steal',
    icon: LightBulbIcon,
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/20',
  },
  [InsightType.ADAPT]: {
    label: 'Adapt',
    icon: PencilIcon,
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/20',
  },
  [InsightType.AVOID]: {
    label: 'Avoid',
    icon: ExclamationTriangleIcon,
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/20',
  },
}

export default function InsightCard({ insight }: InsightCardProps) {
  const config = categoryConfig[insight.category]
  const IconComponent = config.icon

  const renderConfidenceStars = (confidence: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={clsx(
          'h-4 w-4',
          i < confidence
            ? 'text-yellow-400 fill-current'
            : 'text-gray-600'
        )}
      />
    ))
  }

  return (
    <div className="bg-[#1E293B] rounded-xl p-6 hover:bg-[#243247] transition-colors duration-200 border border-[#334155]/50">
      <div className="flex items-start justify-between mb-4">
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
          <IconComponent className="h-3 w-3 mr-1" />
          {config.label}
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href={`/insights/${insight.id}`}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <EyeIcon className="h-5 w-5" />
          </Link>
          <Link
            href={`/insights/${insight.id}/edit`}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <PencilIcon className="h-5 w-5" />
          </Link>
          <button className="text-gray-500 hover:text-red-400 transition-colors">
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">
          {insight.title}
        </h3>
        <p className="text-sm text-gray-400 line-clamp-3">
          {insight.description}
        </p>
      </div>

      {/* Confidence Rating */}
      <div className="flex items-center space-x-1 mb-4">
        <span className="text-xs text-gray-500 mr-2">Confidence:</span>
        <div className="flex items-center space-x-1">
          {renderConfidenceStars(insight.confidence)}
        </div>
      </div>

      {/* Source Information */}
      {insight.landingPage && (
        <div className="border-t border-[#334155] pt-4">
          <div className="text-xs text-gray-500 space-y-1">
            <div>
              <span className="font-medium text-gray-400">Source:</span>{' '}
              <span className="text-gray-300">{insight.landingPage.competitor?.name}</span>
            </div>
            <div className="truncate">
              <a
                href={insight.landingPage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#22D3EE] hover:text-[#06B6D4] transition-colors"
              >
                {insight.landingPage.url}
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
        <span>Added {safeFormatDate(insight.createdAt, 'MMM d, yyyy')}</span>
        <Link
          href={`/insights/${insight.id}/add-to-report`}
          className="text-[#22D3EE] hover:text-[#06B6D4] font-medium transition-colors"
        >
          Add to report &rarr;
        </Link>
      </div>
    </div>
  )
}
