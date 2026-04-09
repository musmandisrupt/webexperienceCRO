'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import Link from 'next/link'

interface DashboardStats {
  competitors: { count: number; weekChange: number }
  landingPages: { count: number; weekChange: number }
  insights: { count: number; weekChange: number }
  analyses: { count: number; weekChange: number }
}

interface ActivityItem {
  id: string
  type: string
  description: string
  time: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const s = data.stats || {}
          setStats({
            competitors: { count: s.competitors?.current || 0, weekChange: s.competitors?.change || 0 },
            landingPages: { count: s.landingPages?.current || 0, weekChange: s.landingPages?.change || 0 },
            insights: { count: s.insights?.current || 0, weekChange: s.insights?.change || 0 },
            analyses: { count: s.reports?.current || 0, weekChange: s.reports?.change || 0 },
          })
          setActivities((data.recentActivity || []).map((a: any) => ({
            ...a,
            description: a.description || a.content || '',
          })))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const statCards = stats ? [
    { label: 'COMPETITORS', value: stats.competitors.count, change: stats.competitors.weekChange },
    { label: 'LANDING PAGES', value: stats.landingPages.count, change: stats.landingPages.weekChange },
    { label: 'INSIGHTS', value: stats.insights.count, change: stats.insights.weekChange },
    { label: 'REPORTS', value: stats.analyses.count, change: stats.analyses.weekChange },
  ] : []

  const insights = [
    { category: 'STEAL', color: '#22D3EE', text: "Strong hero sections with social proof metrics drive higher conversion rates" },
    { category: 'ADAPT', color: '#F59E0B', text: "Progressive CTA patterns that increase scroll depth and engagement" },
    { category: 'AVOID', color: '#EF4444', text: "Excessive modal popups before scroll — kills user engagement" },
  ]

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full p-8 gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-white">Dashboard</h1>
            <p className="text-sm text-[#64748B] mt-1">Track competitor landing pages and insights</p>
          </div>
          <Link
            href="/capture"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#22D3EE] text-[#0A0F1C] text-[13px] font-semibold hover:bg-[#22D3EE]/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Capture
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#1E293B] rounded-xl p-5 animate-pulse">
                <div className="h-3 w-24 bg-[#0F172A] rounded mb-4" />
                <div className="h-8 w-16 bg-[#0F172A] rounded" />
              </div>
            ))
          ) : (
            statCards.map((stat) => (
              <div key={stat.label} className="bg-[#1E293B] rounded-xl p-5">
                <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px]">{stat.label}</p>
                <div className="flex items-end gap-2 mt-2">
                  <span className="font-mono text-[32px] font-bold text-white leading-none">{stat.value}</span>
                  {stat.change > 0 && (
                    <span className="font-mono text-xs font-medium text-[#22D3EE] mb-1">+{stat.change} this week</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Row */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 min-h-0">
          {/* Recent Activity */}
          <div className="bg-[#1E293B] rounded-xl p-6 overflow-hidden flex flex-col">
            <p className="font-mono text-[11px] font-semibold text-[#64748B] tracking-[2px] mb-4">RECENT ACTIVITY</p>
            <div className="flex-1 overflow-y-auto space-y-0">
              {activities.length > 0 ? activities.slice(0, 8).map((activity, i) => (
                <div key={activity.id || i} className="flex items-center gap-3 py-3 border-b border-[#0F172A] last:border-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i < 2 ? 'bg-[#22D3EE]' : 'bg-[#94A3B8]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{activity.description}</p>
                    <p className="font-mono text-xs text-[#64748B]">{activity.time}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-[#475569]">No recent activity</p>
              )}
            </div>
          </div>

          {/* Top Insights */}
          <div className="bg-[#1E293B] rounded-xl p-6 overflow-hidden flex flex-col">
            <p className="font-mono text-[11px] font-semibold text-[#64748B] tracking-[2px] mb-4">TOP INSIGHTS</p>
            <div className="flex-1 space-y-3">
              {insights.map((insight) => (
                <div key={insight.category} className="bg-[#0F172A] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: insight.color }} />
                    <span className="font-mono text-[10px] font-bold tracking-[1.5px]" style={{ color: insight.color }}>
                      {insight.category}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#94A3B8] leading-relaxed">{insight.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
