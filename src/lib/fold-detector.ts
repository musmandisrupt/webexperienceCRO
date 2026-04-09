/**
 * DOM-based fold detection using HTML structure analysis.
 *
 * Instead of dividing the page equally, this analyzes the actual HTML structure
 * to find real section boundaries using semantic elements and heading hierarchy.
 */

export interface FoldBoundary {
  foldIndex: number
  title: string
  type: string        // hero, features, testimonial, pricing, cta, faq, footer, content
  pixelStart: number
  pixelEnd: number
  estimatedHeight: number
}

interface DetectedSection {
  tag: string
  heading?: string
  childCount: number
  estimatedHeight: number
}

/**
 * Estimate fold boundaries from HTML content.
 * Uses heading tags and semantic sections to determine real fold breaks.
 */
export function detectFoldsFromHTML(html: string, totalScreenshotHeight: number): FoldBoundary[] {
  const sections = parseHTMLSections(html)

  if (sections.length === 0) {
    // Fallback: equal division
    return createEqualFolds(totalScreenshotHeight, 5)
  }

  // Distribute total height proportionally based on section content weight
  const totalWeight = sections.reduce((sum, s) => sum + s.estimatedHeight, 0)
  const folds: FoldBoundary[] = []
  let currentPixel = 0

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]
    const proportion = section.estimatedHeight / totalWeight
    const height = Math.round(totalScreenshotHeight * proportion)

    folds.push({
      foldIndex: i + 1,
      title: section.heading || `Section ${i + 1}`,
      type: classifySectionType(section.heading || '', i, sections.length),
      pixelStart: currentPixel,
      pixelEnd: currentPixel + height,
      estimatedHeight: height,
    })

    currentPixel += height
  }

  // Adjust last fold to reach the end
  if (folds.length > 0) {
    folds[folds.length - 1].pixelEnd = totalScreenshotHeight
    folds[folds.length - 1].estimatedHeight = totalScreenshotHeight - folds[folds.length - 1].pixelStart
  }

  return folds
}

/**
 * Detect folds from markdown content (used when HTML isn't available).
 * Uses heading hierarchy to identify section boundaries.
 */
export function detectFoldsFromMarkdown(markdown: string, totalScreenshotHeight: number): FoldBoundary[] {
  const lines = markdown.split('\n')
  const headings: Array<{ level: number; text: string; lineIndex: number }> = []

  lines.forEach((line, idx) => {
    const match = line.match(/^(#{1,3})\s+(.+)/)
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        lineIndex: idx,
      })
    }
  })

  if (headings.length === 0) {
    return createEqualFolds(totalScreenshotHeight, 5)
  }

  // Use top-level headings (h1, h2) as fold boundaries
  const foldHeadings = headings.filter(h => h.level <= 2)
  if (foldHeadings.length === 0) {
    return createEqualFolds(totalScreenshotHeight, Math.min(headings.length, 8))
  }

  const totalLines = lines.length
  const folds: FoldBoundary[] = []

  for (let i = 0; i < foldHeadings.length; i++) {
    const current = foldHeadings[i]
    const nextLineIndex = i < foldHeadings.length - 1 ? foldHeadings[i + 1].lineIndex : totalLines

    // Content weight = number of non-empty lines in this section
    const sectionLines = lines.slice(current.lineIndex, nextLineIndex)
    const contentLines = sectionLines.filter(l => l.trim().length > 0).length

    // Estimate height based on content density
    // More content = taller section, but with diminishing returns
    const baseHeight = 300 // minimum section height
    const contentHeight = Math.min(contentLines * 40, 1500) // cap per section

    folds.push({
      foldIndex: i + 1,
      title: current.text,
      type: classifySectionType(current.text, i, foldHeadings.length),
      pixelStart: 0, // will be recalculated
      pixelEnd: 0,
      estimatedHeight: baseHeight + contentHeight,
    })
  }

  // Distribute total height proportionally
  const totalEstimated = folds.reduce((sum, f) => sum + f.estimatedHeight, 0)
  let pixel = 0

  for (const fold of folds) {
    const proportion = fold.estimatedHeight / totalEstimated
    const actualHeight = Math.round(totalScreenshotHeight * proportion)
    fold.pixelStart = pixel
    fold.pixelEnd = pixel + actualHeight
    fold.estimatedHeight = actualHeight
    pixel += actualHeight
  }

  if (folds.length > 0) {
    folds[folds.length - 1].pixelEnd = totalScreenshotHeight
    folds[folds.length - 1].estimatedHeight = totalScreenshotHeight - folds[folds.length - 1].pixelStart
  }

  return folds
}

/**
 * Parse HTML to find semantic sections.
 */
function parseHTMLSections(html: string): DetectedSection[] {
  const sections: DetectedSection[] = []

  // Match <section>, <article>, <header>, <footer>, <main>, <aside>, and div with section-like classes
  const sectionRegex = /<(section|article|header|footer|main|aside|div)\b[^>]*(?:class="[^"]*(?:section|fold|block|hero|feature|testimonial|pricing|cta|faq|footer|banner|container)[^"]*")[^>]*>([\s\S]*?)(?=<\/\1>|<(?:section|article|header|footer|main|aside)\b)/gi

  let match
  while ((match = sectionRegex.exec(html)) !== null) {
    const tag = match[1]
    const content = match[2]

    // Find first heading in this section
    const headingMatch = content.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i)
    const heading = headingMatch
      ? headingMatch[1].replace(/<[^>]+>/g, '').trim()
      : undefined

    // Count child elements as a weight proxy
    const childTags = content.match(/<[a-z]/gi)
    const childCount = childTags ? childTags.length : 1

    // Estimate height: more children = taller section
    const hasImage = /<img /i.test(content)
    const hasList = /<[ou]l/i.test(content)
    const baseHeight = 300
    const imageBonus = hasImage ? 400 : 0
    const listBonus = hasList ? 200 : 0
    const childBonus = Math.min(childCount * 10, 500)

    sections.push({
      tag,
      heading,
      childCount,
      estimatedHeight: baseHeight + imageBonus + listBonus + childBonus,
    })
  }

  // Fallback: if no semantic sections found, use h2 tags as boundaries
  if (sections.length === 0) {
    const h2Regex = /<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi
    let h2Match
    while ((h2Match = h2Regex.exec(html)) !== null) {
      const text = h2Match[1].replace(/<[^>]+>/g, '').trim()
      if (text.length > 0) {
        sections.push({
          tag: 'h2-section',
          heading: text,
          childCount: 10,
          estimatedHeight: 600,
        })
      }
    }
  }

  return sections
}

/**
 * Classify section type from heading text and position.
 */
function classifySectionType(heading: string, index: number, total: number): string {
  const h = heading.toLowerCase()

  if (index === 0) return 'hero'
  if (index === total - 1 && total > 2) return 'footer'

  if (/pricing|plan|cost|tier|package/i.test(h)) return 'pricing'
  if (/testimonial|review|customer|said|stories|success/i.test(h)) return 'testimonial'
  if (/feature|capabilit|what we|how it|product|solution/i.test(h)) return 'features'
  if (/faq|question|ask|help/i.test(h)) return 'faq'
  if (/contact|get in touch|reach|demo|start|sign up|try/i.test(h)) return 'cta'
  if (/about|who we|our (story|mission|team)|company/i.test(h)) return 'about'
  if (/integrat|partner|work with|trusted|logo/i.test(h)) return 'social-proof'
  if (/benefit|why|advantage|value/i.test(h)) return 'benefits'
  if (/how|process|step|work/i.test(h)) return 'how-it-works'

  return 'content'
}

/**
 * Create equal-height fallback folds.
 */
function createEqualFolds(totalHeight: number, count: number): FoldBoundary[] {
  const foldHeight = Math.round(totalHeight / count)
  return Array.from({ length: count }, (_, i) => ({
    foldIndex: i + 1,
    title: `Section ${i + 1}`,
    type: i === 0 ? 'hero' : i === count - 1 ? 'footer' : 'content',
    pixelStart: i * foldHeight,
    pixelEnd: Math.min((i + 1) * foldHeight, totalHeight),
    estimatedHeight: foldHeight,
  }))
}
