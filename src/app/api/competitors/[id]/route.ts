import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if competitor exists
    const competitor = await prisma.competitor.findUnique({
      where: { id: params.id },
      include: {
        landingPages: {
          include: {
            insights: true
          }
        }
      }
    })

    if (!competitor) {
      return NextResponse.json(
        { success: false, error: 'Competitor not found' },
        { status: 404 }
      )
    }

    // Delete all insights first (cascade through landing pages)
    for (const landingPage of competitor.landingPages) {
      await prisma.insight.deleteMany({
        where: { landingPageId: landingPage.id }
      })
    }

    // Delete all landing pages
    await prisma.landingPage.deleteMany({
      where: { competitorId: params.id }
    })

    // Delete the competitor
    await prisma.competitor.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Competitor and all associated data deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting competitor:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete competitor' },
      { status: 500 }
    )
  }
}
