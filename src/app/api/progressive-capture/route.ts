import { NextRequest, NextResponse } from 'next/server'
import { progressivePageCapture } from '@/lib/progressive-capture'

export async function POST(request: NextRequest) {
  const requestId = `progressive-capture-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  try {
    console.log(`Progressive capture request started { requestId: '${requestId}' }`)
    
    const body = await request.json()
    console.log(`Request body parsed successfully { requestId: '${requestId}', body: ${JSON.stringify(body)} }`)
    
    const { url, competitorId, deviceType = 'desktop', fullPage = true } = body
    
    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      )
    }

    console.log(`Starting progressive page capture { requestId: '${requestId}', url: '${url}', competitorId: '${competitorId}', deviceType: '${deviceType}', fullPage: ${fullPage} }`)

    // Use progressive capture with enhanced scrolling
    const captureResult = await progressivePageCapture.capture({
      url,
      competitorId,
      deviceType,
      fullPage,
      scrollDelay: 1500,        // 1.5 seconds between scrolls
      animationWaitTime: 3000,  // 3 seconds for animations
      maxScrollAttempts: 15     // More scroll attempts for complex pages
    })

    console.log(`Progressive page capture completed { requestId: '${requestId}', captureResult: { url: '${captureResult.url}', title: '${captureResult.title}', screenshotPath: '${captureResult.screenshotPath}' } }`)

    // For now, just return the result without saving to database
    // We can add database integration later if the progressive capture works well
    
    return NextResponse.json({
      success: true,
      requestId,
      captureResult,
      scrollProgress: captureResult.scrollProgress,
      message: 'Progressive capture completed successfully'
    })

  } catch (error) {
    console.error(`Progressive capture request failed ${error} { requestId: '${requestId}', error: '${error instanceof Error ? error.message : String(error)}' }`)
    
    return NextResponse.json(
      { 
        success: false, 
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Progressive capture API endpoint',
    usage: 'POST with { url, competitorId?, deviceType?, fullPage? }'
  })
}
