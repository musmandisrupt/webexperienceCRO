import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const pages = await prisma.landingPage.findMany({
      where: { isOwned: true },
      include: { competitor: true },
      orderBy: { capturedAt: 'desc' },
    })

    return NextResponse.json({ success: true, landingPages: pages })
  } catch (error) {
    console.error('Failed to fetch my pages:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
