# CompetitorHQ — Full Bug Fix & Improvement Prompt

You are working on **CompetitorHQ**, a Next.js 14 competitor landing page analysis tool using Prisma, Tailwind CSS, and the OpenAI API. The app is dark-themed (`bg-[#0A0F1C]`, accent `#22D3EE`). Below is a complete list of bugs and improvements to implement, ordered by priority.

---

## CRITICAL FIXES (do these first)

### 1. Fix the Insights page — replace hardcoded data with real database data

**File:** `src/app/insights/page.tsx`

The entire page currently uses a hardcoded static array of 3 fake insights (Stripe, Notion, Figma). This is not connected to the database at all.

**What to do:**
- Convert the page to a `'use client'` component that fetches from `/api/insights` on mount using `useEffect` + `fetch`
- Add loading state with a skeleton grid (3 skeleton cards, same layout as landing pages skeleton)
- Add empty state: if no insights, show a centered empty state with the lightbulb icon, heading "No insights yet", subtext "Run a semantic analysis on a landing page to generate insights automatically, or add one manually.", and an "Add Insight" button
- Keep the existing `InsightCard` rendering but map over real data from the API
- The API response shape will be `{ success: true, insights: [...] }` where each insight has: `id`, `title`, `description`, `category` (STEAL/ADAPT/AVOID), `confidence` (1-5), `createdAt`, `landingPage` (with `url`, `competitor.name`)

**Also create the API route** `src/app/api/insights/route.ts`:
```
GET  — fetch all insights from prisma.insight.findMany({ include: { landingPage: { include: { competitor: true } } }, orderBy: { createdAt: 'desc' } })
POST — create a new insight: { title, description, category, confidence, landingPageId? }
```

---

### 2. Build the missing "Add Insight" page — `/insights/new` (currently 404)

**Create file:** `src/app/insights/new/page.tsx`

The "Add Insight" button on the Insights page links to `/insights/new` but no route exists, producing a 404.

**What to build:**
- A `'use client'` page wrapped in `DashboardLayout`
- Page header: "Add Insight" / "Manually log a pattern from competitor analysis"
- Dark-themed form card (`bg-[#1E293B] rounded-xl p-6`) containing:
  - **Title** — text input, required
  - **Description** — textarea (4 rows), required
  - **Category** — select/radio with 3 options: STEAL (green), ADAPT (yellow), AVOID (red) — styled as pill buttons not a dropdown
  - **Confidence** — star rating (1–5) using clickable star icons
  - **Landing Page** (optional) — dropdown that fetches from `/api/landing-pages` and shows `title || url`
- Form validation: show inline error messages below required fields if submitted empty
- On submit: POST to `/api/insights`, then redirect to `/insights` on success with a toast: "Insight saved"
- Cancel button returns to `/insights`
- Use the same dark input styles as the competitors modal: `bg-[#0F172A] border border-[#334155] text-white rounded-lg px-3 py-2.5 focus:border-[#22D3EE]`

---

### 3. Fix Semantic Analysis — Fold Analysis tab is always blank

**File:** `src/app/api/semantic-analysis/route.ts`

**Root cause:** The `parseMarkdownAnalysis` function uses fragile regex patterns (`\*\*PrimaryGoal\*\*:`, `\d+\. \*\*(.*?)\*\*`, etc.) to extract data from the AI's free-form markdown. When the AI's response doesn't match these exact patterns (which is most of the time), `foldAnalysis` comes back as an empty array, causing:
- Fold Analysis tab: "No fold analysis data available"
- Page Flow tab: "0 distinct visual folds"
- User Journey: empty
- Insights: falls back to single generic defaults ("Clear value proposition", "Enhance user experience")
- Comparison report: "Dominant Framework: N/A", "Recommended Folds: 0"

**What to do — switch to structured JSON output:**

Replace the OpenAI call to use `response_format: { type: "json_object" }` and update the system prompt to explicitly ask for JSON. Here is the exact structure to request:

```json
{
  "pageFlow": {
    "totalFolds": 6,
    "primaryGoal": "Drive signups for the payments API",
    "userJourney": ["Awareness via hero", "Feature education", "Social proof", "Pricing decision", "CTA conversion"],
    "conversionFunnel": ["Attention", "Interest", "Desire", "Action"]
  },
  "foldAnalysis": [
    {
      "foldNumber": 1,
      "title": "Hero Section",
      "description": "Above-the-fold hero with headline, subheadline, and primary CTA",
      "elements": ["Headline", "Subheadline", "Primary CTA button", "Navigation bar"],
      "purpose": "Capture attention and communicate the primary value proposition",
      "conversionPoints": ["Primary CTA", "Navigation sign-up link"],
      "confidence": 9
    }
  ],
  "insights": {
    "strengths": ["Clear value proposition in hero", "Multiple social proof signals", "Progressive disclosure of features"],
    "improvements": ["Hero CTA copy is generic — 'Get started' vs benefit-led copy", "No urgency triggers above the fold"],
    "conversionOptimization": ["Add a secondary CTA in the pricing section", "Include customer logo strip in fold 1"]
  },
  "messagingFrameworks": {
    "primaryFramework": "AIDA",
    "secondaryFrameworks": ["FAB", "PAS"],
    "frameworkAnalysis": "The page opens with strong Attention (hero), builds Interest through feature folds, generates Desire via social proof, and closes with Action via pricing CTAs.",
    "missingElements": [
      {
        "issue": "No dedicated social proof section",
        "impact": "Missing trust signals can reduce conversion by 20-30%",
        "recommendation": "Add customer testimonials with specific results and names"
      }
    ]
  }
}
```

Update the system prompt to say:
> "You are a senior CRO (Conversion Rate Optimisation) expert. Analyse the landing page content provided and return ONLY valid JSON matching this exact schema. Do not include any markdown, explanation, or text outside the JSON object."

Then remove the entire `parseMarkdownAnalysis` function and replace it with `JSON.parse(aiResponse.choices[0].message.content)`. Wrap in try/catch — if JSON.parse fails, log the raw response and return a structured error.

---

### 4. Fix the "in markdown" text leak in analysis output

**File:** `src/app/api/semantic-analysis/route.ts`

After fixing bug #3 (switching to JSON output), this will be automatically resolved since the AI will no longer produce prose that includes the word "markdown". However if you encounter it in stored data, add a cleanup step when reading `missingElements[].issue` from the DB: `.replace(/\s*in markdown\s*/gi, '').trim()`

---

## SIGNIFICANT FIXES

### 5. Wire up Filters and Sort on Landing Pages

**File:** `src/app/landing-pages/page.tsx`

The Filters and Sort buttons are visual stubs — they have no click handlers and nothing happens when clicked. The `sortBy` state is declared but never used in `filteredPages`.

**What to do:**

**Sort:** Add a dropdown that appears below the Sort button (toggle with `showSort` state). Options: "Newest first", "Oldest first", "A–Z by title", "Analyzed first", "Pending first". Apply the selected sort inside the `filteredPages` useMemo after filtering:
```js
if (sortBy === 'newest') pages = [...pages].sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
if (sortBy === 'oldest') pages = [...pages].sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime())
if (sortBy === 'az') pages = [...pages].sort((a, b) => (a.title || a.url).localeCompare(b.title || b.url))
if (sortBy === 'analyzed') pages = [...pages].sort((a, b) => (b.semanticAnalysis ? 1 : 0) - (a.semanticAnalysis ? 1 : 0))
if (sortBy === 'pending') pages = [...pages].sort((a, b) => (a.semanticAnalysis ? 1 : 0) - (b.semanticAnalysis ? 1 : 0))
```

**Filters:** Add a `showFilters` boolean state toggled by the Filters button. When open, show a filter row below the search bar (slide down animation) with:
- A "Status" filter: All / Analyzed / Pending (filter by whether `page.semanticAnalysis` exists)
- A "Competitor" filter: a select dropdown populated from unique competitors in the loaded data
Apply both filters inside `filteredPages` useMemo alongside search.

Style all dropdowns/panels in dark theme: `bg-[#1E293B] border border-[#334155] rounded-lg`.

---

### 6. Make Landing Page cards clickable with a detail/view page

**File:** `src/components/LandingPages/LandingPageCard.tsx`

The card `div` wrapper is not clickable. Users cannot open a landing page to see its details.

**What to do:**

Wrap the entire card in a `Link` from `next/link` pointing to `/landing-pages/[id]`:
```tsx
import Link from 'next/link'
// Replace the outer div with:
<Link href={`/landing-pages/${landingPage.id}`} className="block bg-[#1E293B] rounded-xl overflow-hidden group hover:ring-1 hover:ring-[#22D3EE]/20 transition-all duration-200 cursor-pointer">
```
Make sure the edit and delete buttons use `e.stopPropagation()` / `e.preventDefault()` to avoid triggering the Link.

**Also create the detail page** `src/app/landing-pages/[id]/page.tsx`:
- Show the full screenshot (large, scrollable if full-page)
- Show metadata: URL, competitor, captured date, device type, status badge
- Show extracted content text in a scrollable code block / textarea
- If `semanticAnalysis` exists, show a summary panel: primary goal, framework, fold count, top 3 strengths
- Show an "Analyse in Semantic Analysis" button that links to `/semantic-analysis` with the page pre-selected (you can pass `?pageId=xxx` as a query param and read it in the semantic analysis page to auto-select)
- Show a "Re-capture" button that links to `/capture` with the URL pre-filled
- Back button to `/landing-pages`

---

### 7. Fix Edit Landing Page — dark theme

**File:** `src/app/landing-pages/[id]/edit/page.tsx`

The form container uses `bg-white` and all Tailwind light-mode utility classes, making it a jarring white card on the dark app.

**What to do:** Replace the entire form card with dark-themed equivalents:
- `bg-white` → `bg-[#1E293B]`
- `text-gray-700` → `text-[#94A3B8]`
- `border-gray-300` → `border-[#334155]`
- `rounded-md` inputs → `rounded-lg bg-[#0F172A] border border-[#334155] text-white focus:border-[#22D3EE] outline-none`
- `bg-gray-50` read-only URL field → `bg-[#0F172A] border border-[#334155] text-[#64748B]`
- Cancel button → `bg-[#0F172A] text-[#94A3B8] rounded-lg px-4 py-2`
- Save button → `bg-[#22D3EE] text-[#0A0F1C] font-semibold rounded-lg px-5 py-2`

Also fix the empty field issue: many pages have `null` title/description in the DB because the capture didn't extract them. In the `useEffect`, after setting `formData`, also derive a fallback: if `title` is empty, auto-populate it from the captured page's `title` field or the URL hostname.

---

## MODERATE FIXES

### 8. Fix InsightFilters — dark theme + wire to parent data

**File:** `src/components/Insights/InsightFilters.tsx`

Two problems: (a) white background, (b) filter state is local and never passed to the parent.

**What to do:**

Convert `InsightFilters` to accept props:
```tsx
interface InsightFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  category: string
  onCategoryChange: (v: string) => void
  confidence: string
  onConfidenceChange: (v: string) => void
  onClear: () => void
}
```

Replace `bg-white rounded-lg border border-gray-200` with the dark search bar style already used in landing pages:
```tsx
<div className="flex items-center gap-3">
  <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#1E293B]">
    ...search input with bg-transparent text-white...
  </div>
  <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1E293B] text-[#94A3B8]">
    Filters
  </button>
</div>
```

In the parent Insights page, lift the filter state up and pass it to `InsightFilters`, then apply it when filtering the fetched insights array.

---

### 9. Dashboard Insights & Analyses counts show 0 — fix the label

**File:** `src/app/page.tsx` (Dashboard)

Once real insights are being saved to the database (after fix #1), the dashboard API will automatically start returning correct counts. No code change needed beyond completing fix #1.

However, rename the "ANALYSES" stat card to "REPORTS" to match what `prisma.weeklyReport.count()` is actually counting in `src/app/api/dashboard/route.ts`.

---

### 10. Add toast feedback for Competitor "Add Startup" validation

**File:** `src/app/competitors/page.tsx`

The `handleCreateStartup` function does call `toast.error('Startup name is required')` but users may not see it if `react-hot-toast`'s `<Toaster />` is not in the layout.

**Check:** Open `src/app/layout.tsx` and verify `<Toaster />` from `react-hot-toast` is present in the JSX. If not, add it:
```tsx
import { Toaster } from 'react-hot-toast'
// Inside the body:
<Toaster position="top-right" toastOptions={{ style: { background: '#1E293B', color: '#fff', border: '1px solid #334155' } }} />
```

---

## QUALITY / POLISH IMPROVEMENTS

### 11. Landing page card competitor tag — show name not industry

**File:** `src/components/LandingPages/LandingPageCard.tsx` line ~84

The tag currently renders `competitor.industry || competitor.name`. This means competitors that have an industry set show the industry tag (e.g. "Cyber Security") instead of their name. Change to always show name, and optionally show industry as a separate smaller tag:
```tsx
<span>{ landingPage.competitor.name }</span>
{ landingPage.competitor.industry && <span>{ landingPage.competitor.industry }</span> }
```

### 12. Semantic Analysis — auto-select page from URL param

**File:** `src/app/semantic-analysis/page.tsx`

After clicking "Analyse in Semantic Analysis" from the detail page (fix #6), add support for reading a `?pageId=xxx` query param on mount and auto-selecting that page in the sidebar list using `useSearchParams()`.

### 13. Add a "Pending analysis" count badge to the Semantic Analysis nav link

**File:** `src/components/Layout/Navigation.tsx`

Count pages where `semanticAnalysis` is null and show a small numeric badge on the Semantic Analysis nav item. This creates a natural workflow prompt.

### 14. Landing page card — show device type dynamically

**File:** `src/components/LandingPages/LandingPageCard.tsx` line ~88

The device type tag is hardcoded to "Desktop". Read it from `landingPage.deviceType` if the field exists in the schema, otherwise keep the fallback.

### 15. Add a "Capture" shortcut directly from Landing Pages empty state

Already done but also add a floating "+ Capture" button in the bottom-right corner of the Landing Pages page (fixed position) so users can quickly add pages without going to the nav. Style it as a teal pill button: `fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-[#22D3EE] text-[#0A0F1C] font-semibold rounded-full shadow-lg`.

---

## IMPLEMENTATION ORDER

Work through these in this sequence to avoid breaking dependencies:

1. Fix `layout.tsx` Toaster (10) — 2 min, unblocks validation feedback everywhere
2. Fix Edit Landing Page dark theme (7) — purely visual, safe
3. Fix InsightFilters dark theme + props (8) — visual + wiring
4. Wire up Landing Pages Filters & Sort (5) — frontend only
5. Make Landing Page cards clickable + build detail page (6) — new route
6. Build `/api/insights` route (part of fix 1)
7. Convert Insights page to use real data (1)
8. Build `/insights/new` page (2)
9. Fix Semantic Analysis JSON output (3) — most complex, test thoroughly after
10. Polish fixes (11–15)

After each fix, run the dev server and manually test the affected page before moving to the next fix.
