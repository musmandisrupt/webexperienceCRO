'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import CompetitorCard from '@/components/Competitors/CompetitorCard'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Startup {
  id: string
  name: string
  description: string | null
  industry: string | null
  competitors: Competitor[]
  createdAt: string
}

interface Competitor {
  id: string
  name: string
  website: string
  description?: string
  industry?: string
  groupId?: string | null
  landingPages?: { id: string; title?: string; screenshotUrl?: string; semanticAnalysis?: any }[]
  createdAt: string
}

export default function CompetitorsPage() {
  const pathname = usePathname()
  const [startups, setStartups] = useState<Startup[]>([])
  const [ungrouped, setUngrouped] = useState<Competitor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedStartups, setExpandedStartups] = useState<Set<string>>(new Set())

  // Modals
  const [showAddStartup, setShowAddStartup] = useState(false)
  const [showAddCompetitor, setShowAddCompetitor] = useState(false)
  const [addCompToStartupId, setAddCompToStartupId] = useState<string>('')

  // Add Startup form
  const [startupName, setStartupName] = useState('')
  const [startupWebsite, setStartupWebsite] = useState('')
  const [startupDescription, setStartupDescription] = useState('')
  const [startupIndustry, setStartupIndustry] = useState('')
  const [isCreatingStartup, setIsCreatingStartup] = useState(false)

  // Add Competitor form
  const [compName, setCompName] = useState('')
  const [compWebsite, setCompWebsite] = useState('')
  const [compDescription, setCompDescription] = useState('')
  const [isCreatingComp, setIsCreatingComp] = useState(false)

  useEffect(() => { fetchData() }, [pathname])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/competitor-groups')
      const data = await res.json()
      if (data.success) {
        setStartups(data.groups)
        setUngrouped(data.ungrouped)
        if (expandedStartups.size === 0 && data.groups.length > 0) {
          setExpandedStartups(new Set(data.groups.map((g: Startup) => g.id)))
        }
      }
    } catch { toast.error('Failed to load data') }
    finally { setIsLoading(false) }
  }

  const toggleStartup = (id: string) => {
    setExpandedStartups(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleCreateStartup = async () => {
    if (!startupName.trim()) { toast.error('Startup name is required'); return }
    setIsCreatingStartup(true)
    try {
      const res = await fetch('/api/competitor-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: startupName, description: startupDescription || undefined, industry: startupIndustry || undefined }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`"${startupName}" added`)
        setStartupName(''); setStartupWebsite(''); setStartupDescription(''); setStartupIndustry('')
        setShowAddStartup(false)
        fetchData()
      } else { toast.error(data.error || 'Failed to create') }
    } catch { toast.error('Failed to create') }
    finally { setIsCreatingStartup(false) }
  }

  const openAddCompetitor = (startupId: string) => {
    setAddCompToStartupId(startupId)
    setShowAddCompetitor(true)
  }

  const handleCreateCompetitor = async () => {
    if (!compName.trim() || !compWebsite.trim()) { toast.error('Name and website are required'); return }
    setIsCreatingComp(true)
    try {
      const res = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: compName, website: compWebsite, description: compDescription || undefined, groupId: addCompToStartupId || undefined }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`${compName} added`)
        setCompName(''); setCompWebsite(''); setCompDescription('')
        setShowAddCompetitor(false); setAddCompToStartupId('')
        fetchData()
      } else { toast.error(data.error || 'Failed to add') }
    } catch { toast.error('Failed to add') }
    finally { setIsCreatingComp(false) }
  }

  const handleDeleteStartup = async (id: string) => {
    if (!confirm('Delete this startup? Competitors will be ungrouped.')) return
    try {
      const res = await fetch(`/api/competitor-groups/${id}`, { method: 'DELETE' })
      if ((await res.json()).success) { toast.success('Deleted'); fetchData() }
    } catch { toast.error('Failed to delete') }
  }

  const handleDeleteCompetitor = async (id: string) => {
    const res = await fetch(`/api/competitors/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed')
    fetchData()
  }

  const totalCompetitors = startups.reduce((s, g) => s + g.competitors.length, 0) + ungrouped.length
  const getStartupName = (id: string) => startups.find(s => s.id === id)?.name || ''

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-[#1E293B]">
          <div>
            <h1 className="text-[28px] font-bold text-white">Competitors</h1>
            <p className="font-mono text-[13px] text-[#64748B] mt-1">
              {startups.length} startup{startups.length !== 1 ? 's' : ''} · {totalCompetitors} competitor{totalCompetitors !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddStartup(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold bg-[#22D3EE] text-[#0A0F1C] hover:bg-[#22D3EE]/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
              Add Startup
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {isLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="bg-[#1E293B] rounded-xl p-6 animate-pulse">
                  <div className="h-5 w-1/4 bg-[#0F172A] rounded mb-3" />
                  <div className="h-4 w-1/3 bg-[#0F172A] rounded" />
                </div>
              ))}
            </div>
          ) : startups.length === 0 && ungrouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#1E293B] flex items-center justify-center mb-5">
                <svg className="w-8 h-8 text-[#475569]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No startups yet</h3>
              <p className="text-sm text-[#64748B] mb-6 max-w-md">
                Add your startup first, then add competitors under it. This lets you compare competitor pages within the same market.
              </p>
              <button onClick={() => setShowAddStartup(true)} className="px-5 py-2.5 rounded-lg bg-[#22D3EE] text-[#0A0F1C] text-[13px] font-semibold">
                Add Your First Startup
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {startups.map(startup => {
                const isExpanded = expandedStartups.has(startup.id)
                const analyzedCount = startup.competitors.filter(c =>
                  c.landingPages?.some(lp => lp.semanticAnalysis)
                ).length

                return (
                  <div key={startup.id} className="rounded-xl overflow-hidden bg-[#1E293B]">
                    {/* Startup Header */}
                    <div
                      className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
                      style={{ borderBottom: isExpanded ? '1px solid #334155' : 'none' }}
                      onClick={() => toggleStartup(startup.id)}
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-4 h-4 text-[#64748B] transition-transform duration-200"
                          style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)' }}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>

                        {/* Startup icon */}
                        <div className="w-8 h-8 rounded-lg bg-[#22D3EE]/10 flex items-center justify-center">
                          <svg className="w-4 h-4 text-[#22D3EE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21" />
                          </svg>
                        </div>

                        <div>
                          <h2 className="text-[15px] font-semibold text-white">{startup.name}</h2>
                          {startup.description && (
                            <p className="text-[11px] text-[#475569] mt-0.5">{startup.description}</p>
                          )}
                        </div>

                        {startup.industry && (
                          <span className="font-mono text-[10px] font-medium text-[#22D3EE] bg-[#22D3EE]/10 px-2 py-0.5 rounded">
                            {startup.industry}
                          </span>
                        )}

                        <span className="font-mono text-[10px] text-[#94A3B8] bg-[#0F172A] px-2 py-0.5 rounded">
                          {startup.competitors.length} competitor{startup.competitors.length !== 1 ? 's' : ''}
                        </span>

                        {analyzedCount > 0 && (
                          <span className="font-mono text-[10px] text-[#22D3EE] bg-[#22D3EE]/10 px-2 py-0.5 rounded">
                            {analyzedCount} analyzed
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Compare link */}
                        {analyzedCount >= 2 && (
                          <Link
                            href="/semantic-analysis"
                            onClick={e => e.stopPropagation()}
                            className="font-mono text-[10px] text-[#22D3EE] hover:underline mr-2"
                          >
                            Compare →
                          </Link>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteStartup(startup.id) }}
                          className="p-1.5 rounded-lg text-[#475569] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Expanded Competitors */}
                    {isExpanded && (
                      <div className="p-5 bg-[#0F172A]">
                        {startup.competitors.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-sm text-[#475569] mb-4">No competitors added yet</p>
                            <button
                              onClick={() => openAddCompetitor(startup.id)}
                              className="font-mono text-[12px] text-[#22D3EE] hover:underline"
                            >
                              + Add a competitor to {startup.name}
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {startup.competitors.map(comp => (
                                <CompetitorCard
                                  key={comp.id}
                                  competitor={comp as any}
                                  onDelete={handleDeleteCompetitor}
                                  onRefresh={fetchData}
                                />
                              ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-[#1E293B] flex items-center justify-between">
                              <button
                                onClick={() => openAddCompetitor(startup.id)}
                                className="flex items-center gap-1.5 font-mono text-[11px] text-[#22D3EE] hover:underline"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                                Add competitor
                              </button>
                              {analyzedCount >= 2 && (
                                <Link
                                  href="/semantic-analysis"
                                  className="flex items-center gap-1.5 font-mono text-[11px] text-[#22D3EE] hover:underline"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                                  </svg>
                                  Compare in Semantic Analysis
                                </Link>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Ungrouped */}
              {ungrouped.length > 0 && (
                <div className="rounded-xl overflow-hidden bg-[#1E293B]">
                  <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
                    style={{ borderBottom: expandedStartups.has('ungrouped') ? '1px solid #334155' : 'none' }}
                    onClick={() => toggleStartup('ungrouped')}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-[#64748B] transition-transform duration-200" style={{ transform: expandedStartups.has('ungrouped') ? 'rotate(90deg)' : 'rotate(0)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                      <h2 className="text-[15px] font-medium text-[#94A3B8]">Ungrouped Competitors</h2>
                      <span className="font-mono text-[10px] text-[#94A3B8] bg-[#0F172A] px-2 py-0.5 rounded">
                        {ungrouped.length}
                      </span>
                    </div>
                  </div>
                  {expandedStartups.has('ungrouped') && (
                    <div className="p-5 bg-[#0F172A]">
                      <p className="text-[11px] text-[#475569] mb-4">These competitors aren't assigned to a startup. Add them to a startup to enable group comparison.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ungrouped.map(comp => (
                          <CompetitorCard key={comp.id} competitor={comp as any} onDelete={handleDeleteCompetitor} onRefresh={fetchData} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Startup Modal */}
      {showAddStartup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setShowAddStartup(false)}>
          <div className="bg-[#1E293B] rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-1">Add Startup</h2>
            <p className="text-[12px] text-[#64748B] mb-5">Define your startup or market category. Competitors will be added under it.</p>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] text-[#94A3B8] mb-1.5">Startup Name *</label>
                <input type="text" value={startupName} onChange={e => setStartupName(e.target.value)} placeholder="e.g. Stripe, HubSpot, Your Company" className="w-full px-3 py-2.5 rounded-lg bg-[#0F172A] border border-[#334155] text-white text-[13px] font-mono outline-none focus:border-[#22D3EE] transition-colors" />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-[#94A3B8] mb-1.5">Industry</label>
                <input type="text" value={startupIndustry} onChange={e => setStartupIndustry(e.target.value)} placeholder="e.g. Fintech, SaaS, E-commerce" className="w-full px-3 py-2.5 rounded-lg bg-[#0F172A] border border-[#334155] text-white text-[13px] font-mono outline-none focus:border-[#22D3EE] transition-colors" />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-[#94A3B8] mb-1.5">Description</label>
                <textarea value={startupDescription} onChange={e => setStartupDescription(e.target.value)} placeholder="What does this startup do?" rows={2} className="w-full px-3 py-2.5 rounded-lg bg-[#0F172A] border border-[#334155] text-white text-[13px] font-mono outline-none focus:border-[#22D3EE] transition-colors resize-none" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddStartup(false)} className="px-4 py-2 rounded-lg text-sm text-[#94A3B8] bg-[#0F172A]">Cancel</button>
              <button onClick={handleCreateStartup} disabled={isCreatingStartup} className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#22D3EE] text-[#0A0F1C] disabled:opacity-50">
                {isCreatingStartup ? 'Creating...' : 'Create Startup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Competitor Modal */}
      {showAddCompetitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => { setShowAddCompetitor(false); setAddCompToStartupId('') }}>
          <div className="bg-[#1E293B] rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-1">
              Add Competitor{addCompToStartupId ? ` to ${getStartupName(addCompToStartupId)}` : ''}
            </h2>
            <p className="text-[12px] text-[#64748B] mb-5">Add a competitor website to track and analyze.</p>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] text-[#94A3B8] mb-1.5">Competitor Name *</label>
                <input type="text" value={compName} onChange={e => setCompName(e.target.value)} placeholder="e.g. PayPal, Braintree" className="w-full px-3 py-2.5 rounded-lg bg-[#0F172A] border border-[#334155] text-white text-[13px] font-mono outline-none focus:border-[#22D3EE] transition-colors" />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-[#94A3B8] mb-1.5">Website *</label>
                <input type="url" value={compWebsite} onChange={e => setCompWebsite(e.target.value)} placeholder="https://competitor.com" className="w-full px-3 py-2.5 rounded-lg bg-[#0F172A] border border-[#334155] text-white text-[13px] font-mono outline-none focus:border-[#22D3EE] transition-colors" />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-[#94A3B8] mb-1.5">Description</label>
                <textarea value={compDescription} onChange={e => setCompDescription(e.target.value)} placeholder="What does this competitor do?" rows={2} className="w-full px-3 py-2.5 rounded-lg bg-[#0F172A] border border-[#334155] text-white text-[13px] font-mono outline-none focus:border-[#22D3EE] transition-colors resize-none" />
              </div>
              {!addCompToStartupId && (
                <div>
                  <label className="block font-mono text-[11px] text-[#94A3B8] mb-1.5">Assign to Startup</label>
                  <select value={addCompToStartupId} onChange={e => setAddCompToStartupId(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-[#0F172A] border border-[#334155] text-white text-[13px] font-mono outline-none focus:border-[#22D3EE] transition-colors cursor-pointer">
                    <option value="">No startup (ungrouped)</option>
                    {startups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowAddCompetitor(false); setAddCompToStartupId('') }} className="px-4 py-2 rounded-lg text-sm text-[#94A3B8] bg-[#0F172A]">Cancel</button>
              <button onClick={handleCreateCompetitor} disabled={isCreatingComp} className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#22D3EE] text-[#0A0F1C] disabled:opacity-50">
                {isCreatingComp ? 'Adding...' : 'Add Competitor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
