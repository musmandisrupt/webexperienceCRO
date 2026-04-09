import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const filename = params.filename

  // Sanitize filename to prevent path traversal
  if (filename.includes('..') || filename.includes('/')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
  }

  // Try Railway volume first, then local public/screenshots
  const volumePath = path.join('/data/screenshots', filename)
  const publicPath = path.join(process.cwd(), 'public', 'screenshots', filename)

  let filePath = ''
  if (fs.existsSync(volumePath)) {
    filePath = volumePath
  } else if (fs.existsSync(publicPath)) {
    filePath = publicPath
  } else {
    return NextResponse.json({ error: 'Screenshot not found' }, { status: 404 })
  }

  const buffer = fs.readFileSync(filePath)
  const ext = path.extname(filename).toLowerCase()
  const contentType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png'

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
