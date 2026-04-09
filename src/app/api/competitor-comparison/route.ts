import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ---- Types ----

interface FrameworkUsageEntry {
  framework: string
  usedBy: string[]
  frequency: number
  avgScore: number
  verdict: 'dominant' | 'common' | 'rare'
}

interface CommonPattern {
  pattern: string
  foundIn: string[]
  importance: 'high' | 'medium' | 'low'
}

interface StructureEntry {
  competitor: string
  pageTitle: string
  totalFolds: number
  primaryFramework: string
  primaryGoal: string
  strengths: string[]
  weaknesses: string[]
}

interface Recommendation {
  title: string
  description: string
  priority: 'must-have' | 'should-have' | 'nice-to-have'
  basedOn: string[]
}

interface BlueprintFold {
  foldNumber: number
  purpose: string
  elements: string[]
  framework: string
}

interface Blueprint {
  recommendedFramework: string
  recommendedFolds: BlueprintFold[]
  mustHaveElements: string[]
  avoidElements: string[]
}

interface ComparisonReport {
  pagesCompared: number
  competitors: string[]
  frameworkUsage: FrameworkUsageEntry[]
  commonPatterns: CommonPattern[]
  structureComparison: StructureEntry[]
  recommendations: Recommendation[]
  blueprint: Blueprint
}

// ---- Helpers ----

interface ParsedPage {
  competitorName: string
  pageTitle: string
  analysis: any
}

function safeParseJSON(str: string | null): any | null {
  if (!str) return null
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

function getCompetitorName(page: any): string {
  return page.competitor?.name || new URL(page.url).hostname
}

/**
 * Extract all framework names referenced in a semantic analysis object.
 * Looks at primaryFramework, secondaryFrameworks, and per-fold framework mappings.
 */
function extractFrameworks(analysis: any): string[] {
  const frameworks: string[] = []

  const mf = analysis.messagingFrameworks
  if (mf) {
    if (mf.primaryFramework && mf.primaryFramework !== 'None') {
      frameworks.push(mf.primaryFramework)
    }
    if (Array.isArray(mf.secondaryFrameworks)) {
      frameworks.push(...mf.secondaryFrameworks.filter((f: string) => f && f !== 'None'))
    }
    if (Array.isArray(mf.frameworkMapping)) {
      for (const mapping of mf.frameworkMapping) {
        if (mapping.framework && mapping.framework !== 'None' && !frameworks.includes(mapping.framework)) {
          frameworks.push(mapping.framework)
        }
      }
    }
  }

  return [...new Set(frameworks)]
}

/**
 * Compute average conversion score from conversionScores array for a given framework.
 */
function avgScoreForFramework(analysis: any, framework: string): number {
  const scores = analysis.messagingFrameworks?.conversionScores
  if (!Array.isArray(scores) || scores.length === 0) return 5

  const matching = scores.filter((s: any) => s.framework === framework)
  if (matching.length === 0) return 5

  const total = matching.reduce((sum: number, s: any) => sum + (s.score || 5), 0)
  return Math.round((total / matching.length) * 10) / 10
}

// ---- Synthesis functions ----

function buildFrameworkUsage(pages: ParsedPage[]): FrameworkUsageEntry[] {
  // framework -> { competitors: Set, totalScore, scoreCount }
  const map = new Map<string, { competitors: Set<string>; totalScore: number; scoreCount: number }>()

  for (const p of pages) {
    const frameworks = extractFrameworks(p.analysis)
    for (const fw of frameworks) {
      if (!map.has(fw)) {
        map.set(fw, { competitors: new Set(), totalScore: 0, scoreCount: 0 })
      }
      const entry = map.get(fw)!
      entry.competitors.add(p.competitorName)
      const score = avgScoreForFramework(p.analysis, fw)
      entry.totalScore += score
      entry.scoreCount += 1
    }
  }

  const totalPages = pages.length
  const entries: FrameworkUsageEntry[] = []

  for (const [framework, data] of map.entries()) {
    const frequency = data.competitors.size
    const avgScore = Math.round((data.totalScore / data.scoreCount) * 10) / 10
    let verdict: 'dominant' | 'common' | 'rare'
    if (frequency >= totalPages * 0.7) {
      verdict = 'dominant'
    } else if (frequency >= totalPages * 0.3) {
      verdict = 'common'
    } else {
      verdict = 'rare'
    }

    entries.push({
      framework,
      usedBy: [...data.competitors],
      frequency,
      avgScore,
      verdict,
    })
  }

  // Sort by frequency desc, then avgScore desc
  entries.sort((a, b) => b.frequency - a.frequency || b.avgScore - a.avgScore)
  return entries
}

function buildCommonPatterns(pages: ParsedPage[]): CommonPattern[] {
  const patterns: CommonPattern[] = []
  const totalPages = pages.length

  // Pattern detectors: each returns { detected: boolean } per page
  const detectors: Array<{
    id: string
    label: string
    importance: 'high' | 'medium' | 'low'
    detect: (analysis: any) => boolean
  }> = [
    {
      id: 'hero_section',
      label: 'Hero section with clear value proposition above the fold',
      importance: 'high',
      detect: (a) => {
        const folds = a.foldAnalysis || []
        return folds.some((f: any) =>
          (f.title || '').toLowerCase().includes('hero') ||
          (f.purpose || '').toLowerCase().includes('value proposition')
        )
      },
    },
    {
      id: 'social_proof',
      label: 'Social proof / testimonials section',
      importance: 'high',
      detect: (a) => {
        const folds = a.foldAnalysis || []
        const strengths = a.insights?.strengths || []
        return (
          folds.some((f: any) =>
            (f.title || '').toLowerCase().includes('testimonial') ||
            (f.purpose || '').toLowerCase().includes('social proof') ||
            (f.purpose || '').toLowerCase().includes('trust')
          ) ||
          strengths.some((s: string) => s.toLowerCase().includes('testimonial') || s.toLowerCase().includes('social proof'))
        )
      },
    },
    {
      id: 'multiple_ctas',
      label: 'Multiple conversion points / CTAs throughout the page',
      importance: 'high',
      detect: (a) => {
        const folds = a.foldAnalysis || []
        const ctaFolds = folds.filter((f: any) => {
          const cp = f.conversionPoints || []
          return cp.length > 0
        })
        return ctaFolds.length >= 2
      },
    },
    {
      id: 'pricing_section',
      label: 'Dedicated pricing or plan comparison section',
      importance: 'medium',
      detect: (a) => {
        const folds = a.foldAnalysis || []
        return folds.some((f: any) =>
          (f.title || '').toLowerCase().includes('pricing') ||
          (f.purpose || '').toLowerCase().includes('pricing')
        )
      },
    },
    {
      id: 'feature_breakdown',
      label: 'Feature / benefit breakdown section',
      importance: 'medium',
      detect: (a) => {
        const folds = a.foldAnalysis || []
        return folds.some((f: any) =>
          (f.purpose || '').toLowerCase().includes('feature') ||
          (f.purpose || '').toLowerCase().includes('benefit') ||
          (f.elements || []).some((e: string) => e.toLowerCase().includes('feature'))
        )
      },
    },
    {
      id: 'problem_solution',
      label: 'Problem-solution narrative structure',
      importance: 'medium',
      detect: (a) => {
        const fw = a.messagingFrameworks
        if (!fw) return false
        return (
          fw.primaryFramework === 'PAS' ||
          (fw.secondaryFrameworks || []).includes('PAS') ||
          (fw.frameworkAnalysis || '').toLowerCase().includes('problem')
        )
      },
    },
    {
      id: 'urgency_elements',
      label: 'Urgency or scarcity elements to drive action',
      importance: 'low',
      detect: (a) => {
        const folds = a.foldAnalysis || []
        return folds.some((f: any) =>
          (f.elements || []).some((e: string) =>
            e.toLowerCase().includes('urgency') || e.toLowerCase().includes('scarcity') || e.toLowerCase().includes('limited')
          )
        )
      },
    },
    {
      id: 'navigation',
      label: 'Prominent header navigation with key links',
      importance: 'low',
      detect: (a) => {
        const folds = a.foldAnalysis || []
        return folds.some((f: any) =>
          (f.title || '').toLowerCase().includes('header') ||
          (f.title || '').toLowerCase().includes('navigation') ||
          (f.purpose || '').toLowerCase().includes('navigation')
        )
      },
    },
  ]

  for (const det of detectors) {
    const foundIn: string[] = []
    for (const p of pages) {
      if (det.detect(p.analysis)) {
        foundIn.push(p.competitorName)
      }
    }
    if (foundIn.length > 0) {
      patterns.push({
        pattern: det.label,
        foundIn,
        importance: det.importance,
      })
    }
  }

  // Sort: high first, then by how many competitors use it
  const importanceOrder = { high: 0, medium: 1, low: 2 }
  patterns.sort((a, b) => importanceOrder[a.importance] - importanceOrder[b.importance] || b.foundIn.length - a.foundIn.length)

  return patterns
}

function buildStructureComparison(pages: ParsedPage[]): StructureEntry[] {
  return pages.map((p) => {
    const a = p.analysis
    const pageFlow = a.pageFlow || {}
    const insights = a.insights || {}
    const mf = a.messagingFrameworks || {}

    return {
      competitor: p.competitorName,
      pageTitle: p.pageTitle,
      totalFolds: pageFlow.totalFolds || (a.foldAnalysis || []).length || 0,
      primaryFramework: mf.primaryFramework || 'Unknown',
      primaryGoal: pageFlow.primaryGoal || 'Unknown',
      strengths: insights.strengths || [],
      weaknesses: [
        ...(insights.improvements || []),
        ...(mf.missingElements || []).map((me: any) => me.issue || me),
      ],
    }
  })
}

function buildRecommendations(
  pages: ParsedPage[],
  frameworkUsage: FrameworkUsageEntry[],
  commonPatterns: CommonPattern[],
  structureComparison: StructureEntry[]
): Recommendation[] {
  const recommendations: Recommendation[] = []

  // 1. Recommend the dominant framework
  const dominant = frameworkUsage.find((f) => f.verdict === 'dominant')
  if (dominant) {
    recommendations.push({
      title: `Adopt the ${dominant.framework} framework as your primary messaging structure`,
      description: `${dominant.framework} is used by ${dominant.usedBy.length} out of ${pages.length} competitors with an average conversion score of ${dominant.avgScore}/10. This framework is clearly the industry standard for this type of page.`,
      priority: 'must-have',
      basedOn: dominant.usedBy,
    })
  }

  // 2. High-importance patterns used by majority
  for (const pattern of commonPatterns) {
    if (pattern.importance === 'high' && pattern.foundIn.length >= Math.ceil(pages.length / 2)) {
      recommendations.push({
        title: `Include: ${pattern.pattern}`,
        description: `Found in ${pattern.foundIn.length} of ${pages.length} competitors. This is a high-importance pattern that top competitors rely on.`,
        priority: 'must-have',
        basedOn: pattern.foundIn,
      })
    }
  }

  // 3. Cross-reference strengths: if one competitor has a strength others lack, recommend it
  const allStrengths = new Map<string, string[]>()
  for (const sc of structureComparison) {
    for (const s of sc.strengths) {
      const key = s.toLowerCase()
      if (!allStrengths.has(key)) allStrengths.set(key, [])
      allStrengths.get(key)!.push(sc.competitor)
    }
  }

  for (const [strength, competitors] of allStrengths.entries()) {
    // Unique strength from a minority -> "should-have" recommendation
    if (competitors.length <= Math.floor(pages.length / 2) && competitors.length >= 1) {
      recommendations.push({
        title: `Differentiate with: ${strength}`,
        description: `Only ${competitors.length} competitor(s) leverage this strength. Adopting it could provide a competitive edge.`,
        priority: 'should-have',
        basedOn: competitors,
      })
    }
  }

  // 4. Common weaknesses -> opportunities
  const allWeaknesses = new Map<string, string[]>()
  for (const sc of structureComparison) {
    for (const w of sc.weaknesses) {
      const key = w.toLowerCase()
      if (!allWeaknesses.has(key)) allWeaknesses.set(key, [])
      allWeaknesses.get(key)!.push(sc.competitor)
    }
  }

  for (const [weakness, competitors] of allWeaknesses.entries()) {
    if (competitors.length >= Math.ceil(pages.length / 2)) {
      recommendations.push({
        title: `Opportunity: Address common weakness - ${weakness}`,
        description: `${competitors.length} of ${pages.length} competitors share this weakness. Solving it puts you ahead of the competition.`,
        priority: 'should-have',
        basedOn: competitors,
      })
    }
  }

  // 5. Medium-importance patterns as nice-to-have
  for (const pattern of commonPatterns) {
    if (pattern.importance === 'medium' && pattern.foundIn.length < Math.ceil(pages.length / 2)) {
      recommendations.push({
        title: `Consider: ${pattern.pattern}`,
        description: `Used by ${pattern.foundIn.length} competitor(s). Not universal but could strengthen your page.`,
        priority: 'nice-to-have',
        basedOn: pattern.foundIn,
      })
    }
  }

  // Deduplicate by title (lowercased)
  const seen = new Set<string>()
  return recommendations.filter((r) => {
    const key = r.title.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function buildBlueprint(
  pages: ParsedPage[],
  frameworkUsage: FrameworkUsageEntry[]
): Blueprint {
  // Recommended framework: highest scoring among dominant/common, or the top entry
  const recommended =
    frameworkUsage.find((f) => f.verdict === 'dominant') ||
    frameworkUsage.sort((a, b) => b.avgScore - a.avgScore)[0]

  const recommendedFramework = recommended?.framework || 'AIDA'

  // Collect folds across all pages keyed by foldNumber
  const foldBucket = new Map<
    number,
    Array<{ purpose: string; elements: string[]; framework: string; score: number; competitor: string }>
  >()

  for (const p of pages) {
    const folds = p.analysis.foldAnalysis || []
    const scores = p.analysis.messagingFrameworks?.conversionScores || []

    for (const fold of folds) {
      const num = fold.foldNumber || 1
      if (!foldBucket.has(num)) foldBucket.set(num, [])

      // Find the score for this fold
      const scoreEntry = scores.find((s: any) => s.fold === fold.title)
      const score = scoreEntry?.score || 5

      foldBucket.get(num)!.push({
        purpose: fold.purpose || fold.description || `Fold ${num}`,
        elements: fold.elements || [],
        framework: scoreEntry?.framework || p.analysis.messagingFrameworks?.primaryFramework || recommendedFramework,
        score,
        competitor: p.competitorName,
      })
    }
  }

  // Pick the best fold (highest score) at each position
  const recommendedFolds: BlueprintFold[] = []
  const sortedPositions = [...foldBucket.keys()].sort((a, b) => a - b)

  for (const pos of sortedPositions) {
    const candidates = foldBucket.get(pos)!
    // Sort by score desc and pick best
    candidates.sort((a, b) => b.score - a.score)
    const best = candidates[0]

    recommendedFolds.push({
      foldNumber: pos,
      purpose: best.purpose,
      elements: [...new Set(candidates.flatMap((c) => c.elements))].slice(0, 8),
      framework: best.framework,
    })
  }

  // Must-have elements: elements that appear in the majority of pages at any position
  const elementCount = new Map<string, number>()
  for (const p of pages) {
    const seen = new Set<string>()
    for (const fold of p.analysis.foldAnalysis || []) {
      for (const el of fold.elements || []) {
        const key = el.toLowerCase()
        if (!seen.has(key)) {
          seen.add(key)
          elementCount.set(key, (elementCount.get(key) || 0) + 1)
        }
      }
    }
  }

  const threshold = Math.ceil(pages.length / 2)
  const mustHaveElements = [...elementCount.entries()]
    .filter(([, count]) => count >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([el]) => el)

  // Avoid elements: drawn from common weaknesses / missing elements
  const avoidSet = new Set<string>()
  for (const p of pages) {
    const missing = p.analysis.messagingFrameworks?.missingElements || []
    for (const m of missing) {
      if (m.issue) avoidSet.add(m.issue)
    }
  }

  return {
    recommendedFramework,
    recommendedFolds,
    mustHaveElements,
    avoidElements: [...avoidSet],
  }
}

// ---- Route handler ----

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pageIds } = body

    if (!Array.isArray(pageIds) || pageIds.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 page IDs are required for comparison' },
        { status: 400 }
      )
    }

    // Fetch all landing pages with their competitor info
    const landingPages = await prisma.landingPage.findMany({
      where: { id: { in: pageIds } },
      include: { competitor: true },
    })

    if (landingPages.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: `Only ${landingPages.length} page(s) found in the database. At least 2 are required for comparison.`,
        },
        { status: 404 }
      )
    }

    // Parse semantic analysis for each page, skip those without analysis
    const parsedPages: ParsedPage[] = []
    const skippedIds: string[] = []

    for (const page of landingPages) {
      const analysis = safeParseJSON(page.semanticAnalysis)
      if (!analysis) {
        skippedIds.push(page.id)
        continue
      }

      parsedPages.push({
        competitorName: getCompetitorName(page),
        pageTitle: page.title || page.url,
        analysis,
      })
    }

    if (parsedPages.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: `Only ${parsedPages.length} page(s) have semantic analysis. At least 2 analyzed pages are required. Pages without analysis: ${skippedIds.join(', ')}`,
        },
        { status: 422 }
      )
    }

    // Build the comparison report
    const competitors = [...new Set(parsedPages.map((p) => p.competitorName))]
    const frameworkUsage = buildFrameworkUsage(parsedPages)
    const commonPatterns = buildCommonPatterns(parsedPages)
    const structureComparison = buildStructureComparison(parsedPages)
    const recommendations = buildRecommendations(parsedPages, frameworkUsage, commonPatterns, structureComparison)
    const blueprint = buildBlueprint(parsedPages, frameworkUsage)

    const comparison: ComparisonReport = {
      pagesCompared: parsedPages.length,
      competitors,
      frameworkUsage,
      commonPatterns,
      structureComparison,
      recommendations,
      blueprint,
    }

    return NextResponse.json({
      success: true,
      comparison,
      ...(skippedIds.length > 0 && {
        warnings: [`${skippedIds.length} page(s) were skipped because they lack semantic analysis: ${skippedIds.join(', ')}`],
      }),
    })
  } catch (error) {
    console.error('Competitor comparison failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
