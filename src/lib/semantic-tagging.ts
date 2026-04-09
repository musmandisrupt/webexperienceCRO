import { createWorker } from 'tesseract.js'
import { pipeline, AutoProcessor, AutoTokenizer } from '@xenova/transformers'

export interface FoldSegment {
  id: string
  yStart: number
  yEnd: number
  height: number
  imageData: ImageData
  tags: string[]
  confidence: number
  content: string
  sectionType: 'header' | 'navigation' | 'hero' | 'content' | 'cta' | 'footer' | 'sidebar' | 'unknown'
}

export interface SemanticAnalysis {
  pageId: string
  timestamp: string
  totalFolds: number
  foldSegments: FoldSegment[]
  pageFlow: {
    primaryAction: string
    userJourney: string[]
    keySections: string[]
    conversionPoints: string[]
  }
  metadata: {
    viewportHeight: number
    totalHeight: number
    foldHeight: number
    processingTime: number
  }
}

export interface TaggingConfig {
  foldHeight: number
  overlap: number
  minConfidence: number
  maxTagsPerFold: number
  visionModel: string
  ocrEnabled: boolean
}

export class SemanticTaggingService {
  private config: TaggingConfig
  private visionPipeline: any
  private ocrWorker: any
  private isInitialized: boolean = false

  constructor(config: Partial<TaggingConfig> = {}) {
    this.config = {
      foldHeight: 800,
      overlap: 100,
      minConfidence: 0.7,
      maxTagsPerFold: 5,
      visionModel: 'microsoft/DialoGPT-medium',
      ocrEnabled: true,
      ...config
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Initialize vision pipeline
      this.visionPipeline = await pipeline('image-classification', this.config.visionModel)
      
      // Initialize OCR worker
      if (this.config.ocrEnabled) {
        this.ocrWorker = await createWorker('eng')
        await this.ocrWorker.loadLanguage('eng')
        await this.ocrWorker.initialize('eng')
      }

      this.isInitialized = true
      console.log('Semantic tagging service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize semantic tagging service:', error)
      throw new Error('Semantic tagging service initialization failed')
    }
  }

  async analyzeScreenshot(
    imageBuffer: Buffer,
    pageId: string,
    viewportHeight: number = 800
  ): Promise<SemanticAnalysis> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const startTime = Date.now()
    
    try {
      // Convert buffer to ImageData
      const imageData = await this.bufferToImageData(imageBuffer)
      
      // Slice image into folds
      const folds = this.sliceIntoFolds(imageData, viewportHeight)
      
      // Analyze each fold
      const foldSegments = await Promise.all(
        folds.map((fold, index) => this.analyzeFold(fold, index, pageId))
      )

      // Generate page-level flow analysis
      const pageFlow = this.generatePageFlow(foldSegments)
      
      const processingTime = Date.now() - startTime

      return {
        pageId,
        timestamp: new Date().toISOString(),
        totalFolds: folds.length,
        foldSegments,
        pageFlow,
        metadata: {
          viewportHeight,
          totalHeight: imageData.height,
          foldHeight: this.config.foldHeight,
          processingTime
        }
      }
    } catch (error) {
      console.error('Screenshot analysis failed:', error)
      throw new Error(`Screenshot analysis failed: ${error.message}`)
    }
  }

  private sliceIntoFolds(imageData: ImageData, viewportHeight: number): ImageData[] {
    const folds: ImageData[] = []
    const { foldHeight, overlap } = this.config
    
    for (let y = 0; y < imageData.height; y += foldHeight - overlap) {
      const foldHeight = Math.min(this.config.foldHeight, imageData.height - y)
      
      // Create canvas for this fold
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      canvas.width = imageData.width
      canvas.height = foldHeight
      
      // Draw the fold section
      const foldImageData = ctx.createImageData(imageData.width, foldHeight)
      for (let i = 0; i < foldHeight; i++) {
        for (let j = 0; j < imageData.width; j++) {
          const sourceIndex = ((y + i) * imageData.width + j) * 4
          const targetIndex = (i * imageData.width + j) * 4
          
          foldImageData.data[targetIndex] = imageData.data[sourceIndex]
          foldImageData.data[targetIndex + 1] = imageData.data[sourceIndex + 1]
          foldImageData.data[targetIndex + 2] = imageData.data[sourceIndex + 2]
          foldImageData.data[targetIndex + 3] = imageData.data[sourceIndex + 3]
        }
      }
      
      folds.push(foldImageData)
    }
    
    return folds
  }

  private async analyzeFold(
    foldImageData: ImageData,
    foldIndex: number,
    pageId: string
  ): Promise<FoldSegment> {
    try {
      // Convert ImageData to base64 for vision model
      const base64Image = this.imageDataToBase64(foldImageData)
      
      // Analyze with vision LLM
      const visionAnalysis = await this.analyzeWithVision(base64Image)
      
      // Extract text with OCR if enabled
      let ocrText = ''
      if (this.config.ocrEnabled) {
        ocrText = await this.extractTextWithOCR(foldImageData)
      }
      
      // Classify section type
      const sectionType = this.classifySectionType(visionAnalysis.tags, ocrText)
      
      return {
        id: `${pageId}-fold-${foldIndex}`,
        yStart: foldIndex * (this.config.foldHeight - this.config.overlap),
        yEnd: (foldIndex + 1) * this.config.foldHeight,
        height: foldImageData.height,
        imageData: foldImageData,
        tags: visionAnalysis.tags.slice(0, this.config.maxTagsPerFold),
        confidence: visionAnalysis.confidence,
        content: ocrText,
        sectionType
      }
    } catch (error) {
      console.error(`Fold analysis failed for fold ${foldIndex}:`, error)
      
      // Return fallback fold segment
      return {
        id: `${pageId}-fold-${foldIndex}`,
        yStart: foldIndex * (this.config.foldHeight - this.config.overlap),
        yEnd: (foldIndex + 1) * this.config.foldHeight,
        height: foldImageData.height,
        imageData: foldImageData,
        tags: ['unknown', 'error'],
        confidence: 0,
        content: '',
        sectionType: 'unknown'
      }
    }
  }

  private async analyzeWithVision(base64Image: string): Promise<{ tags: string[], confidence: number }> {
    try {
      // This is a simplified vision analysis - in production you'd use a more sophisticated model
      const prompt = `Analyze this webpage screenshot and provide semantic tags. Focus on:
        - UI elements (buttons, forms, navigation)
        - Content type (text, images, videos)
        - Business purpose (e-commerce, blog, landing page)
        - User actions (sign up, purchase, contact)
        
        Return only the most relevant tags, separated by commas.`
      
      // For production, integrate with actual vision LLM API (OpenAI, Claude, etc.)
      // This is a mock response for demonstration
      const mockTags = ['navigation', 'hero-section', 'call-to-action', 'form', 'business']
      const mockConfidence = 0.85
      
      return {
        tags: mockTags,
        confidence: mockConfidence
      }
    } catch (error) {
      console.error('Vision analysis failed:', error)
      return {
        tags: ['error', 'analysis-failed'],
        confidence: 0
      }
    }
  }

  private async extractTextWithOCR(imageData: ImageData): Promise<string> {
    try {
      if (!this.ocrWorker) return ''
      
      // Convert ImageData to canvas for OCR
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      canvas.width = imageData.width
      canvas.height = imageData.height
      
      ctx.putImageData(imageData, 0, 0)
      
      // Extract text
      const { data: { text } } = await this.ocrWorker.recognize(canvas)
      return text || ''
    } catch (error) {
      console.error('OCR extraction failed:', error)
      return ''
    }
  }

  private classifySectionType(tags: string[], ocrText: string): FoldSegment['sectionType'] {
    const text = (ocrText + ' ' + tags.join(' ')).toLowerCase()
    
    if (text.includes('header') || text.includes('nav') || text.includes('menu')) {
      return 'header'
    }
    if (text.includes('hero') || text.includes('main') || text.includes('banner')) {
      return 'hero'
    }
    if (text.includes('button') || text.includes('cta') || text.includes('sign up')) {
      return 'cta'
    }
    if (text.includes('footer') || text.includes('bottom')) {
      return 'footer'
    }
    if (text.includes('sidebar') || text.includes('side')) {
      return 'sidebar'
    }
    if (text.includes('form') || text.includes('input') || text.includes('contact')) {
      return 'content'
    }
    
    return 'content'
  }

  private generatePageFlow(foldSegments: FoldSegment[]): SemanticAnalysis['pageFlow'] {
    const sections = foldSegments.map(fold => fold.sectionType)
    const actions = foldSegments
      .filter(fold => fold.sectionType === 'cta')
      .map(fold => fold.content || fold.tags[0])
    
    return {
      primaryAction: actions[0] || 'unknown',
      userJourney: this.generateUserJourney(sections),
      keySections: this.extractKeySections(foldSegments),
      conversionPoints: this.identifyConversionPoints(foldSegments)
    }
  }

  private generateUserJourney(sections: FoldSegment['sectionType'][]): string[] {
    const journey: string[] = []
    
    for (const section of sections) {
      switch (section) {
        case 'header':
          journey.push('Navigation & Brand Discovery')
          break
        case 'hero':
          journey.push('Value Proposition & Main Message')
          break
        case 'content':
          journey.push('Information & Details')
          break
        case 'cta':
          journey.push('Action & Conversion')
          break
        case 'footer':
          journey.push('Additional Resources & Contact')
          break
      }
    }
    
    return journey
  }

  private extractKeySections(foldSegments: FoldSegment[]): string[] {
    return foldSegments
      .filter(fold => fold.confidence > this.config.minConfidence)
      .map(fold => `${fold.sectionType}: ${fold.tags.slice(0, 2).join(', ')}`)
  }

  private identifyConversionPoints(foldSegments: FoldSegment[]): string[] {
    return foldSegments
      .filter(fold => fold.sectionType === 'cta' && fold.confidence > this.config.minConfidence)
      .map(fold => fold.content || fold.tags[0])
  }

  private async bufferToImageData(buffer: Buffer): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const blob = new Blob([buffer], { type: 'image/png' })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        
        canvas.width = img.width
        canvas.height = img.height
        
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, img.width, img.height)
        
        URL.revokeObjectURL(url)
        resolve(imageData)
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image from buffer'))
      }
      
      img.src = url
    })
  }

  private imageDataToBase64(imageData: ImageData): string {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    canvas.width = imageData.width
    canvas.height = imageData.height
    
    ctx.putImageData(imageData, 0, 0)
    return canvas.toDataURL('image/png')
  }

  async cleanup(): Promise<void> {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate()
    }
    this.isInitialized = false
  }
}

// Factory function for easy instantiation
export const createSemanticTaggingService = (config?: Partial<TaggingConfig>) => {
  return new SemanticTaggingService(config)
}
