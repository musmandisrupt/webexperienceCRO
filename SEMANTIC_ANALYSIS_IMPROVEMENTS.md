# Semantic Analysis Tab — Implementation Instructions

This document covers all improvements to the Semantic Analysis tab in priority order. Each phase is self-contained and can be executed independently. Work through them in sequence for the best result.

---

## Context

**Files involved:**
- `src/app/semantic-analysis/page.tsx` — main page
- `src/components/SemanticAnalysis/FoldAnalysisDisplay.tsx` — all tab rendering
- `src/components/SemanticAnalysis/CompetitorComparison.tsx` — compare mode output
- `src/app/api/semantic-analysis/route.ts` — AI analysis API
- `src/app/api/competitor-comparison/route.ts` — comparison API

**Core problem:** The AI already collects rich data (per-fold scores, overall conversion score, CTA effectiveness, persuasion inventory, conversion funnel). The display code discards ~60% of it. Fix the plumbing first, then restructure the UX.

---

## Phase 1 — Fix Broken Score Calculation (Critical Bug)

**File:** `src/components/SemanticAnalysis/FoldAnalysisDisplay.tsx`

**Problem:** Line ~220 calculates conversion score as `fold?.conversionPoints?.length * 20`, which is meaningless. The AI actually returns `fold.scores.clarity`, `fold.scores.persuasion`, and `fold.scores.conversionPotential` (each 1–10).

**Fix:**

Replace the conversion score calculation in the fold header section:

```tsx
// BEFORE (broken):
const conversionScore = fold?.conversionScore || (fold?.conversionPoints?.length ? fold.conversionPoints.length * 20 : 0)

// AFTER (correct):
const conversionScore = fold?.scores?.conversionPotential
  ? fold.scores.conversionPotential * 10
  : fold?.conversionPoints?.length
    ? Math.min(fold.conversionPoints.length * 20, 100)
    : 0
```

Inside each expanded fold, replace the current single "Conversion Score" bar with three mini score bars. Add this block after the fold preview screenshot section and before the Analysis + Elements row:

```tsx
{/* Per-Fold Scores */}
{fold?.scores && (
  <div className="grid grid-cols-3 gap-3">
    {[
      { label: 'CLARITY', value: fold.scores.clarity },
      { label: 'PERSUASION', value: fold.scores.persuasion },
      { label: 'CONVERSION', value: fold.scores.conversionPotential },
    ].map(({ label, value }) => {
      const color = value >= 8 ? '#22D3EE' : value >= 6 ? '#F59E0B' : '#EF4444'
      return (
        <div key={label} className="bg-[#0F172A] rounded-lg p-3">
          <p className="font-mono text-[9px] font-semibold text-[#64748B] tracking-[1.5px] mb-2">{label}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-[#1E293B]">
              <div className="h-1.5 rounded-full transition-all" style={{ width: `${value * 10}%`, backgroundColor: color }} />
            </div>
            <span className="font-mono text-xs font-bold" style={{ color }}>{value}/10</span>
          </div>
        </div>
      )
    })}
  </div>
)}
```

Also, remove or hide the fold preview screenshot section entirely for now. The equal-height slicing math is inaccurate (it divides the full screenshot height by totalFolds assuming equal folds, which is wrong). Remove the block that renders `FOLD PREVIEW` until real pixel range data is available from the AI.

---

## Phase 2 — Render Hidden AI Data (High Impact, Zero AI Cost)

**File:** `src/components/SemanticAnalysis/FoldAnalysisDisplay.tsx`

The AI already returns this data. It just isn't displayed.

### 2a — Add Overall Scores to Page Flow tab

In the `activeTab === 'flow'` section, add after the existing three boxes:

```tsx
{/* Overall Scores */}
{(analysis.overallScores) && (
  <>
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-[#1E293B] rounded-xl p-5">
        <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px] mb-3">CONVERSION SCORE</p>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-4xl font-bold" style={{ color: getScoreColor((analysis.overallScores.conversionScore || 0) * 10) }}>
            {analysis.overallScores.conversionScore}
          </span>
          <span className="text-[#475569] text-lg mb-1">/10</span>
        </div>
        {analysis.overallScores.conversionJustification && (
          <p className="text-xs text-[#64748B] leading-relaxed">{analysis.overallScores.conversionJustification}</p>
        )}
      </div>
      <div className="bg-[#1E293B] rounded-xl p-5">
        <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px] mb-3">VALUE PROP CLARITY</p>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold" style={{ color: getScoreColor((analysis.overallScores.valuePropositionClarity || 0) * 10) }}>
            {analysis.overallScores.valuePropositionClarity}
          </span>
          <span className="text-[#475569] text-lg mb-1">/10</span>
        </div>
      </div>
    </div>

    {/* CTA Effectiveness */}
    {analysis.overallScores.ctaEffectiveness && (
      <div className="bg-[#1E293B] rounded-xl p-5">
        <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px] mb-4">CTA EFFECTIVENESS</p>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(analysis.overallScores.ctaEffectiveness).map(([key, value]) => (
            <div key={key} className="bg-[#0F172A] rounded-lg p-3">
              <p className="font-mono text-[9px] font-semibold text-[#475569] tracking-[1px] mb-1 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </p>
              <p className="text-xs text-[#94A3B8]">{value as string}</p>
            </div>
          ))}
        </div>
      </div>
    )}
  </>
)}
```

### 2b — Add Conversion Funnel to Page Flow tab

After the User Journey box, add:

```tsx
{/* Conversion Funnel */}
{analysis.pageFlow?.conversionFunnel && Array.isArray(analysis.pageFlow.conversionFunnel) && analysis.pageFlow.conversionFunnel.length > 0 && (
  <div className="bg-[#1E293B] rounded-xl p-5">
    <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px] mb-4">CONVERSION FUNNEL</p>
    <div className="flex items-stretch gap-0">
      {analysis.pageFlow.conversionFunnel.map((step, i) => {
        const colors = ['#22D3EE', '#38BDF8', '#60A5FA', '#818CF8']
        const color = colors[i % colors.length]
        return (
          <div key={i} className="flex-1 relative">
            <div className="rounded-lg p-3 mr-1" style={{ backgroundColor: `${color}15`, borderLeft: `2px solid ${color}` }}>
              <p className="font-mono text-[9px] font-bold mb-1" style={{ color }}>{i + 1}</p>
              <p className="text-xs text-[#94A3B8] leading-relaxed">{step}</p>
            </div>
            {i < analysis.pageFlow.conversionFunnel.length - 1 && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
                <svg className="w-3 h-3 text-[#334155]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                </svg>
              </div>
            )}
          </div>
        )
      })}
    </div>
  </div>
)}
```

### 2c — Add Persuasion Inventory to Insights tab

The AI returns `analysis.persuasionInventory` with four buckets. Add this section at the TOP of the Insights tab, before Strengths:

```tsx
{/* Persuasion Arsenal */}
{analysis.persuasionInventory && (
  <div className="bg-[#1E293B] rounded-xl p-5">
    <p className="font-mono text-[10px] font-semibold text-[#22D3EE] tracking-[2px] mb-4">PERSUASION ARSENAL</p>
    <div className="grid grid-cols-2 gap-4">
      {[
        { key: 'trustSignals', label: 'TRUST SIGNALS', color: '#22D3EE' },
        { key: 'socialProof', label: 'SOCIAL PROOF', color: '#818CF8' },
        { key: 'urgencyTriggers', label: 'URGENCY TRIGGERS', color: '#F59E0B' },
        { key: 'emotionalTriggers', label: 'EMOTIONAL TRIGGERS', color: '#F472B6' },
      ].map(({ key, label, color }) => {
        const items = (analysis.persuasionInventory as any)[key] as string[]
        if (!items || items.length === 0) return null
        return (
          <div key={key}>
            <p className="font-mono text-[9px] font-semibold tracking-[1.5px] mb-2" style={{ color }}>{label}</p>
            <div className="flex flex-wrap gap-1.5">
              {items.map((item, i) => (
                <span key={i} className="px-2 py-0.5 rounded text-[11px] text-[#94A3B8]" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  </div>
)}
```

---

## Phase 3 — Summary Hero Above Tabs (Highest UX Impact)

**File:** `src/components/SemanticAnalysis/FoldAnalysisDisplay.tsx`

Add this block immediately after the opening `<div>` wrapper and before the tabs row. It renders a persistent scorecard that's visible regardless of which tab is active:

```tsx
{/* Summary Hero — visible on all tabs */}
{(analysis.overallScores || analysis.pageFlow) && (
  <div className="bg-[#1E293B] rounded-xl p-5 mb-6">
    <div className="flex items-start justify-between flex-wrap gap-4">
      {/* Left: Goal + Framework */}
      <div className="flex-1 min-w-0">
        {analysis.pageFlow?.primaryGoal && (
          <p className="text-sm font-medium text-white mb-1 leading-snug">{analysis.pageFlow.primaryGoal}</p>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          {analysis.messagingFrameworks?.primaryFramework && (
            <span className="font-mono text-[10px] font-bold text-[#22D3EE] bg-[#22D3EE]/10 px-2 py-0.5 rounded">
              {analysis.messagingFrameworks.primaryFramework}
            </span>
          )}
          {analysis.messagingFrameworks?.secondaryFrameworks?.map((fw: string) => (
            <span key={fw} className="font-mono text-[10px] text-[#64748B] bg-[#0F172A] px-2 py-0.5 rounded">{fw}</span>
          ))}
          {analysis.pageFlow?.totalFolds > 0 && (
            <span className="font-mono text-[10px] text-[#64748B]">{analysis.pageFlow.totalFolds} folds</span>
          )}
        </div>
      </div>

      {/* Right: Score Tiles */}
      <div className="flex items-stretch gap-3">
        {analysis.overallScores?.conversionScore !== undefined && (() => {
          const score = analysis.overallScores.conversionScore
          const color = getScoreColor(score * 10)
          return (
            <div className="text-center bg-[#0F172A] rounded-lg px-5 py-3">
              <p className="font-mono text-[9px] font-semibold text-[#475569] tracking-[1.5px] mb-1">CONVERSION</p>
              <p className="text-2xl font-bold" style={{ color }}>{score}<span className="text-sm text-[#475569]">/10</span></p>
            </div>
          )
        })()}
        {analysis.overallScores?.valuePropositionClarity !== undefined && (() => {
          const score = analysis.overallScores.valuePropositionClarity
          const color = getScoreColor(score * 10)
          return (
            <div className="text-center bg-[#0F172A] rounded-lg px-5 py-3">
              <p className="font-mono text-[9px] font-semibold text-[#475569] tracking-[1.5px] mb-1">VALUE PROP</p>
              <p className="text-2xl font-bold" style={{ color }}>{score}<span className="text-sm text-[#475569]">/10</span></p>
            </div>
          )
        })()}
      </div>
    </div>
  </div>
)}
```

---

## Phase 4 — Save as Insight Bridge

This is the most important workflow feature. It connects analysis findings to the Steal/Adapt/Avoid insights library.

### 4a — Update FoldAnalysisDisplay props

**File:** `src/components/SemanticAnalysis/FoldAnalysisDisplay.tsx`

Add `landingPageId` and `onInsightSaved` to the props interface:

```tsx
interface FoldAnalysisDisplayProps {
  analysis: SemanticAnalysis
  isLoading?: boolean
  screenshotUrl?: string
  landingPageId?: string                    // ADD
  onInsightSaved?: () => void               // ADD
}
```

### 4b — Add Save as Insight modal state

Inside the component, add:

```tsx
const [savingInsight, setSavingInsight] = React.useState<string | null>(null)
const [insightModal, setInsightModal] = React.useState<{
  text: string
  category: 'steal' | 'adapt' | 'avoid'
} | null>(null)
```

### 4c — Add the save function

```tsx
const saveInsight = async () => {
  if (!insightModal || !landingPageId) return
  try {
    const res = await fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: insightModal.text,
        category: insightModal.category,
        landingPageId,
      }),
    })
    if (res.ok) {
      setInsightModal(null)
      onInsightSaved?.()
    }
  } catch (e) {
    console.error('Failed to save insight', e)
  }
}
```

### 4d — Add "Save" icon next to each insight bullet

In the Insights tab, for each bullet item in Strengths, Improvements, and Conversion Optimization, wrap the `<li>` to include a save button:

```tsx
<li key={i} className="flex items-start gap-2 group">
  <span className="text-[#22D3EE] mt-0.5">•</span>
  <span className="text-[13px] text-[#94A3B8] flex-1">{s}</span>
  {landingPageId && (
    <button
      onClick={() => setInsightModal({ text: s, category: 'steal' })}
      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5 p-1 rounded hover:bg-[#22D3EE]/10 text-[#475569] hover:text-[#22D3EE]"
      title="Save as Insight"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    </button>
  )}
</li>
```

Use `category: 'steal'` for Strengths, `category: 'adapt'` for Improvements, `category: 'avoid'` for CRO items (or let the user pick in the modal).

### 4e — Add the insight save modal

Add this at the bottom of the component return, before the closing `</div>`:

```tsx
{/* Save as Insight Modal */}
{insightModal && (
  <div className="fixed inset-0 bg-[#0A0F1C]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-[#1E293B] rounded-2xl p-6 w-full max-w-md border border-[#334155]">
      <h3 className="text-white font-semibold mb-4">Save as Insight</h3>
      <p className="text-sm text-[#94A3B8] mb-4 bg-[#0F172A] rounded-lg p-3">{insightModal.text}</p>
      <div className="mb-4">
        <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[1.5px] mb-2">CATEGORY</p>
        <div className="flex gap-2">
          {(['steal', 'adapt', 'avoid'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setInsightModal({ ...insightModal, category: cat })}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
                insightModal.category === cat
                  ? 'bg-[#22D3EE] text-[#0A0F1C]'
                  : 'bg-[#0F172A] text-[#64748B] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={() => setInsightModal(null)} className="flex-1 py-2.5 rounded-lg bg-[#0F172A] text-sm text-[#64748B] hover:text-white">
          Cancel
        </button>
        <button onClick={saveInsight} className="flex-1 py-2.5 rounded-lg bg-[#22D3EE] text-[#0A0F1C] text-sm font-semibold">
          Save Insight
        </button>
      </div>
    </div>
  </div>
)}
```

### 4f — Pass landingPageId from the parent page

**File:** `src/app/semantic-analysis/page.tsx`

Update the FoldAnalysisDisplay call to pass the new prop:

```tsx
// BEFORE:
<FoldAnalysisDisplay analysis={analysis} screenshotUrl={selectedPage?.screenshotUrl} />

// AFTER:
<FoldAnalysisDisplay
  analysis={analysis}
  screenshotUrl={selectedPage?.screenshotUrl}
  landingPageId={selectedPage?.id}
  onInsightSaved={() => {/* optionally show a toast */}}
/>
```

---

## Phase 5 — Tab Reorder + Page Flow Improvements

**File:** `src/components/SemanticAnalysis/FoldAnalysisDisplay.tsx`

### 5a — Reorder tabs

Change the tabs array so users land on the most actionable view first:

```tsx
const tabs = [
  { key: 'flow' as const, label: 'Overview' },       // was "Page Flow", now first
  { key: 'insights' as const, label: 'Insights' },   // most actionable
  { key: 'folds' as const, label: 'Fold Analysis' }, // detailed drill-down
  { key: 'frameworks' as const, label: 'Framework' },
]
```

Also update `const [activeTab, setActiveTab] = React.useState` default from `'folds'` to `'flow'`.

### 5b — Rename "Page Flow" to "Overview" throughout

Replace all string references to `'flow'` tab label from "Page Flow" to "Overview".

---

## Phase 6 — Persuasion Inventory in Fold Analysis Tab

Each fold can show which persuasion elements it contains. In the expanded fold content, after the Analysis + Elements row, add:

```tsx
{/* Persuasion signals detected in this fold */}
{fold?.visualDetails && (
  <div>
    <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px] mb-1.5">VISUAL ASSESSMENT</p>
    <p className="text-[12px] text-[#64748B] leading-relaxed">{fold.visualDetails}</p>
  </div>
)}
{fold?.contentStrategy && (
  <div>
    <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px] mb-1.5">CONTENT STRATEGY</p>
    <p className="text-[12px] text-[#64748B] leading-relaxed">{fold.contentStrategy}</p>
  </div>
)}
```

Note: `visualDetails` and `contentStrategy` are already in the schema and returned by the AI. They're currently rendered in the Analysis column together with `description` and `purpose`, which is redundant and cluttered. Instead, move `description` to the main Analysis column, `visualDetails` to its own row, and `contentStrategy` to its own row.

---

## Phase 7 — Re-analyze Confirmation

**File:** `src/app/semantic-analysis/page.tsx`

Add a confirmation before overwriting existing analysis:

```tsx
const runAnalysis = async () => {
  if (!selectedPage) return

  // Confirm overwrite if analysis already exists
  if (analysis) {
    const confirmed = window.confirm(
      'This page already has an analysis. Re-analyzing will overwrite it. Continue?'
    )
    if (!confirmed) return
  }

  setIsAnalyzing(true)
  // ... rest of function unchanged
}
```

Or use a proper modal instead of `window.confirm` to stay consistent with the dark theme.

---

## Phase 8 — Score Context (Benchmarking)

**File:** `src/app/semantic-analysis/page.tsx`

Compute the average conversion score across all analyzed pages and pass it to FoldAnalysisDisplay:

```tsx
const avgConversionScore = useMemo(() => {
  const scores = landingPages
    .filter(p => p.semanticAnalysis)
    .map(p => {
      try {
        const parsed = typeof p.semanticAnalysis === 'string'
          ? JSON.parse(p.semanticAnalysis)
          : p.semanticAnalysis
        return parsed?.overallScores?.conversionScore || null
      } catch { return null }
    })
    .filter(Boolean)
  if (scores.length === 0) return null
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
}, [landingPages])
```

Pass `avgConversionScore` as a prop to FoldAnalysisDisplay, then display it in the Summary Hero next to the score:

```tsx
{avgConversionScore && (
  <p className="font-mono text-[9px] text-[#475569] mt-1">
    avg across your pages: {avgConversionScore}/10
  </p>
)}
```

---

## Phase 9 — Compare Mode Polish

**File:** `src/app/semantic-analysis/page.tsx`

### 9a — Show thumbnails for selected pages in compare sidebar

When a page is selected for comparison and it has a screenshot, show a small thumbnail. In the page list button, add below the URL line:

```tsx
{viewMode === 'compare' && isSelected && page.screenshotUrl && (
  <div className="mt-2 ml-6">
    <img
      src={page.screenshotUrl}
      alt="preview"
      className="w-full h-12 object-cover object-top rounded border border-[#334155] opacity-70"
    />
  </div>
)}
```

### 9b — Show conversion score badge on each page item

If the page has a score, show it on the list item:

```tsx
{(() => {
  try {
    const parsed = typeof page.semanticAnalysis === 'string'
      ? JSON.parse(page.semanticAnalysis)
      : page.semanticAnalysis
    const score = parsed?.overallScores?.conversionScore
    if (!score) return null
    const color = score >= 8 ? '#22D3EE' : score >= 6 ? '#F59E0B' : '#EF4444'
    return (
      <span className="font-mono text-[10px] font-bold ml-auto flex-shrink-0" style={{ color }}>
        {score}/10
      </span>
    )
  } catch { return null }
})()}
```

Place this in the page item header row alongside the existing ✓/○ badge.

### 9c — Dynamic comparison preview

Replace the static "WHAT YOU'LL GET" list with a dynamic preview showing selected page names:

```tsx
{selectedForCompare.size > 0 ? (
  <div className="bg-[#1E293B] rounded-xl p-4 text-left space-y-2">
    <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px]">COMPARING</p>
    {Array.from(selectedForCompare).map(id => {
      const page = landingPages.find(p => p.id === id)
      return page ? (
        <div key={id} className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
          <span className="text-[13px] text-[#94A3B8] truncate">{page.title || page.url}</span>
        </div>
      ) : null
    })}
  </div>
) : (
  // existing static "WHAT YOU'LL GET" list
)}
```

---

## Implementation Order

Run these in sequence for the safest rollout:

1. **Phase 1** — Fix score calculation (breaks nothing, fixes misleading UI)
2. **Phase 2** — Render hidden data (additive changes only)
3. **Phase 3** — Summary hero (additive, sits above existing tabs)
4. **Phase 5** — Tab reorder (minor, just array reorder + state default)
5. **Phase 4** — Save as Insight bridge (needs `/api/insights` POST to exist — verify before implementing)
6. **Phase 7** — Re-analyze confirmation (one-liner)
7. **Phase 8** — Score benchmarking (additive)
8. **Phase 6** — Per-fold detail improvements (visual refinement)
9. **Phase 9** — Compare mode polish (lowest priority)

---

## Notes for Claude Code

- Do NOT change the AI prompt in `route.ts` — it already requests all the right data
- Do NOT change the `parseMarkdownAnalysis` function — it's no longer called in the main path (the route uses `response_format: json_object`)
- All changes are in the display layer only (Phases 1–3, 5–9) except Phase 4 which adds a `POST /api/insights` call
- Verify that `POST /api/insights` accepts `{ text, category, landingPageId }` before implementing Phase 4
- Run `npm run build` after all phases to confirm no TypeScript errors
- Test with a page that has existing analysis data before testing with a fresh analysis run
