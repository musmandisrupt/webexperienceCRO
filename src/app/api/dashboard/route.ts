import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatDistanceToNow } from 'date-fns'

export async function GET() {
  try {
    // Get current counts
    const [competitorsCount, landingPagesCount, insightsCount, reportsCount] = await Promise.all([
      prisma.competitor.count(),
      prisma.landingPage.count(),
      prisma.insight.count(),
      prisma.weeklyReport.count(),
    ])

    // Get counts from last week for comparison
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    
    const [lastWeekCompetitors, lastWeekLandingPages, lastWeekInsights, lastWeekReports] = await Promise.all([
      prisma.competitor.count({
        where: { createdAt: { gte: lastWeek } }
      }),
      prisma.landingPage.count({
        where: { capturedAt: { gte: lastWeek } }
      }),
      prisma.insight.count({
        where: { createdAt: { gte: lastWeek } }
      }),
      prisma.weeklyReport.count({
        where: { createdAt: { gte: lastWeek } }
      }),
    ])

    // Get recent activity
    const recentActivity = await Promise.all([
      // Recent landing page captures
      prisma.landingPage.findMany({
        take: 3,
        orderBy: { capturedAt: 'desc' },
        include: { competitor: true }
      }),
      // Recent insights
      prisma.insight.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { landingPage: true }
      }),
      // Recent competitors
      prisma.competitor.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' }
      }),
      // Recent reports
      prisma.weeklyReport.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' }
      })
    ])

    // Combine and sort all recent activity
    const allActivity = [
      ...recentActivity[0].map(page => ({
        id: `page-${page.id}`,
        type: 'capture',
        content: `Captured landing page from ${page.competitor?.name || 'Unknown'}`,
        time: formatDistanceToNow(new Date(page.capturedAt), { addSuffix: true }),
        timestamp: new Date(page.capturedAt),
        icon: 'PhotoIcon'
      })),
      ...recentActivity[1].map(insight => ({
        id: `insight-${insight.id}`,
        type: 'insight',
        content: `Added ${insight.category} insight for ${insight.landingPage?.title || 'landing page'}`,
        time: formatDistanceToNow(new Date(insight.createdAt), { addSuffix: true }),
        timestamp: new Date(insight.createdAt),
        icon: 'LightBulbIcon'
      })),
      ...recentActivity[2].map(competitor => ({
        id: `competitor-${competitor.id}`,
        type: 'competitor',
        content: `Added new competitor: ${competitor.name}`,
        time: formatDistanceToNow(new Date(competitor.createdAt), { addSuffix: true }),
        timestamp: new Date(competitor.createdAt),
        icon: 'BuildingStorefrontIcon'
      })),
      ...recentActivity[3].map(report => ({
        id: `report-${report.id}`,
        type: 'report',
        content: `Generated weekly report: ${report.title}`,
        time: formatDistanceToNow(new Date(report.createdAt), { addSuffix: true }),
        timestamp: new Date(report.createdAt),
        icon: 'DocumentTextIcon'
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 4)

    return NextResponse.json({
      success: true,
      stats: {
        competitors: {
          current: competitorsCount,
          change: lastWeekCompetitors,
          changeType: lastWeekCompetitors > 0 ? 'increase' : 'no-change'
        },
        landingPages: {
          current: landingPagesCount,
          change: lastWeekLandingPages,
          changeType: lastWeekLandingPages > 0 ? 'increase' : 'no-change'
        },
        insights: {
          current: insightsCount,
          change: lastWeekInsights,
          changeType: lastWeekInsights > 0 ? 'increase' : 'no-change'
        },
        reports: {
          current: reportsCount,
          change: lastWeekReports,
          changeType: lastWeekReports > 0 ? 'increase' : 'no-change'
        }
      },
      recentActivity: allActivity
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
