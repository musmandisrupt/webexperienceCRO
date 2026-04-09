import { chromium, Browser, Page } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

interface ProgressiveCaptureOptions {
  url: string
  competitorId?: string
  deviceType?: 'desktop' | 'mobile' | 'tablet'
  fullPage?: boolean
  outputDir?: string
  scrollDelay?: number
  animationWaitTime?: number
  maxScrollAttempts?: number
}

interface ProgressiveCaptureResult {
  url: string
  title: string
  description?: string
  screenshotPath: string
  copiedText: string
  techStack: string[]
  visualSections: any[]
  contentHierarchy: any[]
  scrollProgress: {
    totalScrolls: number
    contentLoaded: boolean
    animationsComplete: boolean
  }
}

export class ProgressivePageCapture {
  private browser: Browser | null = null

  async initialize() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--disable-default-apps',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-sync',
          '--disable-translate',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-blink-features=AutomationControlled'
        ]
      })
    }
  }

  async capture(options: ProgressiveCaptureOptions): Promise<ProgressiveCaptureResult> {
    const {
      scrollDelay = 1000,
      animationWaitTime = 2000,
      maxScrollAttempts = 10
    } = options

    await this.initialize()
    const context = await this.browser!.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })

    const page = await context.newPage()

    try {
      // Navigate to the page
      await page.goto(options.url, {
        waitUntil: 'load',
        timeout: 30000,
      })

      // Initial wait for basic content
      await page.waitForTimeout(3000)

      // Progressive scrolling and content loading
      const scrollProgress = await this.progressiveScroll(page, {
        scrollDelay,
        animationWaitTime,
        maxScrollAttempts
      })

      // Take screenshot after progressive loading
      const outputDir = options.outputDir || path.join(process.cwd(), 'public', 'screenshots')
      await fs.promises.mkdir(outputDir, { recursive: true })
      
      const timestamp = Date.now()
      const screenshotFilename = `${timestamp}-progressive-${this.sanitizeFilename(options.url)}.png`
      const screenshotPath = path.join(outputDir, screenshotFilename)

      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
        type: 'png',
      })

      // Extract content after progressive loading
      const title = await page.title()
      let description: string | undefined
      try {
        description = await page.locator('meta[name="description"]').getAttribute('content', { timeout: 5000 }) || undefined
      } catch (e) {
        console.warn('Failed to extract meta description:', e)
        description = undefined
      }

      const copiedText = await this.extractTextContent(page)
      const visualSections = await this.detectVisualSections(page)
      const contentHierarchy = await this.analyzeContentHierarchy(page)

      return {
        url: options.url,
        title,
        description,
        screenshotPath: `/screenshots/${screenshotFilename}`,
        copiedText,
        techStack: [],
        visualSections,
        contentHierarchy,
        scrollProgress
      }

    } finally {
      await page.close()
    }
  }

  private async progressiveScroll(page: Page, options: {
    scrollDelay: number
    animationWaitTime: number
    maxScrollAttempts: number
  }): Promise<{ totalScrolls: number; contentLoaded: boolean; animationsComplete: boolean }> {
    const { scrollDelay, animationWaitTime, maxScrollAttempts } = options
    
    let totalScrolls = 0
    let contentLoaded = false
    let animationsComplete = false

    try {
      // Get initial page height
      const initialHeight = await page.evaluate(() => document.body.scrollHeight)
      console.log(`Initial page height: ${initialHeight}px`)

      // Progressive scroll through the page
      for (let attempt = 0; attempt < maxScrollAttempts; attempt++) {
        console.log(`Scroll attempt ${attempt + 1}/${maxScrollAttempts}`)

        // Scroll down progressively
        await page.evaluate(() => {
          const scrollStep = window.innerHeight * 0.8 // Scroll 80% of viewport height
          window.scrollBy(0, scrollStep)
        })

        totalScrolls++
        await page.waitForTimeout(scrollDelay)

        // Check if we've reached the bottom
        const currentScrollY = await page.evaluate(() => window.scrollY)
        const viewportHeight = await page.evaluate(() => window.innerHeight)
        const documentHeight = await page.evaluate(() => document.body.scrollHeight)

        if (currentScrollY + viewportHeight >= documentHeight - 100) {
          console.log('Reached bottom of page')
          break
        }

        // Wait for any animations or content to load
        await page.waitForTimeout(animationWaitTime)

        // Check for new content being added
        const newHeight = await page.evaluate(() => document.body.scrollHeight)
        if (newHeight > initialHeight) {
          console.log(`New content detected! Height increased from ${initialHeight}px to ${newHeight}px`)
          // Continue scrolling to load more content
          continue
        }

        // Check if animations are still running
        const hasActiveAnimations = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'))
          for (const el of elements) {
            const style = window.getComputedStyle(el)
            if (style.animationPlayState === 'running' || 
                style.transitionDuration !== '0s' ||
                el.classList.contains('animate') ||
                el.classList.contains('fade-in') ||
                el.classList.contains('slide-in')) {
              return true
            }
          }
          return false
        })

        if (hasActiveAnimations) {
          console.log('Animations still running, waiting...')
          await page.waitForTimeout(animationWaitTime)
        }
      }

      // Final scroll to top and wait for any final animations
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.waitForTimeout(animationWaitTime)

      // Check final content state
      const finalHeight = await page.evaluate(() => document.body.scrollHeight)
      contentLoaded = finalHeight >= initialHeight
      animationsComplete = true

      console.log(`Progressive scroll complete. Final height: ${finalHeight}px, Content loaded: ${contentLoaded}`)

    } catch (error) {
      console.error('Error during progressive scroll:', error)
      // Set default values on error
      contentLoaded = false
      animationsComplete = false
    }

    return { totalScrolls, contentLoaded, animationsComplete }
  }

  private async extractTextContent(page: Page): Promise<string> {
    try {
      // Extract main content areas using Playwright selectors
      const contentSelectors = [
        'main',
        '.main-content',
        '.content',
        'article',
        '.hero',
        '.hero-section',
        'h1, h2, h3',
        'p'
      ]
      
      let allText = ''
      
      for (const selector of contentSelectors) {
        try {
          const elements = await page.locator(selector).all()
          for (const element of elements) {
            const text = await element.textContent()
            if (text && text.trim()) {
              allText += text.trim() + '\n'
            }
          }
        } catch (e) {
          // Continue if selector fails
        }
      }
      
      // Clean up the text
      return allText
        .replace(/\n\s*\n/g, '\n')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 5000)
    } catch (error) {
      console.warn('Failed to extract text content:', error)
      return 'Text extraction failed'
    }
  }

  private async detectVisualSections(page: Page): Promise<any[]> {
    // Simplified version for now
    try {
      const sections = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          .map(h => ({
            id: h.id || `heading-${Math.random().toString(36).substr(2, 9)}`,
            type: 'Heading',
            title: h.textContent?.trim() || '',
            content: h.textContent?.trim() || '',
            confidence: 0.8,
            position: {
              top: h.getBoundingClientRect().top + window.scrollY,
              height: h.getBoundingClientRect().height
            },
            elements: [h.tagName.toLowerCase()],
            tags: ['heading', 'content']
          }))
        
        return headings
      })
      
      return sections
    } catch (error) {
      console.error('Error detecting visual sections:', error)
      return []
    }
  }

  private async analyzeContentHierarchy(page: Page): Promise<any> {
    try {
      const hierarchy = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          .map(h => ({
            level: parseInt(h.tagName.charAt(1)),
            text: h.textContent?.trim() || '',
            position: h.getBoundingClientRect().top + window.scrollY
          }))
          .filter(h => h.text.length > 0)

        return {
          headings,
          ctaElements: [],
          forms: [],
          totalSections: headings.length
        }
      })
      
      return hierarchy
    } catch (error) {
      console.error('Error analyzing content hierarchy:', error)
      return { headings: [], ctaElements: [], forms: [], totalSections: 0 }
    }
  }

  private sanitizeFilename(url: string): string {
    return url
      .replace(/^https?:\/\//, '')
      .replace(/[^a-zA-Z0-9.-]/g, '-')
      .substring(0, 100)
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}

// Export singleton instance
export const progressivePageCapture = new ProgressivePageCapture()
