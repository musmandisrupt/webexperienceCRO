export interface Competitor {
  id: string
  name: string
  website: string
  description?: string
  industry?: string
  createdAt: Date
  updatedAt: Date
  landingPages?: LandingPage[]
}

export interface LandingPage {
  id: string
  url: string
  title?: string
  description?: string
  screenshotUrl?: string
  copiedText?: string
  techStack: TechStackItem[]
  visualSections?: VisualSection[]
  contentHierarchy?: ContentHierarchy
  semanticAnalysis?: SemanticAnalysis
  capturedAt: Date
  updatedAt: Date
  competitorId?: string
  competitor?: Competitor
  insights?: Insight[]
}

export interface Insight {
  id: string
  title: string
  description: string
  category: InsightType
  confidence: number
  createdAt: Date
  updatedAt: Date
  landingPageId: string
  landingPage?: LandingPage
}

export interface WeeklyReport {
  id: string
  title: string
  weekStart: Date
  weekEnd: Date
  summary?: string
  createdAt: Date
  insights?: Insight[]
}

export const InsightType = {
  STEAL: 'STEAL',
  ADAPT: 'ADAPT',
  AVOID: 'AVOID'
} as const

export type InsightType = typeof InsightType[keyof typeof InsightType]

export interface TechStackItem {
  name: string
  version?: string
  category: string
  confidence: number
}

export interface CaptureResult {
  url: string
  title?: string
  description?: string
  screenshotPath: string
  copiedText: string
  techStack: TechStackItem[]
  visualSections?: VisualSection[]
  contentHierarchy?: ContentHierarchy
}

export interface SemanticAnalysis {
  pageFlow: {
    totalFolds: number
    primaryGoal: string
    userJourney: string[]
  }
  foldAnalysis: FoldAnalysis[]
  insights: {
    strengths: string[]
    improvements: string[]
    conversionOptimization: string[]
  }
  messagingFrameworks: {
    primaryFramework: string
    secondaryFrameworks: string[]
    frameworkAnalysis: string
    frameworkEvidence: string[]
    frameworkMapping: FrameworkMapping[]
    missingElements: MissingElement[]
    conversionScores: ConversionScore[]
  }
  metadata: {
    analysisDate: string
    processingTime: number
  }
}

export interface FoldAnalysis {
  foldNumber: number
  title: string
  description: string
  elements: string[]
  purpose: string
  conversionPoints: string[]
  visualDetails: string
  contentStrategy: string
}

// NEW: Advanced semantic analysis types
export interface VisualSection {
  id: string
  type: string
  title: string
  content: string
  confidence: number
  position: {
    top: number
    height: number
  }
  elements: string[]
  tags: string[]
  userIntent?: 'awareness' | 'consideration' | 'decision'
  conversionStage?: 'top' | 'middle' | 'bottom'
}

export interface ContentHierarchy {
  headings: HeadingElement[]
  ctaElements: CTAElement[]
  forms: FormElement[]
  totalSections: number
  userJourney?: UserJourneyStage[]
}

export interface HeadingElement {
  level: number
  text: string
  position: number
  semanticRole?: 'main-title' | 'section-title' | 'subsection-title'
}

export interface CTAElement {
  text: string
  type: 'primary' | 'secondary' | 'tertiary'
  position: number
  conversionIntent?: 'signup' | 'contact' | 'download' | 'learn-more'
}

export interface FormElement {
  type: 'contact' | 'signup' | 'newsletter' | 'quote' | 'other'
  fields: number
  position: number
}

export interface UserJourneyStage {
  stage: 'awareness' | 'consideration' | 'decision'
  content: string
  position: number
  confidence: number
}

// Enhanced Messaging Framework Types
export interface FrameworkMapping {
  section: string
  framework: string
  elements: {
    attention?: string
    interest?: string
    desire?: string
    action?: string
    problem?: string
    agitation?: string
    solution?: string
    features?: string
    advantages?: string
    benefits?: string
  }
  notes: string
}

export interface MissingElement {
  issue: string
  impact: string
  recommendation: string
}

export interface ConversionScore {
  fold: string
  framework: string
  score: number
  notes: string
}
