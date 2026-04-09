import fs from 'fs'
import path from 'path'

interface FirecrawlCaptureOptions {
  url: string
  deviceType?: 'desktop' | 'mobile'
  fullPage?: boolean
  waitFor?: number
}

interface FirecrawlCaptureResult {
  url: string
  title: string
  description: string
  screenshotPath: string
  copiedText: string
  techStack: any[]
  visualSections: any[]
  contentHierarchy: any
  markdown?: string
}

/**
 * Download an image from a URL and save it locally at full quality.
 */
async function downloadImage(imageUrl: string, destPath: string): Promise<void> {
  const fullPath = path.join(process.cwd(), 'public', destPath)
  const dir = path.dirname(fullPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to download image: HTTP ${response.status}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  fs.writeFileSync(fullPath, buffer)
  console.log(`[Firecrawl] Screenshot saved: ${destPath} (${(buffer.length / 1024).toFixed(0)} KB)`)
}

/**
 * Extract visual sections from markdown content.
 */
function extractSectionsFromMarkdown(markdown: string): any[] {
  const sections: any[] = []
  const lines = markdown.split('\n')
  let currentSection: any = null
  let currentContent: string[] = []
  let sectionIndex = 0

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/)
    if (headingMatch) {
      if (currentSection) {
        currentSection.content = currentContent.join('\n').trim()
        sections.push(currentSection)
      }

      sectionIndex++
      const title = headingMatch[2].trim()
      const titleLower = title.toLowerCase()
      let type = 'content'
      let confidence = 0.7

      if (sectionIndex === 1 || titleLower.includes('hero') || headingMatch[1].length === 1) {
        type = 'hero'; confidence = 0.9
      } else if (/pricing|plan|cost|tier/i.test(titleLower)) {
        type = 'pricing'; confidence = 0.85
      } else if (/testimonial|review|customer|said/i.test(titleLower)) {
        type = 'testimonial'; confidence = 0.85
      } else if (/feature|capabilit|what we|how it/i.test(titleLower)) {
        type = 'features'; confidence = 0.8
      } else if (/faq|question|ask/i.test(titleLower)) {
        type = 'faq'; confidence = 0.8
      } else if (/contact|get in touch|reach/i.test(titleLower)) {
        type = 'cta'; confidence = 0.8
      }

      currentSection = {
        id: `section-${sectionIndex}`,
        type, title, content: '', confidence,
        position: { top: sectionIndex * 600, height: 600 },
        elements: [], tags: [type],
      }
      currentContent = []
    } else if (currentSection) {
      currentContent.push(line)
      if (/\[.*?\]\(.*?\)/.test(line)) {
        const m = line.match(/\[(.*?)\]\((.*?)\)/)
        if (m) currentSection.elements.push(`Link: ${m[1]}`)
      }
      if (/!\[.*?\]\(.*?\)/.test(line)) currentSection.elements.push('Image')
    }
  }

  if (currentSection) {
    currentSection.content = currentContent.join('\n').trim()
    sections.push(currentSection)
  }

  return sections
}

/**
 * Extract content hierarchy from markdown.
 */
function extractHierarchyFromMarkdown(markdown: string): any {
  const headings: any[] = []
  const ctaElements: any[] = []
  let position = 0

  for (const line of markdown.split('\n')) {
    position++
    const hm = line.match(/^(#{1,6})\s+(.+)/)
    if (hm) {
      headings.push({
        level: hm[1].length, text: hm[2].trim(), position,
        semanticRole: hm[1].length === 1 ? 'main-title' : hm[1].length === 2 ? 'section-title' : 'subsection-title',
      })
    }

    const ctaMatches = line.match(/\[(.*?)\]\((.*?)\)/g)
    if (ctaMatches) {
      for (const match of ctaMatches) {
        const parts = match.match(/\[(.*?)\]\((.*?)\)/)
        if (parts && /get started|sign up|try|demo|contact|buy|subscribe|download|start|join/i.test(parts[1])) {
          ctaElements.push({
            text: parts[1],
            type: /get started|sign up|start|try|join/i.test(parts[1]) ? 'primary' : 'secondary',
            position,
          })
        }
      }
    }
  }

  return { headings, ctaElements, forms: [], totalSections: headings.filter(h => h.level <= 2).length }
}

/**
 * Capture a page using the Firecrawl REST API directly (no SDK — avoids undici compatibility issues).
 */
export async function firecrawlCapture(options: FirecrawlCaptureOptions): Promise<FirecrawlCaptureResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY is not set')
  }

  console.log(`[Firecrawl] Scraping ${options.url}...`)

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url: options.url,
      formats: ['markdown', 'screenshot@fullPage'],
      waitFor: 10000,
      timeout: 60000,
      mobile: options.deviceType === 'mobile',
      ...(options.deviceType === 'mobile' && {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        },
      }),
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Firecrawl API error (${response.status}): ${errText.substring(0, 200)}`)
  }

  const result = await response.json()

  if (!result.success) {
    throw new Error(`Firecrawl scrape failed: ${result.error || 'Unknown error'}`)
  }

  const data = result.data || result
  console.log(`[Firecrawl] Scrape complete. Title: ${data.metadata?.title || 'N/A'}`)

  // Save screenshot — try volume (/data/screenshots) first, then public/, then use remote URL
  let screenshotPath = ''
  const screenshotUrl = data.screenshot || ''
  if (screenshotUrl) {
    const sanitizedUrl = options.url.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9.-]/g, '-').substring(0, 80)
    const filename = `${Date.now()}-${sanitizedUrl}.png`

    // Try Railway volume first
    const volumeDir = '/data/screenshots'
    const publicDir = path.join(process.cwd(), 'public', 'screenshots')

    try {
      if (fs.existsSync('/data') || process.env.RAILWAY_VOLUME_MOUNT_PATH) {
        // Railway volume available
        if (!fs.existsSync(volumeDir)) fs.mkdirSync(volumeDir, { recursive: true })
        const response = await fetch(screenshotUrl)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const buffer = Buffer.from(await response.arrayBuffer())
        fs.writeFileSync(path.join(volumeDir, filename), buffer)
        screenshotPath = `/api/screenshots/${filename}`
        console.log(`[Firecrawl] Screenshot saved to volume: ${volumeDir}/${filename} (${(buffer.length / 1024).toFixed(0)} KB)`)
      } else {
        // Local dev — save to public/
        await downloadImage(screenshotUrl, `/screenshots/${filename}`)
        screenshotPath = `/screenshots/${filename}`
        console.log(`[Firecrawl] Screenshot saved locally: ${screenshotPath}`)
      }
    } catch (err) {
      // All saves failed — use remote URL
      screenshotPath = screenshotUrl
      console.log(`[Firecrawl] Using remote screenshot URL: ${screenshotUrl.substring(0, 80)}...`)
    }
  }

  const markdown = data.markdown || ''
  const title = data.metadata?.title || ''
  const description = data.metadata?.description || data.metadata?.ogDescription || ''

  return {
    url: options.url,
    title,
    description,
    screenshotPath,
    copiedText: markdown.substring(0, 10000),
    techStack: [],
    visualSections: extractSectionsFromMarkdown(markdown),
    contentHierarchy: extractHierarchyFromMarkdown(markdown),
    markdown,
  }
}
