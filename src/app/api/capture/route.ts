import { NextRequest, NextResponse } from 'next/server'
import { pageCapture } from '@/lib/capture'
import { firecrawlCapture } from '@/lib/firecrawl-capture'
import { prisma } from '@/lib/prisma'
import type { CaptureResult } from '@/types'

export async function POST(request: NextRequest) {
  const requestId = `capture-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  try {
    let body
    try { body = await request.json() } catch {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
    }

    const { url, competitorId, deviceType = 'desktop', fullPage = true, progressive = false } = body

    if (!url) return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 })
    try { new URL(url) } catch {
      return NextResponse.json({ success: false, error: 'Invalid URL format' }, { status: 400 })
    }

    console.log(`[${requestId}] Starting capture for ${url}`)

    let captureResult: CaptureResult
    let captureMethod = 'playwright'
    const hasFirecrawlKey = !!process.env.FIRECRAWL_API_KEY

    if (hasFirecrawlKey) {
      // Firecrawl is primary — better screenshots for animated/JS-heavy pages
      try {
        console.log(`[${requestId}] Using Firecrawl (primary)...`)
        const fcResult = await firecrawlCapture({
          url, deviceType, fullPage,
          waitFor: progressive ? 8000 : 5000,
        })
        captureResult = {
          url: fcResult.url,
          title: fcResult.title,
          description: fcResult.description,
          screenshotPath: fcResult.screenshotPath,
          copiedText: fcResult.copiedText,
          techStack: fcResult.techStack,
          visualSections: fcResult.visualSections,
          contentHierarchy: fcResult.contentHierarchy,
        }
        captureMethod = 'firecrawl'
        console.log(`[${requestId}] Firecrawl succeeded`)
      } catch (fcError) {
        console.warn(`[${requestId}] Firecrawl failed:`, fcError instanceof Error ? fcError.message : fcError)
        // Try Playwright fallback only if available
        try {
          captureResult = await pageCapture.capture({ url, deviceType, fullPage, progressive })
          captureMethod = 'playwright-fallback'
        } catch (pwError) {
          throw new Error(`Firecrawl failed: ${fcError instanceof Error ? fcError.message : 'Unknown'}. Playwright also unavailable: ${pwError instanceof Error ? pwError.message : 'Unknown'}`)
        }
      }
    } else {
      // No Firecrawl key — try Playwright
      try {
        console.log(`[${requestId}] No FIRECRAWL_API_KEY, using Playwright`)
        captureResult = await pageCapture.capture({ url, deviceType, fullPage, progressive })
        captureMethod = 'playwright'
      } catch (pwError) {
        throw new Error('No FIRECRAWL_API_KEY configured and Playwright is not available. Please set FIRECRAWL_API_KEY in environment variables.')
      }
    }

    console.log(`[${requestId}] Capture done. Method: ${captureMethod}, Title: ${captureResult.title}`)

    // Save to database
    const landingPageData: any = {
      url: captureResult.url,
      title: captureResult.title,
      description: captureResult.description,
      screenshotUrl: captureResult.screenshotPath,
      copiedText: captureResult.copiedText,
      techStack: JSON.stringify(captureResult.techStack),
      visualSections: captureResult.visualSections ? JSON.stringify(captureResult.visualSections) : null,
      contentHierarchy: captureResult.contentHierarchy ? JSON.stringify(captureResult.contentHierarchy) : null,
      capturedAt: new Date(),
      updatedAt: new Date(),
    }

    if (competitorId) landingPageData.competitorId = competitorId

    const landingPage = await prisma.landingPage.create({
      data: landingPageData,
      include: competitorId ? { competitor: true } : undefined,
    })

    return NextResponse.json({
      success: true,
      captureResult: { ...captureResult, landingPageId: landingPage.id, captureMethod, semanticAnalysis: null },
    })

  } catch (error) {
    console.error(`[${requestId}] Capture failed:`, error instanceof Error ? error.message : error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error', requestId },
      { status: 500 }
    )
  }
}
