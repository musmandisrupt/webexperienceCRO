# CompetitorHQ — Semantic Analysis & Competitor Comparison Architecture

> This document explains how the semantic analysis engine works end-to-end, how competitor comparison synthesizes data, what the system currently detects, and where the gaps are. Feed this to an AI for improvement suggestions.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Semantic Analysis Pipeline](#2-semantic-analysis-pipeline)
3. [GPT-4o Vision Prompt — What We Ask For](#3-gpt-4o-vision-prompt--what-we-ask-for)
4. [Fallback Analysis — Rule-Based Engine](#4-fallback-analysis--rule-based-engine)
5. [Messaging Framework Detection — Current Implementation](#5-messaging-framework-detection--current-implementation)
6. [Conversion Scoring — How Scores Are Calculated](#6-conversion-scoring--how-scores-are-calculated)
7. [Competitor Comparison — Synthesis Pipeline](#7-competitor-comparison--synthesis-pipeline)
8. [Data Schema — What Gets Stored](#8-data-schema--what-gets-stored)
9. [Current Gaps & Limitations](#9-current-gaps--limitations)
10. [Improvement Ideas](#10-improvement-ideas)

---

## 1. System Overview

CompetitorHQ captures competitor landing pages (via Playwright headless browser), then runs AI-powered semantic analysis on each page. The analysis breaks the page into visual "folds" (viewport-height sections), identifies messaging frameworks, scores conversion potential, and inventories persuasion elements.

Multiple analyzed pages can then be compared using a rule-based synthesis engine that aggregates patterns across competitors and generates a recommended page blueprint.

### Tech Stack
- **Capture:** Playwright (headless Chromium, 40+ anti-bot flags)
- **AI Analysis:** OpenAI GPT-4o Vision API (`response_format: json_object`)
- **Fallback:** Rule-based content analysis (regex pattern matching on extracted text)
- **Comparison:** Pure data synthesis (no AI calls — aggregates stored analysis data)
- **Storage:** SQLite via Prisma ORM (semantic analysis stored as JSON string)
- **Frontend:** Next.js 14, React 18, TypeScript

### Data Flow
```
URL → Playwright captures screenshot + extracts text
    → Screenshot + text sent to GPT-4o Vision
    → AI returns structured JSON analysis
    → Stored in database as `semanticAnalysis` field on LandingPage
    → Frontend displays fold-by-fold analysis with screenshot previews
    → Multiple pages can be compared via synthesis engine
```

---

## 2. Semantic Analysis Pipeline

**File:** `src/app/api/semantic-analysis/route.ts`

### Entry Point
- `POST /api/semantic-analysis` with `{ landingPageId: string }`
- Fetches the landing page record from the database
- Checks if it's a placeholder/basic page (example.com, coming soon, etc.) — if so, returns a simplified stub analysis

### Three Analysis Paths

| Path | When Used | Quality |
|------|-----------|---------|
| **GPT-4o Vision** | OpenAI API key set + screenshot exists | Best — AI visually inspects the page |
| **Text-only GPT-4o** | Screenshot missing but API key exists | Good — AI analyzes extracted text only |
| **Rule-based fallback** | No API key OR all AI calls fail | Basic — regex pattern matching on text |

### GPT-4o Vision Path (Primary)
1. Reads the screenshot file from `public/screenshots/`
2. Converts to base64
3. Sends to `gpt-4o` with `response_format: { type: "json_object" }`
4. System prompt: *"You are a senior CRO expert. Return ONLY valid JSON."*
5. User prompt includes: URL, title, description, first 3000 chars of extracted text, and the screenshot image
6. Response is `JSON.parse()`'d directly (no markdown parsing needed)
7. Metadata (date, processing time) is appended
8. Any "in markdown" text leaks in `missingElements` are cleaned

### Text-Only Fallback
If the screenshot file doesn't exist, a simplified text-only prompt is sent to GPT-4o without the image. Same JSON format expected.

### Rule-Based Fallback
If OpenAI is unavailable entirely, the system runs local analysis:
- Scans `copiedText` for CTA patterns (16 regex patterns)
- Detects trust signals, urgency triggers, emotional triggers, social proof via regex
- Maps `visualSections` (from the capture step) to fold analysis objects
- Calls `generateMessagingFrameworks()` for framework detection

---

## 3. GPT-4o Vision Prompt — What We Ask For

The prompt requests 5 analysis categories:

### 3.1 Fold-by-Fold Breakdown
For each visual fold (viewport-height section) from top to bottom:
- **Title** — descriptive name (e.g., "Hero Section", "Feature Grid")
- **Description** — 2-3 sentence detailed description
- **Elements** — every element found (headings, images, buttons, forms, icons, videos, logos, nav items)
- **Purpose** — role in the conversion funnel
- **Conversion Points** — specific CTAs, links, forms, sign-ups
- **Visual Details** — layout quality, whitespace, color contrast, typography hierarchy
- **Content Strategy** — messaging technique, copy effectiveness
- **Scores** — clarity (1-10), persuasion (1-10), conversion potential (1-10)

### 3.2 Messaging Framework Detection
Detect which of these 7 frameworks are used, with specific textual evidence:

| Framework | Stages | What to Look For |
|-----------|--------|-----------------|
| **AIDA** | Attention → Interest → Desire → Action | Hero headline, feature descriptions, social proof, CTA |
| **PAS** | Problem → Agitation → Solution | Pain point identification, amplification, product as answer |
| **FAB** | Features → Advantages → Benefits | What it does, why it matters, what user gains |
| **BAB** | Before → After → Bridge | Current pain, desired state, product connects them |
| **StoryBrand** | Character → Problem → Guide → Plan → CTA → Success → Failure | User as hero, brand as guide |
| **4Ps** | Promise → Picture → Proof → Push | Value promise, visualization, evidence, urgency |
| **QUEST** | Qualify → Understand → Educate → Stimulate → Transition | Audience qualification, education, motivation |

For each detected framework, the AI must:
- Cite the specific text or element as evidence
- Map which fold implements which stage
- Score the framework's execution

### 3.3 Persuasion Element Inventory
- **Trust signals:** testimonials, client logos, certifications, security badges, statistics, case studies, press mentions
- **Urgency triggers:** limited time offers, scarcity messaging, countdown timers, seasonal references
- **Emotional triggers:** fear, aspiration, belonging, FOMO, exclusivity, curiosity
- **Social proof:** user/customer counts, testimonial quotes, brand logos, star ratings, review counts

### 3.4 Scoring
- Per-fold: clarity (1-10), persuasion (1-10), conversion potential (1-10)
- Overall: conversion score (1-10) with justification
- Value proposition clarity (1-10)
- CTA effectiveness: placement, copy strength, design visibility, repetition frequency

### 3.5 Gap Analysis
- Specific missing elements that would improve conversion
- Expected impact of each missing element
- Actionable recommendation for each gap

---

## 4. Fallback Analysis — Rule-Based Engine

When OpenAI is unavailable, the fallback performs content-aware analysis:

### CTA Detection (16 patterns)
```
/get started/i, /sign up/i, /start free/i, /try (it )?free/i,
/book a demo/i, /request demo/i, /contact us/i, /learn more/i,
/download/i, /subscribe/i, /join (now|us|today)/i, /buy now/i,
/add to cart/i, /start (your )?trial/i, /create account/i, /explore/i
```

### Trust Signal Detection
```
testimonials:   /testimonial|"[^"]{20,}"/i
logos:          /trusted by|used by|partner|logo/i
certifications: /certified|complian|iso |soc |gdpr|hipaa|pci/i
statistics:     /\d+%|\d+\+|\d+,\d{3}|million|billion/i
caseStudies:    /case study|success story|how .+ (use|built|grew)/i
```

### Urgency Detection
```
limitedTime: /limited time|offer ends|hurry|don't miss|act now|expires/i
scarcity:    /only \d+ left|spots remaining|selling fast|exclusive|limited/i
countdown:   /countdown|timer|hours left|days left/i
```

### Emotional Trigger Detection
```
fear:       /protect|secure|risk|threat|danger|don't lose/i
aspiration: /transform|grow|achieve|unlock|elevate|scale/i
belonging:  /join .+(community|team|users)|part of/i
fomo:       /miss out|everyone|trending|popular|don't wait/i
```

### Social Proof Detection
```
userCounts:        /\d+[\+,]?\s*(user|customer|team|compan|business)/i
testimonialQuotes: /"[^"]{30,}"/
brandLogos:        /trusted by|as seen|featured in|powered by/i
ratings:           /★|⭐|\d+(\.\d+)?\s*(star|rating|out of 5)/i
```

### Fold Purpose Assignment
Based on visual section type:
- `hero` → "Capture attention and communicate the primary value proposition"
- `testimonial` → "Build trust through third-party validation and social proof"
- `pricing` → "Present value tiers and drive purchase decisions"
- `cta` → "Drive conversion through clear call-to-action"
- `features`/`content` → "Educate users and build interest in product capabilities"
- `footer` → "Provide navigation, legal info, and secondary conversion paths"

---

## 5. Messaging Framework Detection — Current Implementation

**Function:** `generateMessagingFrameworks()`

### How It Works (Rule-Based)

For each of the 7 frameworks, the function scans the extracted page text (`copiedText`) for stage-specific patterns:

**AIDA Detection:**
```
Attention:  /headline|hero|attention|discover|introducing|meet |welcome/i
Interest:   /feature|benefit|how it works|why |learn |explore/i
Desire:     /testimonial|review|success|result|case study|trusted/i
Action:     /get started|sign up|buy|subscribe|try free|book demo/i
```

**PAS Detection:**
```
Problem:    /problem|challenge|struggle|pain|frustrated|tired of/i
Agitation:  /worse|cost you|risk|without|imagine losing|every day/i
Solution:   /solution|solve|fix|answer|introducing|that's why/i
```

**FAB Detection:**
```
Features:    /feature|specification|capability|include|built.in/i
Advantages:  /advantage|better than|unlike|compared to|faster|easier/i
Benefits:    /benefit|result|outcome|you.ll get|achieve|transform/i
```

**BAB Detection:**
```
Before:  /before|currently|right now|struggling|old way|without/i
After:   /after|imagine|picture|with .+you|transform|new way/i
Bridge:  /bridge|that's where|introducing|solution|how we|our platform/i
```

**StoryBrand Detection:**
```
Character:  /you |your |hero|journey|story/i
Problem:    /problem|villain|obstacle|challenge|enemy/i
Guide:      /we |our |expert|guide|partner|trusted/i
Plan:       /step|plan|process|how to|roadmap|simple/i
```

**4Ps Detection:**
```
Promise:  /promise|guarantee|commit|pledge|deliver/i
Picture:  /imagine|picture|visualize|see yourself|think about/i
Proof:    /proof|evidence|data|statistic|case study|testimonial/i
Push:     /now|today|limited|act|don't wait|hurry/i
```

**QUEST Detection:**
```
Qualify:    /who is|is this for|if you|do you|are you/i
Understand: /understand|we know|we get it|been there|feel/i
Educate:    /learn|discover|understand|did you know|here's/i
Stimulate:  /imagine|what if|picture|just think|wouldn't it/i
Transition: /ready|next step|get started|begin|take action/i
```

Also counts question marks — if there are 3+ questions, QUEST gets a confidence boost.

### Confidence Scoring
Each framework gets a confidence score = `stages_detected / total_stages`. For example, if AIDA has 4 stages and 3 are detected via regex, confidence = 0.75.

### Primary vs Secondary
- Frameworks sorted by confidence descending
- Highest confidence = primary framework
- Next frameworks with confidence > 0 = secondary frameworks

### Framework Mapping
Each fold is assigned to a framework stage based on position:
- Fold 1-2 → early stages (Attention/Problem/Features)
- Middle folds → middle stages (Interest/Agitation/Advantages)
- Last folds → closing stages (Action/Solution/Benefits)

### Conversion Scores per Fold
Baseline of 5, boosted by:
- Has real CTAs (not "Indirect engagement"): +1
- Contains benefit language (`benefit|result|save|grow|improve`): +1
- Contains social proof language (`testimonial|customer|review|trusted`): +1
- Has a specific purpose (not generic default): +1
- Max: 10

---

## 6. Conversion Scoring — How Scores Are Calculated

### Path 1: GPT-4o (Best)
The AI scores each fold 1-10 on clarity, persuasion, and conversion potential. It also provides an overall conversion score with justification. These scores come from the AI's visual and textual analysis — most accurate.

### Path 2: Markdown Fallback Parser
Starts at 5, boosts:
| Signal | Boost |
|--------|-------|
| Fold has CTAs containing "cta" | +2 |
| Purpose mentions "trust" or "proof" | +1 |
| Purpose mentions "value proposition" | +1 |
| Fold has 4+ elements | +1 |

### Path 3: Rule-Based Fallback
Starts at 5, boosts:
| Signal | Boost |
|--------|-------|
| Has real conversion points (not "Indirect engagement") | +1 |
| Content has benefit language | +1 |
| Content has social proof language | +1 |
| Has a specific (non-generic) purpose | +1 |

---

## 7. Competitor Comparison — Synthesis Pipeline

**File:** `src/app/api/competitor-comparison/route.ts`

**Key fact: No AI is called during comparison.** It's pure data synthesis — the intelligence comes from the individual page analyses (which used GPT-4o). The comparison engine is a rule-based aggregator that finds statistical patterns across stored analysis data.

### Input
- 2+ landing page IDs
- Each must have stored `semanticAnalysis` JSON
- Pages without analysis are skipped (with warnings)

### 5-Stage Pipeline

#### Stage 1: Framework Usage (`buildFrameworkUsage`)
**Purpose:** Count which frameworks competitors use and rank them.

**Process:**
1. For each page, extract all frameworks from `primaryFramework`, `secondaryFrameworks`, and per-fold `frameworkMapping`
2. Build frequency map: `framework → { competitors who use it, count, total scores }`
3. Average score per framework = average of `conversionScores` entries matching that framework
4. Label each:
   - **Dominant:** used by 70%+ of pages
   - **Common:** used by 30-70%
   - **Rare:** under 30%
5. Sort by frequency desc, then avgScore desc

#### Stage 2: Common Patterns (`buildCommonPatterns`)
**Purpose:** Find what competitors have in common structurally.

**8 pattern detectors:**

| # | Pattern | Detection Method | Importance |
|---|---------|-----------------|------------|
| 1 | Hero with value prop | Fold title has "hero" OR purpose has "value proposition" | High |
| 2 | Social proof | Fold title has "testimonial" OR purpose has "social proof"/"trust" OR strengths mention it | High |
| 3 | Multiple CTAs | 2+ folds have `conversionPoints.length > 0` | High |
| 4 | Pricing section | Fold title/purpose has "pricing" | Medium |
| 5 | Feature breakdown | Purpose has "feature"/"benefit" OR elements contain "feature" | Medium |
| 6 | Problem-solution | Primary/secondary framework is PAS OR frameworkAnalysis mentions "problem" | Medium |
| 7 | Urgency elements | Any fold element has "urgency"/"scarcity"/"limited" | Low |
| 8 | Header navigation | Fold title has "header"/"navigation" OR purpose has "navigation" | Low |

Sorted by importance then frequency.

#### Stage 3: Structure Comparison (`buildStructureComparison`)
**Purpose:** Side-by-side profile per page.

Per page extracts:
- Competitor name (from `competitor.name` or URL hostname fallback)
- Page title, total folds, primary framework, primary goal
- Strengths from `insights.strengths`
- Weaknesses from `insights.improvements` + `missingElements[].issue`

#### Stage 4: Recommendations (`buildRecommendations`)
**Purpose:** Cross-reference all data into prioritized action items.

**5 recommendation generators:**

| # | Logic | Priority |
|---|-------|----------|
| 1 | Dominant framework exists → "Adopt X as your primary framework" | must-have |
| 2 | High-importance pattern used by 50%+ → "Include X" | must-have |
| 3 | Strength found in minority of competitors → "Differentiate with X" | should-have |
| 4 | Weakness shared by 50%+ → "Opportunity: solve X" | should-have |
| 5 | Medium pattern in minority → "Consider X" | nice-to-have |

Deduplicated by title.

#### Stage 5: Blueprint (`buildBlueprint`)
**Purpose:** Build the ideal page structure.

**Process:**
1. Collect all folds across all pages, bucketed by fold number (position 1, 2, 3...)
2. For each position, find each fold's conversion score from `conversionScores` (matched by fold title)
3. **Pick the highest-scoring fold** at each position
4. Merge elements from all candidates at that position (union, capped at 8)
5. **Recommended framework:** dominant framework, or highest-scoring if none dominant
6. **Must-have elements:** elements appearing in 50%+ of pages (deduplicated per page)
7. **Avoid elements:** all `missingElements[].issue` entries (what competitors are doing wrong)

---

## 8. Data Schema — What Gets Stored

The `semanticAnalysis` field on `LandingPage` stores this JSON structure:

```typescript
interface SemanticAnalysis {
  pageFlow: {
    totalFolds: number
    primaryGoal: string
    userJourney: string[]
    conversionFunnel?: string[]    // only from fallback
  }
  foldAnalysis: FoldAnalysis[]
  insights: {
    strengths: string[]
    improvements: string[]
    conversionOptimization: string[]
  }
  messagingFrameworks: {
    primaryFramework: string       // "AIDA" | "PAS" | "FAB" | etc.
    secondaryFrameworks: string[]
    frameworkAnalysis: string
    frameworkEvidence: string[]
    frameworkMapping: FrameworkMapping[]
    missingElements: MissingElement[]
    conversionScores: ConversionScore[]
  }
  persuasionInventory?: {          // only from enhanced analysis
    trustSignals: string[]
    urgencyTriggers: string[]
    emotionalTriggers: string[]
    socialProof: string[]
  }
  overallScores?: {                // only from GPT-4o
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
  }
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
  scores?: { clarity: number; persuasion: number; conversionPotential: number }
  confidence?: number
}

interface FrameworkMapping {
  section: string
  framework: string
  elements: { [key: string]: string }  // stage → evidence
  notes: string
}

interface MissingElement {
  issue: string
  impact: string
  recommendation: string
}

interface ConversionScore {
  fold: string
  framework: string
  score: number       // 1-10
  notes: string
}
```

---

## 9. Current Gaps & Limitations

### Analysis Gaps
1. **No cross-page learning:** Each page is analyzed in isolation. The AI doesn't know what competitors are doing when analyzing a page.
2. **Fold detection is approximate:** The AI guesses fold boundaries from the screenshot. There's no actual viewport-height calculation — it's visual estimation.
3. **Framework detection is shallow in fallback:** Regex patterns match keywords, not semantic meaning. "feature" in a footer link triggers FAB detection.
4. **No visual design scoring in fallback:** The rule-based engine can't assess layout quality, typography hierarchy, or color contrast — only text patterns.
5. **Persuasion inventory limited to predefined categories:** The system doesn't detect novel persuasion techniques (gamification, interactive elements, personalization, micro-animations).
6. **No competitive context in prompts:** When analyzing Page A, the AI doesn't know what Pages B, C, D look like. It can't say "this is weaker than industry standard."
7. **Static framework list:** Only 7 frameworks are recognized. Others like ELMER, ACCA, PASTOR, Star-Chain-Hook, or Cialdini's 6 principles are not detected.
8. **Screenshot quality dependency:** Full-page screenshots of long pages (8000px+) get compressed, potentially losing detail in lower folds.
9. **No A/B variant detection:** Can't identify if a page is running A/B tests with different versions.
10. **No mobile vs desktop comparison:** Even though both can be captured, there's no side-by-side mobile/desktop analysis.

### Comparison Gaps
1. **No AI in comparison:** The synthesis is entirely rule-based. An LLM could produce much richer cross-competitor insights.
2. **Pattern detectors are hardcoded:** Only 8 patterns are detected. The system can't discover novel patterns that competitors share.
3. **Blueprint is mechanical:** "Pick the highest-scoring fold at each position" doesn't account for page flow coherence. A great fold 3 from Competitor A might not follow logically from fold 2 from Competitor B.
4. **No industry benchmarking:** There's no baseline data for "what's normal" in fintech vs SaaS vs e-commerce landing pages.
5. **Recommendations are template-based:** The recommendation text follows rigid templates rather than providing nuanced, contextual advice.
6. **Scoring aggregation is simple averaging:** A framework used by 2 competitors with scores of 9 and 3 shows "avg 6" — but the 9-scoring implementation is clearly better. No weighting by quality.
7. **No temporal analysis:** Can't track how a competitor's page has changed over time.
8. **No content similarity detection:** Can't identify if two competitors are using nearly identical copy or messaging.

### UX Gaps
1. **Fold previews are approximate:** The screenshot is divided equally by fold count, but real folds aren't equal height.
2. **No side-by-side visual comparison:** Can't place two competitor screenshots next to each other with fold overlays.
3. **No export:** Can't export analysis or comparison as PDF/report.
4. **No annotations:** Can't annotate specific areas of the screenshot with notes.

---

## 10. Improvement Ideas

### High Impact
- **Add competitive context to the AI prompt:** When analyzing Page A, include summaries of already-analyzed Pages B, C, D in the same startup group. The AI can then say "This hero is weaker than Stripe's because..."
- **Use AI for comparison synthesis:** Replace the rule-based comparison with a GPT-4o call that receives all analyses and produces a holistic competitive intelligence report.
- **Add more frameworks:** ELMER, ACCA, PASTOR, Star-Chain-Hook, Cialdini's 6 Principles (Reciprocity, Commitment, Social Proof, Authority, Liking, Scarcity), Hook Model.
- **Pixel-accurate fold detection:** Use the AI to return pixel coordinates for each fold boundary, then use those for screenshot slicing instead of equal division.
- **Industry benchmarking:** Build baseline scores per industry (SaaS avg conversion score, fintech avg fold count, etc.) and show how each page compares.

### Medium Impact
- **Temporal tracking:** Re-capture the same URL over time, diff the analyses, show a changelog.
- **Content similarity scoring:** Compare extracted text between competitors using cosine similarity or LLM-based comparison.
- **Mobile/desktop comparison:** Analyze both captures of the same page side by side.
- **Smart blueprint generation:** Use an LLM to generate the recommended page structure, ensuring logical flow between folds rather than mechanical "pick best per position."
- **Weighted scoring in comparisons:** Weight framework scores by the number of folds, page length, or analysis confidence rather than simple averaging.

### Lower Impact
- **Export to PDF/Slides:** Generate downloadable reports.
- **Screenshot annotation tool:** Let users draw on screenshots and add notes.
- **A/B test detection:** Look for signs of A/B testing (multiple CTA variants, conditional content).
- **Heatmap-style fold scoring overlay:** Color-code the screenshot by fold score (green=high, red=low).
- **Automated re-analysis scheduling:** Periodically re-capture and re-analyze competitor pages.

---

*Last updated: 2026-04-06*
*System: CompetitorHQ v1.0*
*Analysis engine: GPT-4o Vision + rule-based fallback*
*Comparison engine: Rule-based data synthesis (no AI)*
