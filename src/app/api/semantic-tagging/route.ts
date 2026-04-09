import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Semantic tagging service is temporarily disabled',
    status: 'disabled'
  })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    message: 'Semantic tagging service is temporarily disabled',
    status: 'disabled'
  }, { status: 503 })
}
