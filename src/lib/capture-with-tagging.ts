import { capturePage } from './capture'
import { createSemanticTaggingService } from './semantic-tagging'
import { getConfig } from './semantic-tagging.config'
import type { CaptureResult } from './capture'
import type { SemanticAnalysis } from './semantic-tagging'

export interface EnhancedCaptureResult extends CaptureResult {
  semanticAnalysis?: SemanticAnalysis
  processingTime: number
  foldCount: number
  tags: string[]
  userJourney: string[]
  conversionPoints: string[]
}

export interface CaptureWithTaggingOptions {
  url: string
  competitorId?: string
  viewportHeight?: number
  enableTagging?: boolean
  taggingConfig?: any
  environment?: 'production' | 'development'
}

export class CaptureWithTaggingService {
  private taggingService: any
  private config: any

  constructor(environment: 'production' | 'development' = 'production') {
    this.config = getConfig(environment)
    this.taggingService = null
  }

  async captureWithSemanticTagging(options: CaptureWithTaggingOptions): Promise<EnhancedCaptureResult> {
    const startTime = Date.now()
    
    try {
      // Step 1: Capture the webpage
      console.log('🔄 Starting webpage capture...')
      const captureResult = await capturePage(options.url, options.competitorId)
      
      if (!captureResult.success) {
        throw new Error(`Capture failed: ${captureResult.error}`)
      }

      const result: EnhancedCaptureResult = {
        ...captureResult,
        processingTime: Date.now() - startTime,
        foldCount: 0,
        tags: [],
        userJourney: [],
        conversionPoints: []
      }

      // Step 2: Perform semantic tagging if enabled
      if (options.enableTagging !== false && captureResult.screenshotPath) {
        console.log('🔍 Starting semantic analysis...')
        
        try {
          const semanticAnalysis = await this.performSemanticTagging(
            captureResult.screenshotPath,
            captureResult.landingPageId || 'unknown',
            options.viewportHeight || this.config.foldHeight,
            options.taggingConfig
          )

          result.semanticAnalysis = semanticAnalysis
          result.foldCount = semanticAnalysis.totalFolds
          result.tags = this.extractAllTags(semanticAnalysis.foldSegments)
          result.userJourney = semanticAnalysis.pageFlow.userJourney
          result.conversionPoints = semanticAnalysis.pageFlow.conversionPoints

          console.log(`✅ Semantic analysis completed: ${semanticAnalysis.totalFolds} folds analyzed`)
        } catch (taggingError) {
          console.warn('⚠️ Semantic tagging failed, continuing with basic capture:', taggingError)
          // Continue without semantic analysis
        }
      }

      result.processingTime = Date.now() - startTime
      console.log(`🎯 Capture with tagging completed in ${result.processingTime}ms`)

      return result

    } catch (error) {
      console.error('❌ Capture with tagging failed:', error)
      throw error
    }
  }

  private async performSemanticTagging(
    screenshotPath: string,
    pageId: string,
    viewportHeight: number,
    customConfig?: any
  ): Promise<SemanticAnalysis> {
    try {
      // Initialize tagging service if not already done
      if (!this.taggingService) {
        this.taggingService = createSemanticTaggingService({
          ...this.config,
          ...customConfig
        })
        await this.taggingService.initialize()
      }

      // Read screenshot file
      const fs = require('fs')
      const imageBuffer = fs.readFileSync(screenshotPath)

      // Perform semantic analysis
      const analysis = await this.taggingService.analyzeScreenshot(
        imageBuffer,
        pageId,
        viewportHeight
      )

      return analysis

    } catch (error) {
      console.error('Semantic tagging failed:', error)
      throw new Error(`Semantic tagging failed: ${error.message}`)
    }
  }

  private extractAllTags(foldSegments: any[]): string[] {
    const allTags = new Set<string>()
    
    foldSegments.forEach(fold => {
      fold.tags.forEach((tag: string) => {
        if (tag && tag !== 'unknown' && tag !== 'error') {
          allTags.add(tag)
        }
      })
    })
    
    return Array.from(allTags)
  }

  async cleanup(): Promise<void> {
    if (this.taggingService) {
      await this.taggingService.cleanup()
      this.taggingService = null
    }
  }
}

// Factory function for easy instantiation
export const createCaptureWithTaggingService = (environment?: 'production' | 'development') => {
  return new CaptureWithTaggingService(environment)
}

// Utility function for quick capture with tagging
export const quickCaptureWithTagging = async (options: CaptureWithTaggingOptions): Promise<EnhancedCaptureResult> => {
  const service = createCaptureWithTaggingService(options.environment)
  
  try {
    return await service.captureWithSemanticTagging(options)
  } finally {
    await service.cleanup()
  }
}
