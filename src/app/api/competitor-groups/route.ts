import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const groups = await prisma.competitorGroup.findMany({
      include: {
        competitors: {
          include: {
            landingPages: {
              take: 1,
              orderBy: { capturedAt: 'desc' },
              select: { id: true, title: true, screenshotUrl: true, semanticAnalysis: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Also get ungrouped competitors
    const ungrouped = await prisma.competitor.findMany({
      where: { groupId: null },
      include: {
        landingPages: {
          take: 1,
          orderBy: { capturedAt: 'desc' },
          select: { id: true, title: true, screenshotUrl: true, semanticAnalysis: true }
        }
      }
    })

    return NextResponse.json({ success: true, groups, ungrouped })
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, industry } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    const group = await prisma.competitorGroup.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        industry: industry?.trim() || null,
      }
    })

    return NextResponse.json({ success: true, group })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }
}
