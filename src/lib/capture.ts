import { chromium, Browser, Page } from 'playwright'
import path from 'path'
import fs from 'fs/promises'
import type { CaptureResult, TechStackItem, VisualSection, ContentHierarchy } from '@/types'

interface CaptureOptions {
  url: string
  outputDir?: string
  fullPage?: boolean
  deviceType?: 'desktop' | 'mobile'
  progressive?: boolean
}

export class PageCapture {
  private browser: Browser | null = null

  async initialize() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true, // Reverted to headless for stability
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
          '--hide-scrollbars',
          '--mute-audio',
          '--no-default-browser-check',
          '--safebrowsing-disable-auto-update',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-blink-features=AutomationControlled',
          // Enhanced animation support
          '--enable-features=NetworkService,NetworkServiceLogging',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
          '--disable-client-side-phishing-detection',
          '--disable-component-extensions-with-background-pages',
          '--disable-default-apps',
          '--disable-domain-reliability',
          '--disable-extensions',
          '--disable-features=TranslateUI,BlinkGenPropertyTrees',
          '--disable-hang-monitor',
          '--disable-ipc-flooding-protection',
          '--disable-popup-blocking',
          '--disable-prompt-on-repost',
          '--disable-sync',
          '--disable-translate',
          '--disable-windows10-custom-titlebar',
          '--metrics-recording-only',
          '--no-first-run',
          '--safebrowsing-disable-auto-update',
          '--enable-automation',
          '--password-store=basic',
          '--use-mock-keychain',
          // Animation and rendering improvements
          '--enable-gpu-rasterization',
          '--enable-zero-copy',
          '--ignore-gpu-blacklist',
          '--ignore-gpu-blocklist',
          '--enable-features=VaapiVideoDecoder',
          '--disable-features=TranslateUI',
          '--force-color-profile=srgb',
          '--disable-features=VizDisplayCompositor'
        ]
      })
    }
  }

  async capture(options: CaptureOptions): Promise<CaptureResult> {
    await this.initialize()
    
    if (!this.browser) {
      throw new Error('Failed to initialize browser')
    }

    const page = await this.browser.newPage()
    
    try {
      // Set realistic user agent
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      })

      // Set viewport based on device type with animation support
      if (options.deviceType === 'mobile') {
        await page.setViewportSize({ width: 375, height: 812 })
      } else {
        await page.setViewportSize({ width: 1920, height: 1080 })
      }

      // Set device scale factor for better animation rendering
      await page.evaluate(() => {
        Object.defineProperty(window, 'devicePixelRatio', {
          get: () => 1
        })
      })

      // Set additional page properties to appear more human-like
      await page.addInitScript(() => {
        // Override webdriver property
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        })
        
        // Override plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        })
        
        // Override languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        })
        
        // Override permissions
        const originalQuery = window.navigator.permissions.query
        window.navigator.permissions.query = (parameters: any) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission } as any) :
            originalQuery(parameters)
        )

        // Override chrome runtime
        if ((window as any).chrome) {
          Object.defineProperty((window as any).chrome, 'runtime', {
            get: () => undefined,
          })
        }

        // Override automation properties
        Object.defineProperty(navigator, 'automation', {
          get: () => undefined,
        })

        // Override connection
        Object.defineProperty(navigator, 'connection', {
          get: () => ({
            effectiveType: '4g',
            rtt: 50,
            downlink: 10,
            saveData: false
          }),
        })

        // Override hardware concurrency
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          get: () => 8,
        })

        // Override device memory
        Object.defineProperty(navigator, 'deviceMemory', {
          get: () => 8,
        })

        // Override maxTouchPoints
        Object.defineProperty(navigator, 'maxTouchPoints', {
          get: () => 0,
        })

        // Override userAgentData
        if ((navigator as any).userAgentData) {
          Object.defineProperty((navigator as any), 'userAgentData', {
            get: () => ({
              brands: [
                { brand: 'Google Chrome', version: '120' },
                { brand: 'Chromium', version: '120' },
                { brand: 'Not=A?Brand', version: '99' }
              ],
              mobile: false,
              platform: 'macOS'
            }),
          })
        }
      })

      // Navigate to the page with more realistic settings
      await page.goto(options.url, {
        waitUntil: 'load', // Changed to 'load' to wait for all resources (CSS, JS, images)
        timeout: 30000,
      })

      // Wait a bit for any dynamic content to load
      await page.waitForTimeout(3000)

      // Try to handle common bot detection challenges
      try {
        // Look for and handle common challenge elements
        const challengeSelectors = [
          'iframe[src*="challenge"]',
          'iframe[src*="captcha"]',
          'iframe[src*="security"]',
          '.challenge',
          '.captcha',
          '#challenge',
          '#captcha'
        ]
        
        for (const selector of challengeSelectors) {
          const frames = page.frames()
          const challengeFrames = frames.filter(frame => 
            frame.url().includes('challenge') || 
            frame.url().includes('captcha') || 
            frame.url().includes('security')
          )
          
          if (challengeFrames.length > 0) {
            console.log('Detected challenge frame, waiting for resolution...')
            // Wait longer for challenge resolution
            await page.waitForTimeout(5000)
            break
          }
        }
      } catch (e) {
        console.log('No challenge frames detected or error handling challenges:', e)
      }

      // Additional wait for any remaining dynamic content
      await page.waitForTimeout(2000)

      // Wait for page to be fully stable and rendered
      try {
        // Wait for network to be mostly idle (but not completely)
        await page.waitForLoadState('networkidle', { timeout: 10000 })
      } catch (e) {
        console.log('Network not completely idle, continuing with screenshot...')
      }

      // Additional wait to ensure all animations and dynamic content are complete
      await page.waitForTimeout(2000)

      // Progressive loading logic (if enabled)
      if (options.progressive) {
        console.log('Starting progressive loading...')
        await this.progressiveScroll(page)
        console.log('Progressive loading completed')
      }

      // Take screenshot FIRST - before any page modifications
      const outputDir = options.outputDir || path.join(process.cwd(), 'public', 'screenshots')
      await fs.mkdir(outputDir, { recursive: true })
      
      const timestamp = Date.now()
      const screenshotFilename = `${timestamp}-${this.sanitizeFilename(options.url)}.png`
      const screenshotPath = path.join(outputDir, screenshotFilename)
      
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
        type: 'png',
      })

      // Extract page content using Playwright's built-in methods
      const title = await page.title()
      
      // Extract description with timeout and fallback
      let description: string | undefined
      try {
        description = await page.locator('meta[name="description"]').getAttribute('content', { timeout: 5000 }) || undefined
      } catch (e) {
        console.warn('Failed to extract meta description:', e)
        description = undefined
      }
      
      // Extract text content using Playwright instead of cheerio
      const copiedText = await this.extractTextContent(page)
      
      // NEW: Detect visual sections and content hierarchy
      const visualSections = await this.detectVisualSections(page)
      const contentHierarchy = await this.analyzeContentHierarchy(page)

      return {
        url: options.url,
        title,
        description,
        screenshotPath: `/screenshots/${screenshotFilename}`,
        copiedText,
        techStack: [], // Disabled tech stack detection
        visualSections, // NEW: Visual section analysis
        contentHierarchy, // NEW: Content hierarchy analysis
      }
    } finally {
      await page.close()
    }
  }

  private async extractTextContent(page: Page): Promise<string> {
    try {
    // Remove scripts, styles, and other non-content elements
      await page.evaluate(() => {
        const elementsToRemove = document.querySelectorAll('script, style, nav, footer, .nav, .navbar, .footer')
        elementsToRemove.forEach(el => el.remove())
      })
    
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

  // NEW: Detect visual sections and folds
  private async detectVisualSections(page: Page): Promise<VisualSection[]> {
    try {
      const sections = await page.evaluate(() => {
        const visualSections: Array<{
          id: string
          type: string
          title: string
          content: string
          confidence: number
          position: { top: number; height: number }
          elements: string[]
          tags: string[]
        }> = []

        // Helper functions for content analysis
        const extractTitle = (container: Element): string => {
          // Look for headings first
          const heading = container.querySelector('h1, h2, h3, h4, h5, h6')
          if (heading) return heading.textContent?.trim() || ''
          
          // Look for strong/bold text
          const strong = container.querySelector('strong, b')
          if (strong) return strong.textContent?.trim() || ''
          
          // Look for first paragraph with meaningful text
          const firstP = container.querySelector('p')
          if (firstP && firstP.textContent && firstP.textContent.trim().length > 10) {
            return firstP.textContent.trim().substring(0, 60) + '...'
          }
          
          return ''
        }

        const extractContent = (container: Element): string => {
          const textContent = container.textContent?.trim() || ''
          return textContent.length > 200 ? textContent.substring(0, 200) + '...' : textContent
        }

        const classifySectionType = (container: Element, title: string, content: string): string => {
          const className = container.className.toLowerCase()
          const id = container.id.toLowerCase()
          const text = (title + ' ' + content).toLowerCase()
          
          // Check for specific section types
          if (className.includes('hero') || className.includes('banner') || text.includes('hero') || text.includes('banner')) return 'Hero'
          if (className.includes('header') || className.includes('nav') || id.includes('header') || id.includes('nav')) return 'Header'
          if (className.includes('footer') || id.includes('footer')) return 'Footer'
          if (className.includes('cta') || className.includes('button') || text.includes('get started') || text.includes('start now')) return 'CTA'
          if (className.includes('form') || container.querySelector('form, input, button')) return 'Form'
          if (className.includes('testimonial') || className.includes('quote') || text.includes('says') || text.includes('ceo')) return 'Testimonial'
          if (className.includes('stats') || className.includes('metrics') || text.includes('%') || text.includes('percent')) return 'Statistics'
          if (className.includes('grid') || className.includes('cards') || className.includes('features')) return 'Feature Grid'
          if (className.includes('benefits') || text.includes('benefit') || text.includes('advantage')) return 'Benefits'
          if (className.includes('integration') || text.includes('integration') || text.includes('api')) return 'Integration'
          if (className.includes('pricing') || text.includes('pricing') || text.includes('cost')) return 'Pricing'
          if (className.includes('partners') || text.includes('partner') || text.includes('logo')) return 'Partners'
          
          // Default classification based on content
          if (title.length > 0 && content.length > 100) return 'Content Section'
          if (container.querySelector('ul, ol')) return 'List Section'
          if (container.querySelector('img, svg')) return 'Media Section'
          
          return 'Content'
        }

        const calculateConfidence = (container: Element, type: string): number => {
          const className = container.className.toLowerCase()
          const id = container.id.toLowerCase()
          const textContent = container.textContent?.trim()
          const hasContent = textContent && textContent.length > 30
          const hasRelevantClass = className.includes(type.toLowerCase().replace(' ', ''))
          const hasRelevantId = id.includes(type.toLowerCase().replace(' ', ''))
          
          if (hasRelevantClass && hasRelevantId && hasContent) return 0.95
          if ((hasRelevantClass || hasRelevantId) && hasContent) return 0.85
          if (hasRelevantClass || hasRelevantId) return 0.75
          if (hasContent) return 0.65
          return 0.5
        }

        const getSectionElements = (container: Element): string[] => {
          const elements: string[] = []
          const tags = container.querySelectorAll('*')
          tags.forEach(tag => {
            if (tag.tagName && !elements.includes(tag.tagName.toLowerCase())) {
              elements.push(tag.tagName.toLowerCase())
            }
          })
          return elements.slice(0, 5) // Limit to first 5 element types
        }

        // Enhanced selectors for better section detection
        const selectors = [
          // Major structural sections
          'section, .section, [class*="section"]',
          // Hero and banner sections
          '.hero, .banner, [class*="hero"], [class*="banner"]',
          // Content blocks
          '.content, .content-block, [class*="content"]',
          // Feature grids and cards
          '.features, .feature-grid, .cards, .card-grid, [class*="feature"], [class*="card"]',
          // Benefits and advantages
          '.benefits, .advantages, [class*="benefit"], [class*="advantage"]',
          // Statistics and metrics
          '.stats, .metrics, .statistics, [class*="stat"], [class*="metric"]',
          // Testimonials and quotes
          '.testimonials, .quotes, .reviews, [class*="testimonial"], [class*="quote"]',
          // Integration and API sections
          '.integration, .api, .developers, [class*="integration"], [class*="api"]',
          // Pricing sections
          '.pricing, .plans, [class*="pricing"], [class*="plan"]',
          // Partner and logo sections
          '.partners, .logos, .clients, [class*="partner"], [class*="logo"]',
          // CTA sections
          '.cta, .call-to-action, [class*="cta"]',
          // Form sections
          '.form, .contact-form, [class*="form"]',
          // Main content areas
          'main, article, .main, .article',
          // Generic content blocks
          '.block, .container, [class*="block"], [class*="container"]'
        ]

        // Collect all potential sections
        const allContainers = new Set<Element>()
        selectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector)
            elements.forEach(el => allContainers.add(el))
          } catch (e) {
            // Skip invalid selectors
          }
        })

        // Convert to array and filter
        const containers = Array.from(allContainers)
          .filter(container => {
            const rect = container.getBoundingClientRect()
            const hasSize = rect.width > 100 && rect.height > 50
            const isVisible = rect.top >= 0 && rect.left >= 0
            const hasContent = container.textContent && container.textContent.trim().length > 20
            return hasSize && isVisible && hasContent
          })
          .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)

        // Process each container
        containers.forEach((container, index) => {
          const rect = container.getBoundingClientRect()
          const title = extractTitle(container)
          const content = extractContent(container)
          const type = classifySectionType(container, title, content)
          const confidence = calculateConfidence(container, type)
          const elements = getSectionElements(container)
          
          // Only add sections with meaningful content
          if (content.length > 20 || title.length > 0) {
            visualSections.push({
              id: `section-${index}`,
              type,
              title,
              content,
              confidence,
              position: {
                top: rect.top + window.scrollY,
                height: rect.height
              },
              elements,
              tags: [type.toLowerCase(), 'content']
            })
          }
        })

        // If no sections found, create sections based on content density
        if (visualSections.length === 0) {
          const createContentBasedSections = () => {
            const sections: Array<{
              id: string
              type: string
              title: string
              content: string
              confidence: number
              position: { top: number; height: number }
              elements: string[]
              tags: string[]
            }> = []

            // Look for headings to create sections
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
            headings.forEach((heading, index) => {
              const rect = heading.getBoundingClientRect()
              const nextHeading = headings[index + 1]
              const sectionEnd = nextHeading ? nextHeading.getBoundingClientRect().top : document.body.scrollHeight
              
              sections.push({
                id: `auto-section-${index}`,
                type: 'Content',
                title: heading.textContent?.trim() || '',
                content: heading.textContent?.trim() || '',
                confidence: 0.6,
                position: {
                  top: rect.top + window.scrollY,
                  height: sectionEnd - rect.top
                },
                elements: ['h' + heading.tagName.charAt(1)],
                tags: ['content', 'auto-generated']
              })
            })

            // If no headings, create sections based on paragraphs
            if (sections.length === 0) {
              const paragraphs = document.querySelectorAll('p')
              const paragraphGroups: Element[][] = []
              let currentGroup: Element[] = []
              
              paragraphs.forEach((p, index) => {
                currentGroup.push(p)
                if (currentGroup.length >= 3 || index === paragraphs.length - 1) {
                  paragraphGroups.push([...currentGroup])
                  currentGroup = []
                }
              })

              paragraphGroups.forEach((group, index) => {
                const firstP = group[0]
                const lastP = group[group.length - 1]
                const rect = firstP.getBoundingClientRect()
                const endRect = lastP.getBoundingClientRect()
                
                sections.push({
                  id: `auto-section-${index}`,
                  type: 'Content',
                  title: '',
                  content: group.map(p => p.textContent?.trim()).join(' ').substring(0, 100) + '...',
                  confidence: 0.5,
                  position: {
                    top: rect.top + window.scrollY,
                    height: (endRect.top + endRect.height) - rect.top
                  },
                  elements: ['p'],
                  tags: ['content', 'auto-generated']
                })
              })
            }

            return sections
          }

          const autoSections = createContentBasedSections()
          autoSections.forEach(section => {
            visualSections.push({
              ...section,
              tags: [section.type.toLowerCase(), 'auto-generated']
            })
          })
        }

        // Sort sections by position and remove duplicates
        visualSections.sort((a, b) => a.position.top - b.position.top)
        
        // Remove overlapping sections (keep the one with higher confidence)
        const filteredSections: typeof visualSections = []
        visualSections.forEach(section => {
          const overlapping = filteredSections.find(existing => 
            Math.abs(existing.position.top - section.position.top) < 100 &&
            Math.abs(existing.position.height - section.position.height) < 100
          )
          
          if (!overlapping || section.confidence > overlapping.confidence) {
            if (overlapping) {
              const index = filteredSections.indexOf(overlapping)
              filteredSections[index] = section
            } else {
              filteredSections.push(section)
            }
          }
        })

        return filteredSections
      })

      return sections
    } catch (error) {
      console.error('Error detecting visual sections:', error)
      return []
    }
  }

  // NEW: Analyze content hierarchy and structure
  private async analyzeContentHierarchy(page: Page): Promise<ContentHierarchy> {
    try {
      const hierarchy = await page.evaluate(() => {
        // Helper functions
        const classifyCTA = (btn: Element): 'primary' | 'secondary' | 'tertiary' => {
          const className = (btn.className || '').toString().toLowerCase()
          if (className.includes('primary') || className.includes('main')) return 'primary'
          if (className.includes('secondary')) return 'secondary'
          return 'tertiary'
        }

        const classifyForm = (form: Element): 'contact' | 'signup' | 'newsletter' | 'quote' | 'other' => {
          const className = (form.className || '').toString().toLowerCase()
          const action = form.getAttribute('action')?.toLowerCase() || ''
          
          if (className.includes('signup') || action.includes('signup')) return 'signup'
          if (className.includes('contact') || action.includes('contact')) return 'contact'
          if (className.includes('newsletter') || action.includes('newsletter')) return 'newsletter'
          if (className.includes('quote') || action.includes('quote')) return 'quote'
          return 'other'
        }

        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          .map(h => ({
            level: parseInt(h.tagName.charAt(1)),
            text: h.textContent?.trim() || '',
            position: h.getBoundingClientRect().top + window.scrollY
          }))
          .filter(h => h.text.length > 0)

        const ctaElements = Array.from(document.querySelectorAll('button, .btn, .cta, [class*="button"], [class*="cta"]'))
          .map(btn => ({
            text: btn.textContent?.trim() || '',
            type: classifyCTA(btn),
            position: btn.getBoundingClientRect().top + window.scrollY
          }))
          .filter(btn => btn.text.length > 0)

        const forms = Array.from(document.querySelectorAll('form, .form, [class*="form"]'))
          .map(form => ({
            type: classifyForm(form),
            fields: Array.from(form.querySelectorAll('input, select, textarea')).length,
            position: form.getBoundingClientRect().top + window.scrollY
          }))

        return {
          headings,
          ctaElements,
          forms,
          totalSections: headings.length + ctaElements.length + forms.length
        }
      })

      return hierarchy
    } catch (error) {
      console.warn('Failed to analyze content hierarchy:', error)
      return {
        headings: [],
        ctaElements: [],
        forms: [],
        totalSections: 0
      }
    }
  }

  private sanitizeFilename(url: string): string {
    return url
      .replace(/^https?:\/\//, '')
      .replace(/[^a-zA-Z0-9.-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
  }

  private async progressiveScroll(page: Page): Promise<void> {
    const scrollDelay = 2000
    const animationWaitTime = 4000
    const maxScrollAttempts = 20
    const intersectionWaitTime = 3000
    
    try {
      // Get initial page height
      const initialHeight = await page.evaluate(() => document.body.scrollHeight)
      console.log(`Initial page height: ${initialHeight}px`)

      // Wait for initial animations to complete
      await this.waitForAnimationsToComplete(page, 5000)

      // Progressive scroll through the page with enhanced animation detection
      for (let attempt = 0; attempt < maxScrollAttempts; attempt++) {
        console.log(`Scroll attempt ${attempt + 1}/${maxScrollAttempts}`)

        // Scroll down progressively with smaller steps for better animation capture
        await page.evaluate(() => {
          const scrollStep = window.innerHeight * 0.6 // Scroll 60% of viewport height
          window.scrollBy(0, scrollStep)
        })

        await page.waitForTimeout(scrollDelay)

        // Wait for intersection observers and lazy loading
        await this.waitForIntersectionObservers(page)

        // Check if we've reached the bottom
        const currentScrollY = await page.evaluate(() => window.scrollY)
        const viewportHeight = await page.evaluate(() => window.innerHeight)
        const documentHeight = await page.evaluate(() => document.body.scrollHeight)

        if (currentScrollY + viewportHeight >= documentHeight - 100) {
          console.log('Reached bottom of page')
          break
        }

        // Enhanced animation waiting
        await this.waitForAnimationsToComplete(page, animationWaitTime)

        // Check for new content being added
        const newHeight = await page.evaluate(() => document.body.scrollHeight)
        if (newHeight > initialHeight) {
          console.log(`New content detected! Height increased from ${initialHeight}px to ${newHeight}px`)
          // Wait for new content to fully load
          await this.waitForAnimationsToComplete(page, 3000)
          continue
        }

        // Check for scroll-triggered animations
        await this.triggerScrollAnimations(page)
      }

      // Final comprehensive scroll to capture all animations
      await this.finalAnimationCapture(page)

    } catch (error) {
      console.error('Error during progressive scroll:', error)
    }
  }

  private async waitForAnimationsToComplete(page: Page, maxWaitTime: number = 5000): Promise<void> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < maxWaitTime) {
      const hasActiveAnimations = await page.evaluate(() => {
        // Check for CSS animations
        const animatedElements = Array.from(document.querySelectorAll('*'))
        for (const el of animatedElements) {
          const style = window.getComputedStyle(el)
          if (style.animationPlayState === 'running' || 
              (style.transitionDuration !== '0s' && style.transitionProperty !== 'none') ||
              style.transform !== 'none' && style.transform !== 'matrix(1, 0, 0, 1, 0, 0)') {
            return true
          }
        }
        
        // Check for common animation classes
        const animationClasses = ['animate', 'fade-in', 'slide-in', 'fade-up', 'slide-up', 'zoom-in', 'bounce', 'pulse', 'spin']
        for (const className of animationClasses) {
          if (document.querySelector(`.${className}`)) {
            return true
          }
        }
        
        return false
      })

      if (!hasActiveAnimations) {
        console.log('All animations completed')
        break
      }

      await page.waitForTimeout(500)
    }
  }

  private async waitForIntersectionObservers(page: Page): Promise<void> {
    const intersectionWaitTime = 3000
    // Wait for intersection observers to trigger
    await page.waitForTimeout(intersectionWaitTime)
    
    // Trigger intersection observers by scrolling slightly
    await page.evaluate(() => {
      window.scrollBy(0, 1)
      window.scrollBy(0, -1)
    })
    
    await page.waitForTimeout(1000)
  }

  private async triggerScrollAnimations(page: Page): Promise<void> {
    // Trigger scroll-based animations by scrolling in small increments
    const viewportHeight = await page.evaluate(() => window.innerHeight)
    
    // Scroll in small steps to trigger scroll animations
    for (let i = 0; i < 3; i++) {
      await page.evaluate((step) => {
        window.scrollBy(0, step)
      }, viewportHeight * 0.1)
      
      await page.waitForTimeout(500)
      await this.waitForAnimationsToComplete(page, 2000)
    }
  }

  private async finalAnimationCapture(page: Page): Promise<void> {
    console.log('Starting final animation capture...')
    
    // Scroll to top and wait
    await page.evaluate(() => window.scrollTo(0, 0))
    await this.waitForAnimationsToComplete(page, 3000)
    
    // Scroll through the page one more time slowly
    const documentHeight = await page.evaluate(() => document.body.scrollHeight)
    const viewportHeight = await page.evaluate(() => window.innerHeight)
    const steps = Math.ceil(documentHeight / viewportHeight)
    
    for (let i = 0; i < steps; i++) {
      await page.evaluate((step) => {
        window.scrollTo(0, step * window.innerHeight)
      }, i)
      
      await page.waitForTimeout(2000)
      await this.waitForAnimationsToComplete(page, 3000)
    }
    
    // Final scroll to top
    await page.evaluate(() => window.scrollTo(0, 0))
    await this.waitForAnimationsToComplete(page, 2000)
    
    console.log('Final animation capture completed')
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}

// Singleton instance
export const pageCapture = new PageCapture()
