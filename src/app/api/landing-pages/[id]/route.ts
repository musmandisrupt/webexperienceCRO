import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/landing-pages/[id] - Get a specific landing page
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const landingPage = await prisma.landingPage.findUnique({
      where: {
        id: params.id,
      },
      include: {
        competitor: true,
        insights: true,
      },
    })

    if (!landingPage) {
      return NextResponse.json(
        { success: false, error: 'Landing page not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      landingPage,
    })
  } catch (error) {
    console.error('Error fetching landing page:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch landing page' },
      { status: 500 }
    )
  }
}

// PUT /api/landing-pages/[id] - Update a landing page
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, description, competitorId } = body

    // Build the update data object
    const updateData: any = {}
    
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (competitorId !== undefined) {
      updateData.competitorId = competitorId || null
    }

    const landingPage = await prisma.landingPage.update({
      where: {
        id: params.id,
      },
      data: updateData,
      include: {
        competitor: true,
        insights: true,
      },
    })

    return NextResponse.json({
      success: true,
      landingPage,
    })
  } catch (error) {
    console.error('Error updating landing page:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update landing page' },
      { status: 500 }
    )
  }
}

// DELETE /api/landing-pages/[id] - Delete a landing page
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // First check if the landing page exists
    const existingPage = await prisma.landingPage.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingPage) {
      return NextResponse.json(
        { success: false, error: 'Landing page not found' },
        { status: 404 }
      )
    }

    // Delete related insights first (if any)
    await prisma.insight.deleteMany({
      where: {
        landingPageId: params.id,
      },
    })

    // Delete the landing page
    await prisma.landingPage.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Landing page deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting landing page:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete landing page' },
      { status: 500 }
    )
  }
}
