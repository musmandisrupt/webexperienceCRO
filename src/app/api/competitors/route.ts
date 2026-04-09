import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, website, description, industry, groupId } = body

    if (!name || !website) {
      return NextResponse.json({ error: 'Name and website are required' }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(website)
    } catch {
      return NextResponse.json({ error: 'Invalid website URL format' }, { status: 400 })
    }

    const competitor = await prisma.competitor.create({
      data: {
        name,
        website,
        description: description || null,
        industry: industry || null,
        ...(groupId && { groupId }),
      },
    })

    return NextResponse.json({
      success: true,
      competitor,
    })
  } catch (error) {
    console.error('Create competitor error:', error)
    return NextResponse.json(
      { error: 'Failed to create competitor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const competitors = await prisma.competitor.findMany({
      include: {
        group: true,
        landingPages: {
          select: {
            id: true,
            url: true,
            capturedAt: true,
          },
          orderBy: {
            capturedAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      competitors,
    })
  } catch (error) {
    console.error('Get competitors error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch competitors', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
