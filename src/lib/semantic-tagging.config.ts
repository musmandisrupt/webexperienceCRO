export const SEMANTIC_TAGGING_CONFIG = {
  // Production settings
  production: {
    foldHeight: 800,
    overlap: 100,
    minConfidence: 0.75,
    maxTagsPerFold: 5,
    visionModel: 'microsoft/DialoGPT-medium',
    ocrEnabled: true,
    maxProcessingTime: 30000, // 30 seconds
    retryAttempts: 3,
    batchSize: 5, // Process 5 folds at a time
    cacheEnabled: true,
    cacheTTL: 3600000, // 1 hour
  },

  // Development settings
  development: {
    foldHeight: 600,
    overlap: 50,
    minConfidence: 0.6,
    maxTagsPerFold: 3,
    visionModel: 'microsoft/DialoGPT-medium',
    ocrEnabled: true,
    maxProcessingTime: 60000, // 1 minute
    retryAttempts: 2,
    batchSize: 3,
    cacheEnabled: false,
    cacheTTL: 300000, // 5 minutes
  },

  // Vision model configurations
  visionModels: {
    'microsoft/DialoGPT-medium': {
      maxTokens: 512,
      temperature: 0.7,
      topP: 0.9,
    },
    'openai/clip-vit-base-patch32': {
      maxTokens: 256,
      temperature: 0.5,
      topP: 0.8,
    },
    'google/vit-base-patch16-224': {
      maxTokens: 128,
      temperature: 0.3,
      topP: 0.7,
    },
  },

  // OCR configurations
  ocr: {
    languages: ['eng', 'fra', 'deu', 'spa'],
    confidenceThreshold: 0.6,
    maxTextLength: 1000,
  },

  // Section classification rules
  sectionRules: {
    header: {
      keywords: ['header', 'nav', 'navigation', 'menu', 'logo', 'brand'],
      confidence: 0.8,
    },
    hero: {
      keywords: ['hero', 'main', 'banner', 'headline', 'title', 'subtitle'],
      confidence: 0.85,
    },
    cta: {
      keywords: ['button', 'cta', 'call-to-action', 'sign up', 'get started', 'learn more'],
      confidence: 0.9,
    },
    content: {
      keywords: ['form', 'input', 'contact', 'about', 'features', 'benefits'],
      confidence: 0.7,
    },
    footer: {
      keywords: ['footer', 'bottom', 'links', 'social', 'copyright'],
      confidence: 0.8,
    },
    sidebar: {
      keywords: ['sidebar', 'side', 'widget', 'panel'],
      confidence: 0.75,
    },
  },

  // Performance optimizations
  performance: {
    enableWebWorkers: true,
    maxConcurrentRequests: 3,
    requestTimeout: 15000,
    enableCompression: true,
    enableCaching: true,
  },

  // Error handling
  errorHandling: {
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true,
    logErrors: true,
    fallbackToMock: true,
  },
}

export const getConfig = (environment: 'production' | 'development' = 'production') => {
  return SEMANTIC_TAGGING_CONFIG[environment]
}

export const getVisionModelConfig = (modelName: string) => {
  return SEMANTIC_TAGGING_CONFIG.visionModels[modelName] || 
         SEMANTIC_TAGGING_CONFIG.visionModels['microsoft/DialoGPT-medium']
}

export const getSectionRules = () => {
  return SEMANTIC_TAGGING_CONFIG.sectionRules
}
