'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/Layout/DashboardLayout'

export default function CapturePage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [competitorId, setCompetitorId] = useState('')
  const [deviceType, setDeviceType] = useState('desktop')
  const [fullPage, setFullPage] = useState(true)
  const [progressive, setProgressive] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureResult, setCaptureResult] = useState<any>(null)
  const [competitors, setCompetitors] = useState<Array<{id: string, name: string}>>([])
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    { label: 'Launch browser & navigate', num: '1' },
    { label: 'Capture screenshot', num: '2' },
    { label: 'Extract content & tech stack', num: '3' },
    { label: 'Save to database', num: '4' },
  ]

  useEffect(() => {
    fetch('/api/competitors')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCompetitors(data.competitors.map((c: any) => ({ id: c.id, name: c.name })))
      })
      .catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) { toast.error('Please enter a URL'); return }

    setIsCapturing(true)
    setCurrentStep(0)

    try {
      // Simulate step progress
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => Math.min(prev + 1, 3))
      }, 2000)

      const response = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, competitorId: competitorId || undefined, deviceType, fullPage, progressive }),
      })

      clearInterval(stepInterval)
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Failed to capture page')

      setCurrentStep(3)
      setCaptureResult(result.captureResult)
      toast.success('Page captured successfully!')
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Failed to capture page')
    } finally {
      setIsCapturing(false)
    }
  }

  const screenshotUrl = captureResult?.screenshotPath || captureResult?.screenshotUrl

  if (captureResult) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full p-8 gap-8">
          <div>
            <h1 className="text-[28px] font-bold text-white">Capture Complete</h1>
            <p className="text-sm text-[#64748B] mt-1">Your landing page has been captured successfully</p>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-8 min-h-0">
            {/* Screenshot Preview */}
            <div className="bg-[#1E293B] rounded-xl overflow-hidden flex flex-col">
              <div className="px-5 py-3 border-b border-[#0F172A] flex items-center justify-between">
                <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px]">SCREENSHOT PREVIEW</p>
                <div className="flex items-center gap-2">
                  {captureResult.captureMethod && (
                    <span className="font-mono text-[9px] text-[#94A3B8] bg-[#0F172A] px-2 py-0.5 rounded">
                      via {captureResult.captureMethod === 'firecrawl' ? 'Firecrawl' : captureResult.captureMethod === 'playwright-fallback' ? 'Playwright (fallback)' : 'Playwright'}
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-[#22D3EE] bg-[#22D3EE]/10 px-2 py-0.5 rounded">✓ Captured</span>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-1 bg-[#0F172A]">
                {screenshotUrl ? (
                  <img
                    src={screenshotUrl}
                    alt={captureResult.title || 'Captured page'}
                    className="w-full rounded"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-[#475569] text-sm">No screenshot available</div>
                )}
              </div>
            </div>

            {/* Details Panel */}
            <div className="bg-[#1E293B] rounded-xl p-6 space-y-5 overflow-y-auto">
              <div>
                <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px] mb-3">PAGE DETAILS</p>
                <h3 className="text-white font-semibold text-[15px] mb-1">{captureResult.title || 'Untitled'}</h3>
                <p className="font-mono text-xs text-[#64748B] break-all">{captureResult.url}</p>
                {captureResult.description && (
                  <p className="text-[13px] text-[#94A3B8] mt-2 leading-relaxed">{captureResult.description}</p>
                )}
              </div>

              {/* Extracted Content Preview */}
              {captureResult.copiedText && (
                <div>
                  <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px] mb-2">EXTRACTED CONTENT</p>
                  <div className="bg-[#0F172A] rounded-lg p-3 max-h-[200px] overflow-y-auto">
                    <p className="text-[12px] text-[#94A3B8] leading-relaxed whitespace-pre-wrap">
                      {captureResult.copiedText.slice(0, 500)}{captureResult.copiedText.length > 500 ? '...' : ''}
                    </p>
                  </div>
                </div>
              )}

              {/* Tech Stack */}
              {captureResult.techStack && captureResult.techStack.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px] mb-2">TECH STACK</p>
                  <div className="flex flex-wrap gap-1.5">
                    {captureResult.techStack.map((tech: any, i: number) => (
                      <span key={i} className="font-mono text-[10px] text-[#22D3EE] bg-[#22D3EE]/10 px-2 py-0.5 rounded">
                        {tech.name || tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-[#0F172A]">
                <button onClick={() => setCaptureResult(null)} className="flex-1 px-4 py-2.5 rounded-lg bg-[#0F172A] text-[#94A3B8] text-sm font-medium hover:bg-[#0F172A]/80 transition-colors">
                  Capture Another
                </button>
                <button onClick={() => router.push('/landing-pages')} className="flex-1 px-4 py-2.5 rounded-lg bg-[#22D3EE] text-[#0A0F1C] text-sm font-semibold hover:bg-[#22D3EE]/90 transition-colors">
                  View All Pages
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full p-8 gap-8">
        {/* Header */}
        <div>
          <h1 className="text-[28px] font-bold text-white">Capture</h1>
          <p className="text-sm text-[#64748B] mt-1">Capture competitor landing pages for analysis</p>
        </div>

        {/* Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[480px_1fr] gap-8 min-h-0">
          {/* Form Panel */}
          <div className="bg-[#1E293B] rounded-xl p-8 space-y-6 overflow-y-auto">
            <p className="font-mono text-[11px] font-semibold text-[#64748B] tracking-[2px]">NEW CAPTURE</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* URL */}
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-white">Website URL</label>
                <div className="flex items-center gap-2 px-3.5 py-3 rounded-lg bg-[#0F172A] border border-[#1E293B]">
                  <svg className="w-4 h-4 text-[#64748B] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/landing-page"
                    className="flex-1 bg-transparent font-mono text-[13px] text-white placeholder:text-[#475569] outline-none"
                    required
                  />
                </div>
              </div>

              {/* Competitor */}
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-white">Competitor</label>
                <select
                  value={competitorId}
                  onChange={(e) => setCompetitorId(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-lg bg-[#0F172A] border border-[#1E293B] text-[13px] text-white outline-none appearance-none cursor-pointer"
                >
                  <option value="">Select competitor...</option>
                  {competitors.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Device Type */}
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-white">Device Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeviceType('desktop')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                      deviceType === 'desktop'
                        ? 'bg-[#22D3EE] text-[#0A0F1C] font-semibold'
                        : 'bg-[#0F172A] border border-[#1E293B] text-[#94A3B8]'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z" />
                    </svg>
                    Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeviceType('mobile')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                      deviceType === 'mobile'
                        ? 'bg-[#22D3EE] text-[#0A0F1C] font-semibold'
                        : 'bg-[#0F172A] border border-[#1E293B] text-[#94A3B8]'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                    </svg>
                    Mobile
                  </button>
                </div>
              </div>

              {/* Toggle Options */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[#94A3B8]">Full page capture</span>
                  <button
                    type="button"
                    onClick={() => setFullPage(!fullPage)}
                    className={`relative w-10 h-[22px] rounded-full transition-colors ${fullPage ? 'bg-[#22D3EE]' : 'bg-[#475569]'}`}
                  >
                    <div className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-transform ${fullPage ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[#94A3B8]">Progressive loading</span>
                  <button
                    type="button"
                    onClick={() => setProgressive(!progressive)}
                    className={`relative w-10 h-[22px] rounded-full transition-colors ${progressive ? 'bg-[#22D3EE]' : 'bg-[#475569]'}`}
                  >
                    <div className={`absolute top-[2px] w-[18px] h-[18px] rounded-full transition-transform ${progressive ? 'translate-x-[20px] bg-white' : 'translate-x-[2px] bg-[#94A3B8]'}`} />
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isCapturing}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg bg-[#22D3EE] text-[#0A0F1C] text-sm font-semibold hover:bg-[#22D3EE]/90 disabled:opacity-50 transition-colors"
              >
                {isCapturing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#0A0F1C]/30 border-t-[#0A0F1C] rounded-full animate-spin" />
                    Capturing...
                  </>
                ) : (
                  <>
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                    </svg>
                    Start Capture
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Preview Panel */}
          <div className="bg-[#1E293B] rounded-xl p-6 overflow-hidden flex flex-col">
            <p className="font-mono text-[11px] font-semibold text-[#64748B] tracking-[2px] mb-5">CAPTURE PREVIEW</p>

            {/* Preview Area */}
            <div className="flex-1 flex flex-col rounded-lg bg-[#0F172A] mb-5 min-h-[320px] overflow-hidden">
              {isCapturing ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-12 h-12 border-2 border-[#1E293B] border-t-[#22D3EE] rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm text-white">Capturing page...</p>
                  <p className="font-mono text-xs text-[#64748B] mt-1 break-all max-w-[300px]">{url}</p>
                </div>
              ) : url ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-14 h-14 rounded-xl bg-[#1E293B] flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-[#22D3EE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                    </svg>
                  </div>
                  <p className="text-sm text-white mb-1">Ready to capture</p>
                  <p className="font-mono text-[11px] text-[#64748B] break-all max-w-[300px]">{url}</p>
                  <p className="text-[11px] text-[#475569] mt-3">Click "Start Capture" to take the screenshot</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <svg className="w-12 h-12 text-[#1E293B] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z" />
                  </svg>
                  <p className="text-sm text-[#475569]">Enter a URL to get started</p>
                  <p className="font-mono text-xs text-[#64748B] mt-1">Screenshot preview will appear here</p>
                </div>
              )}
            </div>

            {/* Capture Steps */}
            <p className="font-mono text-[11px] font-semibold text-[#64748B] tracking-[2px] mb-4">CAPTURE STEPS</p>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={step.num} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] font-semibold ${
                    isCapturing && i <= currentStep
                      ? 'bg-[#22D3EE] text-[#0A0F1C]'
                      : 'bg-[#0F172A] text-[#64748B]'
                  }`}>
                    {isCapturing && i < currentStep ? '✓' : step.num}
                  </div>
                  <span className={`text-[13px] ${isCapturing && i <= currentStep ? 'text-white' : 'text-[#94A3B8]'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
