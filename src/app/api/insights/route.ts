import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const insights = await prisma.insight.findMany({
      include: {
        landingPage: {
          include: {
            competitor: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ success: true, insights })
  } catch (error) {
    console.error('Get insights error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insights', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, category, confidence, landingPageId } = body

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    if (!category || !['STEAL', 'ADAPT', 'AVOID'].includes(category)) {
      return NextResponse.json(
        { error: 'Category must be one of: STEAL, ADAPT, AVOID' },
        { status: 400 }
      )
    }

    if (confidence === undefined || typeof confidence !== 'number' || confidence < 1 || confidence > 5) {
      return NextResponse.json(
        { error: 'Confidence must be a number between 1 and 5' },
        { status: 400 }
      )
    }

    const data: any = {
      title: title.trim(),
      description: description.trim(),
      category,
      confidence,
    }

    if (landingPageId) {
      data.landingPage = { connect: { id: landingPageId } }
    }

    const insight = await prisma.insight.create({
      data,
      include: {
        landingPage: {
          include: {
            competitor: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, insight }, { status: 201 })
  } catch (error) {
    console.error('Create insight error:', error)
    return NextResponse.json(
      { error: 'Failed to create insight', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
