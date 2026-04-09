import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

// Lazy-initialize OpenAI client (avoid crashing at build time when env vars aren't set)
let _openai: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })
  }
  return _openai
}

interface FoldAnalysis {
  foldNumber: number
  title: string
  description: string
  elements: string[]
  purpose: string
  conversionPoints: string[]
  visualDetails?: string
  contentStrategy?: string
  scores?: {
    clarity: number
    persuasion: number
    conversionPotential: number
  }
  confidence: number
}

interface SemanticAnalysisResult {
  pageFlow: {
    totalFolds: number
    primaryGoal: string
    userJourney: string[]
    conversionFunnel: string[]
  }
  foldAnalysis: FoldAnalysis[]
  insights: {
    strengths: string[]
    improvements: string[]
    conversionOptimization: string[]
  }
  messagingFrameworks?: any
  persuasionInventory?: {
    trustSignals: string[]
    urgencyTriggers: string[]
    emotionalTriggers: string[]
    socialProof: string[]
  }
  overallScores?: {
    conversionScore: number
    conversionJustification: string
    valuePropositionClarity: number
    ctaEffectiveness: {
      placement: string
      copyStrength: string
      designVisibility: string
      repetitionFrequency: string
    }
  }
  metadata: {
    analysisDate: string
    processingTime: number
    confidence?: number
  }
}

// Function to detect basic/placeholder pages that don't need complex analysis
function isBasicPlaceholderPage(url: string, title: string, description: string, copiedText: string): boolean {
  const basicIndicators = [
    'example.com',
    'example.org', 
    'example.net',
    'test.com',
    'placeholder',
    'coming soon',
    'under construction',
    'maintenance',
    '404',
    'not found'
  ]
  
  const basicTitles = [
    'example domain',
    'placeholder',
    'coming soon',
    'under construction',
    'maintenance',
    '404 not found',
    'page not found'
  ]
  
  const basicContent = [
    'this domain is for use in illustrative examples',
    'placeholder',
    'coming soon',
    'under construction',
    'maintenance mode',
    'page not found',
    '404 error'
  ]
  
  const urlLower = url.toLowerCase()
  const titleLower = title.toLowerCase()
  const descriptionLower = (description || '').toLowerCase()
  const contentLower = (copiedText || '').toLowerCase()
  
  // Check if URL contains basic indicators
  if (basicIndicators.some(indicator => urlLower.includes(indicator))) {
    return true
  }
  
  // Check if title is basic
  if (basicTitles.some(basicTitle => titleLower.includes(basicTitle))) {
    return true
  }
  
  // Check if description is basic
  if (descriptionLower && basicContent.some(basic => descriptionLower.includes(basic))) {
    return true
  }
  
  // Check if content is very basic (less than 100 characters or contains basic phrases)
  if (contentLower.length < 100 || basicContent.some(basic => contentLower.includes(basic))) {
    return true
  }
  
  return false
}

// Add markdown parser function
function parseMarkdownAnalysis(markdownText: string): any {
  try {
    console.log('Parsing markdown analysis...')
    
    // Extract fold analysis from markdown - simplified approach
    const foldAnalysis: any[] = []

    // Look for fold patterns like "1. **Header Navigation (Fold 1)**"
    const foldMatches = markdownText.match(/(\d+)\. \*\*(.*?)\*\*/g)
    if (foldMatches) {
      foldMatches.forEach((match, index) => {
        const parts = match.match(/(\d+)\. \*\*(.*?)\*\*/)
        if (parts) {
          const foldTitle = parts[2]
          const foldLower = foldTitle.toLowerCase()

          // Extract the content block following this fold header for better descriptions
          const foldHeaderIndex = markdownText.indexOf(match)
          const nextFoldIndex = foldMatches[index + 1] ? markdownText.indexOf(foldMatches[index + 1]) : markdownText.length
          const foldContent = markdownText.substring(foldHeaderIndex + match.length, nextFoldIndex).trim()
          const descriptionText = foldContent.replace(/\*\*/g, '').replace(/[-*]\s+/g, '').substring(0, 200).trim()

          // Derive purpose from fold title/content
          let purpose = 'Engage users with relevant content'
          let conversionPoints = ['User engagement']
          if (foldLower.includes('hero') || foldLower.includes('header') || index === 0) {
            purpose = 'Capture attention and communicate the primary value proposition'
            conversionPoints = ['Primary CTA', 'Value proposition engagement']
          } else if (foldLower.includes('testimonial') || foldLower.includes('review') || foldLower.includes('proof')) {
            purpose = 'Build trust through social proof and third-party validation'
            conversionPoints = ['Trust building', 'Credibility reinforcement']
          } else if (foldLower.includes('pricing') || foldLower.includes('plan')) {
            purpose = 'Present pricing and drive purchase decision'
            conversionPoints = ['Plan selection', 'Purchase CTA']
          } else if (foldLower.includes('feature') || foldLower.includes('benefit')) {
            purpose = 'Showcase capabilities and demonstrate value'
            conversionPoints = ['Feature engagement', 'Benefit realization']
          } else if (foldLower.includes('cta') || foldLower.includes('action') || foldLower.includes('sign')) {
            purpose = 'Drive conversion through a direct call to action'
            conversionPoints = ['Direct conversion CTA', 'Lead capture']
          } else if (foldLower.includes('faq') || foldLower.includes('question')) {
            purpose = 'Address objections and reduce purchase anxiety'
            conversionPoints = ['Objection handling']
          } else if (foldLower.includes('footer')) {
            purpose = 'Provide secondary navigation and trust signals'
            conversionPoints = ['Secondary links', 'Trust badges']
          }

          // Extract bullet points as elements
          const bulletPoints = foldContent.match(/[-*]\s+(.+)/g)
          const elements = bulletPoints
            ? bulletPoints.slice(0, 5).map(b => b.replace(/^[-*]\s+/, '').replace(/\*\*/g, '').trim())
            : ['Content block', 'Visual elements']

          foldAnalysis.push({
            foldNumber: parseInt(parts[1]),
            title: foldTitle,
            description: descriptionText || `${foldTitle} section providing ${purpose.toLowerCase()}`,
            elements,
            purpose,
            conversionPoints,
            visualDetails: `Layout analysis for ${foldTitle}`,
            contentStrategy: `Content in this section supports the goal: ${purpose.toLowerCase()}`
          })
        }
      })
    }
    
    // Extract page flow - simplified
    const primaryGoalMatch = markdownText.match(/\*\*PrimaryGoal\*\*: (.*?)(?=\n|$)/)
    const primaryGoal = primaryGoalMatch ? primaryGoalMatch[1] : "Drive user engagement and conversion"
    
    // Extract user journey - simplified
    const userJourneyMatch = markdownText.match(/\*\*UserJourney\*\*:\s*\n((?:\s*\d+\. .*\n?)*)/s)
    let userJourney: string[] = []
    if (userJourneyMatch) {
      const journeyLines = userJourneyMatch[1].match(/\d+\. (.*?)(?=\n|$)/g)
      if (journeyLines) {
        userJourney = journeyLines.map(line => line.replace(/^\d+\. /, ''))
      }
    }
    
    // Extract insights - simplified
    const strengthsMatch = markdownText.match(/\*\*Strengths\*\*: (.*?)(?=\n|$)/)
    const improvementsMatch = markdownText.match(/\*\*Improvements\*\*: (.*?)(?=\n|$)/)
    const conversionOptimizationMatch = markdownText.match(/\*\*ConversionOptimization\*\*: (.*?)(?=\n|$)/)
    
    const strengths = strengthsMatch ? strengthsMatch[1].split(',').map(s => s.trim()) : ['Clear value proposition']
    const improvements = improvementsMatch ? improvementsMatch[1].split(',').map(s => s.trim()) : ['Enhance user experience']
    const conversionOptimization = conversionOptimizationMatch ? conversionOptimizationMatch[1].split(',').map(s => s.trim()) : ['Optimize conversion flow']
    
    // Extract messaging frameworks - simplified
    const primaryFrameworkMatch = markdownText.match(/\*\*PrimaryFramework\*\*: (.*?)(?=\n|$)/)
    const primaryFramework = primaryFrameworkMatch ? primaryFrameworkMatch[1] : "AIDA"
    
    const secondaryFrameworksMatch = markdownText.match(/\*\*SecondaryFrameworks\*\*: (.*?)(?=\n|$)/)
    const secondaryFrameworks = secondaryFrameworksMatch ? secondaryFrameworksMatch[1].split(',').map(s => s.trim()) : ['FAB', 'PAS']
    
    console.log(`Parsed ${foldAnalysis.length} folds, primary framework: ${primaryFramework}`)
    
    return {
      pageFlow: {
        totalFolds: foldAnalysis.length,
        primaryGoal,
        userJourney
      },
      foldAnalysis,
      insights: {
        strengths,
        improvements,
        conversionOptimization
      },
      messagingFrameworks: {
        primaryFramework,
        secondaryFrameworks,
        frameworkAnalysis: `This page primarily uses the ${primaryFramework} framework${secondaryFrameworks.length > 0 ? ` with secondary elements of ${secondaryFrameworks.join(', ')}` : ''}. The content flow guides visitors through a structured persuasion journey.`,
        frameworkEvidence: foldAnalysis.map(fold => `"${fold.title}" section supports ${primaryFramework} via ${fold.purpose.toLowerCase()}`),
        frameworkMapping: foldAnalysis.map((fold, idx) => {
          // Map fold position to likely framework stage
          const aidaStages = ['Attention', 'Interest', 'Desire', 'Action']
          const pasStages = ['Problem', 'Agitation', 'Solution']
          const stages = primaryFramework === 'PAS' ? pasStages : aidaStages
          const stage = stages[Math.min(idx, stages.length - 1)]
          return {
            section: fold.title,
            framework: primaryFramework,
            elements: { stage, evidence: fold.purpose },
            notes: `Fold ${fold.foldNumber} serves the ${stage} stage — ${fold.purpose}`
          }
        }),
        missingElements: [
          ...(foldAnalysis.every(f => !f.purpose.includes('trust')) ? [{
            issue: 'No dedicated social proof section detected in markdown',
            impact: 'Missing trust signals can reduce conversion by 20-30%',
            recommendation: 'Add customer testimonials with specific results and names'
          }] : []),
          ...(foldAnalysis.every((f: any) => !f.conversionPoints.some((cp: any) => cp.toLowerCase().includes('cta'))) ? [{
            issue: 'No strong CTA detected across folds',
            impact: 'Users may lack a clear next step',
            recommendation: 'Add benefit-oriented CTAs at key decision points'
          }] : [])
        ],
        conversionScores: foldAnalysis.map((fold, idx) => {
          // Score based on fold position and detected purpose
          let score = 5
          if (fold.conversionPoints.some((cp: any) => cp.toLowerCase().includes('cta'))) score += 2
          if (fold.purpose.includes('trust') || fold.purpose.includes('proof')) score += 1
          if (fold.purpose.includes('value proposition')) score += 1
          if (fold.elements.length > 3) score += 1
          score = Math.min(score, 10)
          return {
            fold: fold.title,
            framework: primaryFramework,
            score,
            notes: score >= 8 ? 'Strong conversion potential with clear purpose and persuasive elements'
                 : score >= 6 ? 'Good foundation, could benefit from stronger CTAs or social proof'
                 : 'Needs improvement — consider adding more persuasive elements'
          }
        })
      },
      metadata: {
        analysisDate: new Date().toISOString(),
        processingTime: 120
      }
    }
  } catch (error) {
    console.error('Error parsing markdown analysis:', error)
    return null
  }
}

// AI-powered analysis function using OpenAI Vision API
async function analyzePageWithLLM(
  url: string,
  title: string,
  description: string,
  copiedText: string,
  visualSections: any[],
  contentHierarchy: any,
  screenshotPath: string
): Promise<SemanticAnalysisResult> {
  const startTime = Date.now()
  
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key not configured, falling back to rule-based analysis')
      return generateContentBasedAnalysis(url, title, description, copiedText, visualSections, contentHierarchy, startTime)
    }

    // Read the screenshot file
    const screenshotFullPath = path.join(process.cwd(), 'public', screenshotPath)
    
    if (!fs.existsSync(screenshotFullPath)) {
      console.log('Screenshot not found, falling back to rule-based analysis')
      return generateContentBasedAnalysis(url, title, description, copiedText, visualSections, contentHierarchy, startTime)
    }

    const screenshotBuffer = fs.readFileSync(screenshotFullPath)
    const base64Image = screenshotBuffer.toString('base64')

    // Prepare the analysis prompt - comprehensive conversion-focused analysis
    const truncatedText = (copiedText || '').substring(0, 3000)
    const analysisPrompt = `You are an expert conversion rate optimization (CRO) analyst and copywriting strategist. Analyze this webpage screenshot along with its extracted text content to produce a deep semantic and conversion analysis.

Page URL: ${url}
Page Title: ${title}
Page Description: ${description}

Extracted page text (first 3000 chars):
"""
${truncatedText}
"""

Perform the following analysis:

1. FOLD-BY-FOLD BREAKDOWN: Identify each visual fold (viewport-height section) from top to bottom. For each fold provide:
   - A descriptive title
   - Detailed description of what appears in this fold
   - ALL elements found (headings, images, buttons, forms, icons, videos, animations, logos, nav items)
   - The fold's purpose in the conversion funnel
   - Specific conversion points (CTAs, links, forms, sign-ups)
   - Visual design assessment (layout quality, whitespace usage, color contrast, typography hierarchy)
   - Content strategy (what messaging technique is used, how copy supports the goal)

2. MESSAGING FRAMEWORK DETECTION WITH EVIDENCE: Detect which frameworks are used. For each detected framework, cite the specific text or element that serves as evidence and map which fold implements which stage.
   - AIDA: Attention (headline/hero), Interest (features/benefits), Desire (social proof/emotional appeal), Action (CTA)
   - PAS: Problem (pain point identification), Agitation (amplifying the problem), Solution (product as answer)
   - FAB: Features (what it does), Advantages (why it matters), Benefits (what user gains)
   - BAB: Before (current painful state), After (desired state), Bridge (product connects them)
   - StoryBrand: Character (user), Problem, Guide (brand), Plan, CTA, Success, Failure
   - 4Ps: Promise, Picture, Proof, Push
   - QUEST: Qualify, Understand, Educate, Stimulate, Transition

3. PERSUASION ELEMENT INVENTORY:
   - Trust signals: testimonials, client logos, certifications, security badges, statistics, case studies, press mentions
   - Urgency triggers: limited time offers, scarcity messaging, countdown timers, seasonal references
   - Emotional triggers: fear, aspiration, belonging, FOMO, exclusivity, curiosity
   - Social proof: user/customer counts, testimonial quotes, brand logos, star ratings, review counts

4. SCORING: Score each fold 1-10 on clarity, persuasion power, and conversion potential. Also provide:
   - Overall page conversion score (1-10) with justification
   - Value proposition clarity score (1-10)
   - CTA effectiveness assessment: placement strategy, copy strength, design visibility, repetition frequency

5. GAP ANALYSIS: Identify specific missing elements that would improve conversion rate, with expected impact.

Return ONLY valid JSON in this exact format:
{
  "pageFlow": {
    "totalFolds": 0,
    "primaryGoal": "string - the single most important conversion goal of this page",
    "userJourney": ["step1", "step2", "..."],
    "conversionFunnel": ["Awareness: ...", "Interest: ...", "Desire: ...", "Action: ..."]
  },
  "foldAnalysis": [
    {
      "foldNumber": 1,
      "title": "string",
      "description": "string - detailed 2-3 sentence description",
      "elements": ["specific element 1", "specific element 2"],
      "purpose": "string - role in conversion funnel",
      "conversionPoints": ["specific CTA or conversion element"],
      "visualDetails": "string - layout, colors, typography, whitespace assessment",
      "contentStrategy": "string - messaging technique and copy effectiveness",
      "scores": {
        "clarity": 8,
        "persuasion": 7,
        "conversionPotential": 6
      }
    }
  ],
  "insights": {
    "strengths": ["specific strength with evidence"],
    "improvements": ["specific improvement with expected impact"],
    "conversionOptimization": ["specific actionable recommendation"]
  },
  "messagingFrameworks": {
    "primaryFramework": "AIDA|PAS|FAB|BAB|StoryBrand|4Ps|QUEST",
    "secondaryFrameworks": ["framework2"],
    "frameworkAnalysis": "string - detailed explanation of how frameworks are used across the page",
    "frameworkEvidence": ["Fold 1 headline 'X' serves as AIDA Attention stage", "Fold 3 testimonials serve as PAS Solution validation"],
    "frameworkMapping": [
      {
        "section": "fold title",
        "framework": "AIDA",
        "elements": {
          "stage": "Attention",
          "evidence": "specific text or element that proves this"
        },
        "notes": "string"
      }
    ],
    "missingElements": [
      {
        "issue": "specific missing element",
        "impact": "expected conversion impact",
        "recommendation": "specific actionable fix"
      }
    ],
    "conversionScores": [
      {
        "fold": "fold title",
        "framework": "framework used",
        "score": 8,
        "notes": "justification for score"
      }
    ]
  },
  "persuasionInventory": {
    "trustSignals": ["specific trust signal found"],
    "urgencyTriggers": ["specific urgency element found"],
    "emotionalTriggers": ["specific emotional trigger found"],
    "socialProof": ["specific social proof element found"]
  },
  "overallScores": {
    "conversionScore": 7,
    "conversionJustification": "string",
    "valuePropositionClarity": 7,
    "ctaEffectiveness": {
      "placement": "string assessment",
      "copyStrength": "string assessment",
      "designVisibility": "string assessment",
      "repetitionFrequency": "string assessment"
    }
  },
  "metadata": {
    "analysisDate": "${new Date().toISOString()}",
    "processingTime": 0
  }
}`

    // Call OpenAI Vision API with structured JSON output
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a senior CRO (Conversion Rate Optimisation) expert. Analyse the landing page content provided and return ONLY valid JSON matching the exact schema requested. Do not include any markdown, explanation, or text outside the JSON object."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: analysisPrompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 8000,
      temperature: 0.2
    })

    const aiResponse = response.choices[0]?.message?.content
    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    console.log('AI JSON response received, length:', aiResponse.length)

    // Parse the JSON response directly (response_format ensures valid JSON)
    let analysis: any
    try {
      analysis = JSON.parse(aiResponse)
    } catch (parseError) {
      console.error('JSON parse failed despite response_format. Raw response:', aiResponse.substring(0, 500))
      // Try stripping markdown code blocks as last resort
      let cleaned = aiResponse.trim()
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
      }
      analysis = JSON.parse(cleaned)
    }

    // Add metadata
    const processingTime = Date.now() - startTime
    analysis.metadata = {
      analysisDate: new Date().toISOString(),
      processingTime: processingTime
    }

    // Clean up any "in markdown" text leaks in stored data
    if (analysis.messagingFrameworks?.missingElements) {
      analysis.messagingFrameworks.missingElements = analysis.messagingFrameworks.missingElements.map((el: any) => ({
        ...el,
        issue: (el.issue || '').replace(/\s*in markdown\s*/gi, '').trim(),
      }))
    }

    console.log('AI analysis completed successfully, folds:', analysis.foldAnalysis?.length || 0)
    return analysis

  } catch (error) {
    console.error('AI analysis failed, falling back to rule-based analysis:', error)
    
    // Try a simpler approach without image analysis if the first attempt failed
    try {
      console.log('Attempting text-only analysis as fallback...')
      const textOnlyResponse = await getOpenAI().chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: `Analyze this landing page based on the provided content and metadata. Please provide a comprehensive semantic analysis in JSON format with pageFlow, foldAnalysis, insights, and messagingFrameworks sections.`
          }
        ],
        max_tokens: 3000,
        temperature: 0.1
      })
      
      const textResponse = textOnlyResponse.choices[0]?.message?.content
      if (textResponse && !textResponse.startsWith('I\'m unable') && !textResponse.startsWith('I\'m sorry')) {
        console.log('Text-only analysis successful')
        let jsonString = textResponse.trim()
        
        // Remove markdown code blocks if present
        if (jsonString.startsWith('```json')) {
          jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (jsonString.startsWith('```')) {
          jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }
        
        const analysis = JSON.parse(jsonString)
        const processingTime = Date.now() - startTime
        analysis.metadata = {
          analysisDate: new Date().toISOString(),
          processingTime
        }
        return analysis
      }
    } catch (textError) {
      console.log('Text-only analysis also failed:', textError)
    }
    
    // Fallback to rule-based analysis
    return generateContentBasedAnalysis(url, title, description, copiedText, visualSections, contentHierarchy, startTime)
  }
}

// Generate analysis based on actual page content - content-aware rule-based fallback
function generateContentBasedAnalysis(
  url: string,
  title: string,
  description: string,
  copiedText: string,
  visualSections: any[],
  contentHierarchy: any,
  startTime?: number
): SemanticAnalysisResult {
  const domain = new URL(url).hostname
  const textLower = (copiedText || '').toLowerCase()
  const titleLower = (title || '').toLowerCase()
  const descLower = (description || '').toLowerCase()
  const allText = `${titleLower} ${descLower} ${textLower}`

  // --- Content pattern detection ---
  const ctaPatterns = [
    'sign up', 'get started', 'start free', 'try free', 'buy now', 'subscribe',
    'download', 'learn more', 'request demo', 'book a demo', 'contact us',
    'join now', 'start now', 'free trial', 'create account', 'shop now'
  ]
  const foundCTAs = ctaPatterns.filter(p => textLower.includes(p))

  const trustPatterns = {
    testimonials: /testimonial|"[^"]{20,}"|customer\s+said|review/i.test(copiedText),
    logos: /trusted by|used by|partner|as seen|featured in|logo/i.test(copiedText),
    certifications: /certified|iso|soc\s*2|gdpr|hipaa|compliance|secure/i.test(copiedText),
    statistics: /\d+[%+]|\d{1,3}(,\d{3})+\s*(users|customers|companies|businesses|downloads)/i.test(copiedText),
    caseStudies: /case study|success story|how .+ uses/i.test(copiedText),
  }

  const urgencyPatterns = {
    limitedTime: /limited time|expires|hurry|ending soon|last chance|today only/i.test(copiedText),
    scarcity: /only \d+ left|limited spots|exclusive|few remaining|selling fast/i.test(copiedText),
    countdown: /countdown|timer|hours left|days left/i.test(copiedText),
  }

  const emotionalPatterns = {
    fear: /don't miss|risk|threat|danger|protect|secure|worry|vulnerable/i.test(copiedText),
    aspiration: /transform|achieve|unlock|empower|elevate|grow|scale|success/i.test(copiedText),
    belonging: /join \d+|community|together|team|millions of|thousands of/i.test(copiedText),
    fomo: /everyone|popular|trending|most chosen|best seller|don't miss out/i.test(copiedText),
  }

  const socialProofPatterns = {
    userCounts: /\d+[+k]?\s*(users|customers|companies|businesses|teams)/i.test(copiedText),
    testimonialQuotes: /"[^"]{20,}"/g.test(copiedText),
    brandLogos: /trusted by|used by|companies like|brands like/i.test(copiedText),
    ratings: /\d(\.\d)?\s*(stars?|out of 5|rating|reviews?)/i.test(copiedText),
  }

  // --- Analyze visual sections to determine folds ---
  const totalFolds = Math.min(Math.max(visualSections.length, 3), 10)

  const foldAnalysis: FoldAnalysis[] = visualSections.slice(0, totalFolds).map((section, index) => {
    const foldNumber = index + 1
    const sectionType = (section.type || 'Content Section').toLowerCase()
    const sectionTitle = section.title || `Section ${foldNumber}`
    const sectionContent = (section.content || '').toLowerCase()

    let purpose = 'Provide information and engage users'
    let conversionPoints: string[] = []
    let contentStrategy = 'General content presentation'
    let visualDetails = 'Standard section layout'

    // Detect purpose and conversion points from actual section content
    const sectionCTAs = ctaPatterns.filter(p => sectionContent.includes(p))
    if (sectionCTAs.length > 0) {
      conversionPoints = sectionCTAs.map(cta => `CTA: "${cta}"`)
    }

    if (sectionType.includes('hero') || foldNumber === 1) {
      purpose = 'Capture attention and communicate primary value proposition'
      contentStrategy = sectionContent.includes('free')
        ? 'Leading with free-tier offer to reduce friction'
        : 'Value proposition-first approach to establish relevance'
      visualDetails = 'Above-the-fold hero section, highest visual priority'
      if (conversionPoints.length === 0) conversionPoints = ['Primary hero CTA']
    } else if (sectionType.includes('header') || sectionType.includes('nav')) {
      purpose = 'Provide navigation and establish brand presence'
      conversionPoints = ['Navigation to key pages', 'Brand recognition']
      contentStrategy = 'Navigation-first pattern for orientation'
      visualDetails = 'Top-level navigation bar with brand elements'
    } else if (sectionType.includes('testimonial') || /review|said|quote/i.test(sectionContent)) {
      purpose = 'Build trust and credibility through social proof'
      conversionPoints = ['Trust building via authentic voices', 'Social validation']
      contentStrategy = 'Third-party endorsement to overcome skepticism'
      visualDetails = 'Social proof section with customer voices'
    } else if (sectionType.includes('pricing') || /\$\d|pricing|plan|month/i.test(sectionContent)) {
      purpose = 'Present pricing information and drive purchase decisions'
      conversionPoints = ['Pricing tier selection', 'Purchase intent driver']
      contentStrategy = 'Transparent pricing to reduce friction and enable comparison'
      visualDetails = 'Pricing comparison layout with tier differentiation'
    } else if (sectionType.includes('feature') || /feature|benefit|advantage/i.test(sectionContent)) {
      purpose = 'Showcase product capabilities and differentiation'
      conversionPoints = ['Feature engagement', 'Benefit realization']
      contentStrategy = 'Feature-benefit pairing to demonstrate value'
      visualDetails = 'Feature grid or list with supporting visuals'
    } else if (sectionType.includes('cta') || sectionCTAs.length > 0) {
      purpose = 'Drive user action and conversion'
      contentStrategy = 'Direct response copywriting to compel action'
      visualDetails = 'Conversion-focused section with prominent call-to-action'
    } else if (sectionType.includes('faq') || /frequently|faq|question/i.test(sectionContent)) {
      purpose = 'Address objections and reduce purchase anxiety'
      conversionPoints = ['Objection handling', 'Information completeness']
      contentStrategy = 'Preemptive objection handling to remove barriers'
      visualDetails = 'Q&A format for easy scanning'
    } else if (sectionType.includes('footer')) {
      purpose = 'Provide secondary navigation, legal info, and trust signals'
      conversionPoints = ['Secondary navigation', 'Trust badges']
      contentStrategy = 'Comprehensive footer for completeness and credibility'
      visualDetails = 'Multi-column footer with links and legal information'
    }

    const elements = section.elements || []
    const enrichedElements = elements.length > 0 ? elements.slice(0, 6) : [
      ...(sectionCTAs.length > 0 ? [`CTA button: "${sectionCTAs[0]}"`] : []),
      ...(sectionContent.length > 50 ? ['Text content block'] : []),
      ...(sectionType.includes('hero') ? ['Hero headline', 'Supporting subtext'] : []),
      'Visual elements'
    ]

    return {
      foldNumber,
      title: sectionTitle,
      description: section.content
        ? section.content.substring(0, 250).trim()
        : `${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} section serving as ${purpose.toLowerCase()}`,
      elements: enrichedElements,
      purpose,
      conversionPoints: conversionPoints.length > 0 ? conversionPoints : ['Indirect engagement'],
      visualDetails,
      contentStrategy,
      confidence: section.confidence || 0.7
    }
  })

  // --- Generate page flow ---
  const primaryGoal = determinePrimaryGoal(title, description, domain)
  const userJourney = generateUserJourney(visualSections, contentHierarchy)
  const conversionFunnel = generateConversionFunnel(visualSections, contentHierarchy)

  // --- Generate content-aware insights ---
  const strengths: string[] = []
  const improvements: string[] = []
  const conversionOptimization: string[] = []

  if (foundCTAs.length > 0) strengths.push(`${foundCTAs.length} call-to-action(s) detected: ${foundCTAs.slice(0, 3).map(c => `"${c}"`).join(', ')}`)
  if (trustPatterns.testimonials) strengths.push('Customer testimonials provide third-party validation')
  if (trustPatterns.logos) strengths.push('Brand/partner logos establish credibility through association')
  if (trustPatterns.statistics) strengths.push('Quantitative proof points add concrete credibility')
  if (socialProofPatterns.userCounts) strengths.push('User count social proof demonstrates market traction')
  if (emotionalPatterns.aspiration) strengths.push('Aspirational messaging appeals to user ambitions')
  if (visualSections.length >= 5) strengths.push('Comprehensive page structure with multiple content sections')
  if (strengths.length === 0) strengths.push('Page has basic structure in place')

  if (!trustPatterns.testimonials) improvements.push('Add customer testimonials to build trust (can increase conversions 15-20%)')
  if (!trustPatterns.statistics) improvements.push('Include specific statistics or metrics to add concrete credibility')
  if (!urgencyPatterns.limitedTime && !urgencyPatterns.scarcity) improvements.push('Add urgency or scarcity elements to motivate faster action')
  if (foundCTAs.length < 2) improvements.push('Add more CTA touchpoints throughout the page to capture users at different decision stages')
  if (!socialProofPatterns.ratings) improvements.push('Add star ratings or review scores for quick trust assessment')
  if (!emotionalPatterns.belonging) improvements.push('Add community/belonging messaging (e.g., "Join 10,000+ teams")')

  if (foundCTAs.length > 0) {
    conversionOptimization.push(`Strengthen existing CTAs ("${foundCTAs[0]}") with benefit-oriented copy and contrasting button colors`)
  } else {
    conversionOptimization.push('Add prominent, benefit-oriented CTAs above the fold and after key content sections')
  }
  conversionOptimization.push('Implement a sticky header CTA for persistent conversion access')
  if (!urgencyPatterns.limitedTime) conversionOptimization.push('Test time-limited offers to create urgency')
  conversionOptimization.push('A/B test headline variations focusing on different value proposition angles')

  // --- Generate messaging frameworks from content ---
  const messagingFrameworks = generateMessagingFrameworks(visualSections, contentHierarchy, foldAnalysis, copiedText)

  // --- Build persuasion inventory ---
  const persuasionInventory = {
    trustSignals: [
      ...(trustPatterns.testimonials ? ['Customer testimonials detected'] : []),
      ...(trustPatterns.logos ? ['Partner/client logos present'] : []),
      ...(trustPatterns.certifications ? ['Security/compliance certifications shown'] : []),
      ...(trustPatterns.statistics ? ['Quantitative statistics referenced'] : []),
      ...(trustPatterns.caseStudies ? ['Case studies or success stories present'] : []),
    ],
    urgencyTriggers: [
      ...(urgencyPatterns.limitedTime ? ['Limited-time offer messaging'] : []),
      ...(urgencyPatterns.scarcity ? ['Scarcity-based messaging'] : []),
      ...(urgencyPatterns.countdown ? ['Countdown timer element'] : []),
    ],
    emotionalTriggers: [
      ...(emotionalPatterns.fear ? ['Fear/protection-based messaging'] : []),
      ...(emotionalPatterns.aspiration ? ['Aspirational/growth messaging'] : []),
      ...(emotionalPatterns.belonging ? ['Community/belonging messaging'] : []),
      ...(emotionalPatterns.fomo ? ['Fear of missing out (FOMO) messaging'] : []),
    ],
    socialProof: [
      ...(socialProofPatterns.userCounts ? ['User/customer count displayed'] : []),
      ...(socialProofPatterns.testimonialQuotes ? ['Direct customer quotes'] : []),
      ...(socialProofPatterns.brandLogos ? ['Trusted-by brand logos'] : []),
      ...(socialProofPatterns.ratings ? ['Star ratings or review scores'] : []),
    ],
  }

  const analysis: SemanticAnalysisResult = {
    pageFlow: {
      totalFolds,
      primaryGoal,
      userJourney,
      conversionFunnel
    },
    foldAnalysis,
    insights: { strengths, improvements, conversionOptimization },
    messagingFrameworks,
    persuasionInventory,
    metadata: {
      analysisDate: new Date().toISOString(),
      processingTime: startTime ? Date.now() - startTime : 500,
    }
  }

  return analysis
}

// Helper functions for content analysis
function determinePrimaryGoal(title: string, description: string, domain: string): string {
  const titleLower = title.toLowerCase()
  const descLower = description.toLowerCase()
  
  if (titleLower.includes('startup') || descLower.includes('startup')) {
    return "Convert startups to use the platform's services and tools"
  } else if (titleLower.includes('terminal') || descLower.includes('terminal')) {
    return "Drive adoption of point-of-sale and terminal solutions"
  } else if (titleLower.includes('connect') || descLower.includes('connect')) {
    return "Enable platform and marketplace payment integration"
  } else if (titleLower.includes('capital') || descLower.includes('capital')) {
    return "Provide business financing and capital solutions"
  } else if (domain.includes('expressvpn')) {
    return "Convert users to VPN subscription service"
  } else {
    return "Drive user engagement and conversion through the platform"
  }
}

function generateUserJourney(visualSections: any[], contentHierarchy: any): string[] {
  const journey = ['Initial page load and navigation']
  
  // Add journey steps based on section types
  const sectionTypes = visualSections.map(s => s.type?.toLowerCase() || 'content')
  
  if (sectionTypes.includes('hero')) {
    journey.push('Value proposition and main message engagement')
  }
  if (sectionTypes.includes('content section')) {
    journey.push('Information consumption and feature exploration')
  }
  if (sectionTypes.includes('testimonial')) {
    journey.push('Social proof validation and trust building')
  }
  if (sectionTypes.includes('pricing')) {
    journey.push('Pricing evaluation and decision making')
  }
  if (sectionTypes.includes('cta')) {
    journey.push('Conversion action and engagement')
  }
  
  return journey
}

function generateConversionFunnel(visualSections: any[], contentHierarchy: any): string[] {
  const funnel = ['Awareness: Page discovery and initial engagement']
  
  const sectionTypes = visualSections.map(s => s.type?.toLowerCase() || 'content')
  
  if (sectionTypes.includes('hero')) {
    funnel.push('Interest: Value proposition and primary message')
  }
  if (sectionTypes.includes('content section')) {
    funnel.push('Consideration: Feature and benefit evaluation')
  }
  if (sectionTypes.includes('testimonial')) {
    funnel.push('Trust: Social proof and credibility building')
  }
  if (sectionTypes.includes('pricing')) {
    funnel.push('Intent: Pricing and value assessment')
  }
  if (sectionTypes.includes('cta')) {
    funnel.push('Action: Conversion and engagement')
  }
  
  return funnel
}

function generateInsights(visualSections: any[], contentHierarchy: any, copiedText: string): {
  strengths: string[]
  improvements: string[]
  conversionOptimization: string[]
} {
  const strengths: string[] = []
  const improvements: string[] = []
  const conversionOptimization: string[] = []
  
  // Analyze visual sections for strengths
  const sectionTypes = visualSections.map(s => s.type?.toLowerCase() || 'content')
  
  if (sectionTypes.includes('hero')) {
    strengths.push('Clear hero section with value proposition')
  }
  if (sectionTypes.includes('testimonial')) {
    strengths.push('Social proof and testimonials present')
  }
  if (sectionTypes.includes('cta')) {
    strengths.push('Multiple conversion points identified')
  }
  if (visualSections.length > 5) {
    strengths.push('Comprehensive content structure with multiple sections')
  }
  
  // Generate improvements based on missing elements
  if (!sectionTypes.includes('testimonial')) {
    improvements.push('Consider adding customer testimonials for social proof')
  }
  if (!sectionTypes.includes('pricing')) {
    improvements.push('Pricing information could be more prominent')
  }
  if (visualSections.length < 4) {
    improvements.push('Page could benefit from more detailed content sections')
  }
  
  // Conversion optimization suggestions
  conversionOptimization.push('Optimize CTA placement and visibility')
  conversionOptimization.push('Consider adding urgency elements to drive action')
  conversionOptimization.push('A/B test different value proposition messaging')
  
  return {
    strengths: strengths.length > 0 ? strengths : ['Well-structured page layout'],
    improvements: improvements.length > 0 ? improvements : ['Page structure is solid'],
    conversionOptimization
  }
}

export async function POST(request: NextRequest) {
  const requestId = `semantic-analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  try {
    console.log('Semantic analysis request started', { requestId })
    
    const body = await request.json()
    console.log('Request body parsed successfully', { requestId, body })
    
    const { landingPageId } = body

    if (!landingPageId) {
      return NextResponse.json(
        { success: false, error: 'Landing page ID is required' },
        { status: 400 }
      )
    }

    // Fetch the landing page data
    const landingPage = await prisma.landingPage.findUnique({
      where: { id: landingPageId },
      include: { competitor: true }
    })

    if (!landingPage) {
      return NextResponse.json(
        { success: false, error: 'Landing page not found' },
        { status: 404 }
      )
    }

    console.log('Starting LLM analysis', { 
      requestId, 
      url: landingPage.url,
      title: landingPage.title 
    })

    // Check if this is a basic/placeholder page that doesn't need complex analysis
    if (isBasicPlaceholderPage(
      landingPage.url,
      landingPage.title || '',
      landingPage.description || '',
      landingPage.copiedText || ''
    )) {
      console.log('Basic/placeholder page detected, skipping complex analysis', { 
        requestId, 
        url: landingPage.url 
      })
      
      // Return a simple analysis for basic pages
      const basicAnalysis = {
        pageFlow: {
          totalFolds: 1,
          primaryGoal: "This is a basic placeholder page with no meaningful content to analyze",
          userJourney: ["Page load", "Basic content view"],
          conversionFunnel: ["Awareness"]
        },
        foldAnalysis: [{
          foldNumber: 1,
          title: "Basic Content",
          description: "This page contains only basic placeholder content with no frameworks or design elements to analyze",
          elements: ["Basic text", "Simple HTML"],
          purpose: "Placeholder or example content",
          conversionPoints: [],
          confidence: 0.9
        }],
        insights: {
          strengths: ["Simple and lightweight"],
          improvements: ["This is a placeholder page - no meaningful analysis possible"],
          conversionOptimization: ["Not applicable for placeholder content"]
        },
        messagingFrameworks: {
          primaryFramework: "None",
          secondaryFrameworks: [],
          frameworkAnalysis: "This is a basic placeholder page with no messaging frameworks to analyze",
          frameworkEvidence: [],
          frameworkMapping: [],
          missingElements: [{
            issue: "This is placeholder content",
            impact: "No meaningful analysis possible",
            recommendation: "Analyze a real website with actual content"
          }],
          conversionScores: []
        },
        metadata: {
          analysisDate: new Date().toISOString(),
          processingTime: 50,
          confidence: 0.9
        }
      }

      // Update the landing page with basic analysis
      await prisma.landingPage.update({
        where: { id: landingPageId },
        data: {
          semanticAnalysis: JSON.stringify(basicAnalysis),
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        analysis: basicAnalysis,
        message: "Basic placeholder page detected - simplified analysis provided"
      })
    }

    // Parse existing data
    const visualSections = landingPage.visualSections ? JSON.parse(landingPage.visualSections) : []
    const contentHierarchy = landingPage.contentHierarchy ? JSON.parse(landingPage.contentHierarchy) : {}

    // Perform LLM analysis
    const analysisResult = await analyzePageWithLLM(
      landingPage.url,
      landingPage.title || '',
      landingPage.description || '',
      landingPage.copiedText || '',
      visualSections,
      contentHierarchy,
      landingPage.screenshotUrl || ''
    )

    console.log('LLM analysis completed', { 
      requestId, 
      totalFolds: analysisResult.pageFlow.totalFolds,
      confidence: analysisResult.metadata.confidence
    })

    // Save analysis to database
    const updatedLandingPage = await prisma.landingPage.update({
      where: { id: landingPageId },
      data: {
        semanticAnalysis: JSON.stringify(analysisResult),
        updatedAt: new Date()
      }
    })

    console.log('Semantic analysis saved to database', { 
      requestId, 
      landingPageId 
    })

    return NextResponse.json({
      success: true,
      requestId,
      analysis: analysisResult,
      message: 'Semantic analysis completed successfully'
    })

  } catch (error) {
    console.error('Semantic analysis request failed', error, { 
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        requestId 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const landingPageId = searchParams.get('landingPageId')

  if (!landingPageId) {
    return NextResponse.json(
      { success: false, error: 'Landing page ID is required' },
      { status: 400 }
    )
  }

  try {
    const landingPage = await prisma.landingPage.findUnique({
      where: { id: landingPageId },
      select: { semanticAnalysis: true }
    })

    if (!landingPage) {
      return NextResponse.json(
        { success: false, error: 'Landing page not found' },
        { status: 404 }
      )
    }

    const analysis = landingPage.semanticAnalysis ? JSON.parse(landingPage.semanticAnalysis) : null

    return NextResponse.json({
      success: true,
      analysis
    })

  } catch (error) {
    console.error('Failed to fetch semantic analysis', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// Generate enhanced messaging framework analysis with linguistic pattern detection
function generateMessagingFrameworks(visualSections: any[], contentHierarchy: any, foldAnalysis: any[], copiedText?: string): any {
  const allSectionContent = visualSections.map(s => s.content || '').join(' ')
  const text = copiedText || allSectionContent
  const textLower = text.toLowerCase()

  // --- Detailed framework detection with evidence and confidence scoring ---
  interface FrameworkDetection {
    name: string
    confidence: number
    evidence: string[]
    stageMapping: { stage: string; evidence: string; foldHint: string }[]
  }

  const detections: FrameworkDetection[] = []

  // AIDA detection
  const aidaSignals = {
    attention: [] as string[],
    interest: [] as string[],
    desire: [] as string[],
    action: [] as string[],
  }
  // Attention: bold headlines, exclamations, large claims
  if (/introducing|announcing|discover|meet\s/i.test(text)) aidaSignals.attention.push('Attention-grabbing opener detected')
  if (foldAnalysis.length > 0 && foldAnalysis[0].elements?.length > 0) aidaSignals.attention.push('Hero section with headline elements')
  // Interest: features, how it works, explanations
  if (/how it works|features|why\s+(choose|use)|what you get/i.test(text)) aidaSignals.interest.push('Feature/explanation section builds interest')
  if (/learn more|explore|see how/i.test(text)) aidaSignals.interest.push('Interest-building CTA language found')
  // Desire: testimonials, results, benefits, emotional language
  if (/testimonial|review|customer|"[^"]{15,}"|result|transform|achieve|love/i.test(text)) aidaSignals.desire.push('Desire-stage social proof or emotional content')
  if (/save|earn|grow|increase|boost|improve|faster|easier|better/i.test(text)) aidaSignals.desire.push('Benefit-oriented desire language')
  // Action: CTAs
  if (/sign up|get started|buy now|subscribe|try free|start free|create account|download/i.test(text)) aidaSignals.action.push('Direct action CTA detected')
  const aidaScore = Object.values(aidaSignals).filter(arr => arr.length > 0).length
  if (aidaScore >= 2) {
    const evidence = Object.entries(aidaSignals).flatMap(([stage, items]) => items.map(item => `${stage.charAt(0).toUpperCase() + stage.slice(1)}: ${item}`))
    detections.push({
      name: 'AIDA',
      confidence: aidaScore / 4,
      evidence,
      stageMapping: Object.entries(aidaSignals).filter(([, items]) => items.length > 0).map(([stage, items]) => ({
        stage: stage.charAt(0).toUpperCase() + stage.slice(1),
        evidence: items[0],
        foldHint: stage === 'attention' ? 'Fold 1' : stage === 'action' ? `Fold ${foldAnalysis.length}` : 'Mid-page folds'
      }))
    })
  }

  // PAS detection
  const pasSignals = {
    problem: [] as string[],
    agitation: [] as string[],
    solution: [] as string[],
  }
  if (/problem|challenge|struggle|pain|frustrat|difficult|hard to|tired of|sick of|overwhelm/i.test(text)) pasSignals.problem.push('Problem identification language found')
  if (/don't let|imagine if|without .+ you|cost of inaction|what happens when|worse|risk/i.test(text)) pasSignals.agitation.push('Agitation language amplifies pain points')
  if (/but now|that's why|the answer|the solution|we help|we solve|finally|introducing/i.test(text)) pasSignals.solution.push('Solution positioning language detected')
  if (/problem|issue|challenge/i.test(text) && /solut|fix|resolv|answer/i.test(text)) pasSignals.solution.push('Explicit problem-to-solution narrative arc')
  const pasScore = Object.values(pasSignals).filter(arr => arr.length > 0).length
  if (pasScore >= 2) {
    const evidence = Object.entries(pasSignals).flatMap(([stage, items]) => items.map(item => `${stage.charAt(0).toUpperCase() + stage.slice(1)}: ${item}`))
    detections.push({
      name: 'PAS',
      confidence: pasScore / 3,
      evidence,
      stageMapping: Object.entries(pasSignals).filter(([, items]) => items.length > 0).map(([stage, items]) => ({
        stage: stage.charAt(0).toUpperCase() + stage.slice(1),
        evidence: items[0],
        foldHint: stage === 'problem' ? 'Early folds' : stage === 'solution' ? 'Mid-to-late folds' : 'Mid folds'
      }))
    })
  }

  // FAB detection
  const fabSignals = {
    features: [] as string[],
    advantages: [] as string[],
    benefits: [] as string[],
  }
  if (/features?|capabilities|tools|built[- ]in|integrat|support for/i.test(text)) fabSignals.features.push('Feature listing language detected')
  if (/unlike|compared to|better than|faster than|more than|advantage|edge|stand out/i.test(text)) fabSignals.advantages.push('Competitive advantage positioning found')
  if (/benefit|you'll get|you can|enables you|helps you|so you|which means|result/i.test(text)) fabSignals.benefits.push('User benefit language detected')
  if (/save time|save money|increase revenue|reduce cost|improve efficiency/i.test(text)) fabSignals.benefits.push('Concrete benefit outcome stated')
  const fabScore = Object.values(fabSignals).filter(arr => arr.length > 0).length
  if (fabScore >= 2) {
    const evidence = Object.entries(fabSignals).flatMap(([stage, items]) => items.map(item => `${stage.charAt(0).toUpperCase() + stage.slice(1)}: ${item}`))
    detections.push({
      name: 'FAB',
      confidence: fabScore / 3,
      evidence,
      stageMapping: Object.entries(fabSignals).filter(([, items]) => items.length > 0).map(([stage, items]) => ({
        stage: stage.charAt(0).toUpperCase() + stage.slice(1),
        evidence: items[0],
        foldHint: 'Feature/benefit sections'
      }))
    })
  }

  // BAB detection (Before-After-Bridge)
  const babSignals = {
    before: [] as string[],
    after: [] as string[],
    bridge: [] as string[],
  }
  if (/before|used to|old way|traditionally|without|struggling/i.test(text)) babSignals.before.push('Before-state description found')
  if (/after|now you|imagine|with .+ you can|new way|transformed/i.test(text)) babSignals.after.push('After-state vision presented')
  if (/that's where|this is how|bridge|connect|makes it possible|enables/i.test(text)) babSignals.bridge.push('Bridge positioning connects before to after')
  const babScore = Object.values(babSignals).filter(arr => arr.length > 0).length
  if (babScore >= 2) {
    const evidence = Object.entries(babSignals).flatMap(([stage, items]) => items.map(item => `${stage.charAt(0).toUpperCase() + stage.slice(1)}: ${item}`))
    detections.push({
      name: 'BAB',
      confidence: babScore / 3,
      evidence,
      stageMapping: Object.entries(babSignals).filter(([, items]) => items.length > 0).map(([stage, items]) => ({
        stage: stage.charAt(0).toUpperCase() + stage.slice(1),
        evidence: items[0],
        foldHint: 'Narrative sections'
      }))
    })
  }

  // StoryBrand detection
  const storyBrandSignals: string[] = []
  if (/you are|you're the|your journey|your story/i.test(text)) storyBrandSignals.push('Character (user as hero) positioning')
  if (/we guide|we help|our team|our experts|trust us/i.test(text)) storyBrandSignals.push('Guide (brand as mentor) positioning')
  if (/step 1|step 2|simple steps|easy steps|how to|plan/i.test(text)) storyBrandSignals.push('Clear plan laid out for the hero')
  if (/success|win|achieve|reach your|goal/i.test(text)) storyBrandSignals.push('Success outcome defined')
  if (/avoid|don't miss|risk|fail|without/i.test(text)) storyBrandSignals.push('Failure stakes established')
  if (storyBrandSignals.length >= 3) {
    detections.push({
      name: 'StoryBrand',
      confidence: Math.min(storyBrandSignals.length / 5, 1),
      evidence: storyBrandSignals,
      stageMapping: storyBrandSignals.map(e => ({ stage: 'StoryBrand Element', evidence: e, foldHint: 'Throughout page' }))
    })
  }

  // 4Ps detection (Promise, Picture, Proof, Push)
  const fourPsSignals = {
    promise: [] as string[],
    picture: [] as string[],
    proof: [] as string[],
    push: [] as string[],
  }
  if (/promise|guarantee|we will|you will|you'll/i.test(text)) fourPsSignals.promise.push('Promise/guarantee language')
  if (/imagine|picture|think about|visualize|what if/i.test(text)) fourPsSignals.picture.push('Picture/visualization language')
  if (/proof|proven|trusted by|case study|\d+\s*(customers|users|companies)|testimonial/i.test(text)) fourPsSignals.proof.push('Proof elements present')
  if (/now|today|don't wait|act|hurry|limited/i.test(text)) fourPsSignals.push.push('Push/urgency language')
  const fourPsScore = Object.values(fourPsSignals).filter(arr => arr.length > 0).length
  if (fourPsScore >= 2) {
    const evidence = Object.entries(fourPsSignals).flatMap(([stage, items]) => items.map(item => `${stage.charAt(0).toUpperCase() + stage.slice(1)}: ${item}`))
    detections.push({
      name: '4Ps',
      confidence: fourPsScore / 4,
      evidence,
      stageMapping: Object.entries(fourPsSignals).filter(([, items]) => items.length > 0).map(([stage, items]) => ({
        stage: stage.charAt(0).toUpperCase() + stage.slice(1),
        evidence: items[0],
        foldHint: 'Various sections'
      }))
    })
  }

  // QUEST detection (Qualify, Understand, Educate, Stimulate, Transition)
  const questSignals = {
    qualify: [] as string[],
    understand: [] as string[],
    educate: [] as string[],
    stimulate: [] as string[],
    transition: [] as string[],
  }
  if (/are you|do you|if you're|for .+ who|designed for|built for/i.test(text)) questSignals.qualify.push('Qualifying question or audience targeting')
  if (/we understand|we know|you need|you want|your\s+(challenge|goal|need)/i.test(text)) questSignals.understand.push('Understanding/empathy language')
  if (/how it works|learn|did you know|here's why|the truth|guide|tutorial/i.test(text)) questSignals.educate.push('Educational content elements')
  if (/imagine|what if|picture|think about|results|outcome/i.test(text)) questSignals.stimulate.push('Stimulation/visualization language')
  if (/get started|sign up|try|next step|ready to|let's/i.test(text)) questSignals.transition.push('Transition-to-action language')
  // Question-based headings are a strong QUEST indicator
  const questionCount = (text.match(/\?/g) || []).length
  if (questionCount >= 3) questSignals.qualify.push(`${questionCount} question marks suggest question-based engagement`)
  const questScore = Object.values(questSignals).filter(arr => arr.length > 0).length
  if (questScore >= 3) {
    const evidence = Object.entries(questSignals).flatMap(([stage, items]) => items.map(item => `${stage.charAt(0).toUpperCase() + stage.slice(1)}: ${item}`))
    detections.push({
      name: 'QUEST',
      confidence: questScore / 5,
      evidence,
      stageMapping: Object.entries(questSignals).filter(([, items]) => items.length > 0).map(([stage, items]) => ({
        stage: stage.charAt(0).toUpperCase() + stage.slice(1),
        evidence: items[0],
        foldHint: stage === 'qualify' ? 'Opening folds' : stage === 'transition' ? 'Closing folds' : 'Mid-page folds'
      }))
    })
  }

  // Sort by confidence descending
  detections.sort((a, b) => b.confidence - a.confidence)

  const primaryDetection = detections[0]
  const primaryFramework = primaryDetection?.name || 'AIDA'
  const secondaryFrameworks = detections.slice(1).map(d => d.name)

  // --- Build framework mapping per fold ---
  const frameworkMapping = foldAnalysis.map((fold, index) => {
    // Find which framework stage best matches this fold's position and content
    let matchedFramework = primaryFramework
    let stage = 'General'
    let evidence = fold.purpose || ''

    if (primaryDetection) {
      const stageIndex = Math.min(index, primaryDetection.stageMapping.length - 1)
      if (stageIndex >= 0 && primaryDetection.stageMapping[stageIndex]) {
        stage = primaryDetection.stageMapping[stageIndex].stage
        evidence = primaryDetection.stageMapping[stageIndex].evidence
      }
    }

    return {
      section: fold.title,
      framework: matchedFramework,
      elements: {
        stage,
        evidence
      },
      notes: `Fold ${fold.foldNumber} serves the ${stage} stage of ${matchedFramework} — ${evidence}`
    }
  })

  // --- Generate missing elements based on what the primary framework expects ---
  const missingElements: { issue: string; impact: string; recommendation: string }[] = []

  if (primaryFramework === 'AIDA') {
    if (!aidaSignals?.desire?.length) missingElements.push({ issue: 'Missing Desire stage content (testimonials, emotional appeal, benefit visualization)', impact: 'Users may understand the product but lack emotional motivation to act', recommendation: 'Add customer testimonials, success metrics, or aspirational imagery between features and CTA' })
    if (!aidaSignals?.action?.length) missingElements.push({ issue: 'No clear call-to-action detected', impact: 'Users have no clear next step, causing drop-off', recommendation: 'Add prominent CTAs with benefit-oriented copy (e.g., "Start saving time today")' })
  } else if (primaryFramework === 'PAS') {
    if (!pasSignals?.agitation?.length) missingElements.push({ issue: 'Problem identified but not agitated — missing emotional amplification', impact: 'Users may not feel urgency to solve the problem', recommendation: 'Add content that highlights the cost of inaction or worsening consequences' })
  } else if (primaryFramework === 'FAB') {
    if (!fabSignals?.benefits?.length) missingElements.push({ issue: 'Features listed but user benefits not explicitly stated', impact: 'Users see what the product does but not why it matters to them', recommendation: 'Rewrite feature descriptions to lead with user outcomes (e.g., "Save 5 hours/week" instead of "Automated scheduling")' })
  }

  // Universal missing element checks
  if (!/(testimonial|review|customer said|"[^"]{20,}")/i.test(text)) {
    missingElements.push({ issue: 'No customer testimonials or reviews detected', impact: 'Missing social proof can reduce trust by 20-30%', recommendation: 'Add 2-3 customer testimonials with names, roles, and specific results' })
  }
  if (!/(guarantee|risk.free|money.back|refund)/i.test(text)) {
    missingElements.push({ issue: 'No risk-reversal elements (guarantees, free trials)', impact: 'Purchase anxiety may prevent conversion', recommendation: 'Add a money-back guarantee, free trial, or risk-free messaging near CTAs' })
  }

  // --- Generate conversion scores based on fold content quality ---
  const conversionScores = foldAnalysis.map((fold) => {
    const content = (fold.description || '').toLowerCase()
    let score = 5 // baseline

    // Boost for CTAs
    if (fold.conversionPoints && fold.conversionPoints.length > 0 && !fold.conversionPoints.includes('Indirect engagement')) score += 1
    // Boost for specific content
    if (/benefit|result|save|grow|improve/i.test(content)) score += 1
    // Boost for social proof
    if (/testimonial|customer|review|trusted/i.test(content)) score += 1
    // Boost for clear purpose
    if (fold.purpose && fold.purpose !== 'Provide information and engage users') score += 1
    // Cap at 10
    score = Math.min(score, 10)

    const matchedDetection = detections.find(d => d.name === primaryFramework)
    return {
      fold: fold.title,
      framework: primaryFramework,
      score,
      notes: score >= 8 ? `Strong conversion potential — clear purpose and persuasive elements`
           : score >= 6 ? `Good foundation but could be strengthened with more persuasive elements`
           : `Needs improvement — consider adding social proof, benefits, or clearer CTAs`
    }
  })

  // --- Build detailed framework analysis text ---
  const evidenceSummary = detections.map(d => `${d.name} (${Math.round(d.confidence * 100)}% confidence): ${d.evidence.slice(0, 2).join('; ')}`).join('. ')
  const frameworkAnalysis = detections.length > 0
    ? `This page primarily employs the ${primaryFramework} framework${secondaryFrameworks.length > 0 ? ` with secondary elements of ${secondaryFrameworks.join(', ')}` : ''}. ${evidenceSummary}. The messaging progresses through ${primaryDetection?.stageMapping.map(s => s.stage).join(' → ') || 'multiple stages'} to guide users toward conversion.`
    : 'No strong messaging framework detected. The page content appears to lack a structured persuasion flow, which may reduce conversion effectiveness. Consider restructuring content to follow AIDA or PAS framework.'

  const allEvidence = detections.flatMap(d => d.evidence.map(e => `[${d.name}] ${e}`))

  return {
    primaryFramework,
    secondaryFrameworks,
    frameworkAnalysis,
    frameworkEvidence: allEvidence.length > 0 ? allEvidence : ['No strong framework signals detected — page may benefit from structured messaging'],
    frameworkMapping,
    missingElements,
    conversionScores
  }
}
