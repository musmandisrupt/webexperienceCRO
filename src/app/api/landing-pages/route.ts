import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const competitorId = searchParams.get('competitorId')
    const industry = searchParams.get('industry')
    const dateRange = searchParams.get('dateRange')

    // Build filter conditions
    const where: any = {}

    // Search filter - search in url, title, and description
    if (search) {
      const searchLower = search.toLowerCase()
      where.OR = [
        { url: { contains: searchLower } },
        { title: { contains: searchLower } },
        { description: { contains: searchLower } },
      ]
    }

    // Competitor filter
    if (competitorId) {
      where.competitorId = competitorId
    }

    // Industry filter (through competitor)
    if (industry) {
      where.competitor = {
        industry: { equals: industry }
      }
    }

    // Date range filter
    if (dateRange) {
      const now = new Date()
      let startDate: Date

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'quarter':
          const quarterStart = Math.floor(now.getMonth() / 3) * 3
          startDate = new Date(now.getFullYear(), quarterStart, 1)
          break
        default:
          startDate = new Date(0) // Beginning of time
      }

      where.capturedAt = {
        gte: startDate
      }
    }

    const landingPages = await prisma.landingPage.findMany({
      where,
      include: {
        competitor: {
          select: {
            id: true,
            name: true,
            website: true,
            industry: true,
          },
        },
        insights: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
      orderBy: {
        capturedAt: 'desc',
      },
    })

    // Parse semantic analysis data from database
    const landingPagesWithSemantic = landingPages.map(page => {
      let parsedSemanticAnalysis = null
      
      // Parse the semantic analysis if it exists
      if (page.semanticAnalysis) {
        try {
          parsedSemanticAnalysis = JSON.parse(page.semanticAnalysis)
        } catch (error) {
          console.error('Error parsing semantic analysis for page:', page.id, error)
          parsedSemanticAnalysis = null
        }
      }

      return {
        ...page,
        semanticAnalysis: parsedSemanticAnalysis
      }
    })

    return NextResponse.json({
      success: true,
      landingPages: landingPagesWithSemantic,
    })
  } catch (error) {
    console.error('Get landing pages error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch landing pages', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
