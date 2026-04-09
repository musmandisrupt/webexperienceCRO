'use client'

import { useState, useEffect } from 'react'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  SparklesIcon,
  PlayIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import FoldAnalysisDisplay from '@/components/SemanticAnalysis/FoldAnalysisDisplay'
import type { LandingPage, Competitor, SemanticAnalysis } from '@/types'
import toast from 'react-hot-toast'

export default function SemanticAnalysisPage() {
  const [landingPages, setLandingPages] = useState<LandingPage[]>([])
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('all')
  const [selectedPage, setSelectedPage] = useState<LandingPage | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<SemanticAnalysis | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [pagesResponse, competitorsResponse] = await Promise.all([
        fetch('/api/landing-pages'),
        fetch('/api/competitors')
      ])

      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json()
        setLandingPages(pagesData.landingPages || [])
        
        // Auto-select first page if available
        if (pagesData.landingPages && pagesData.landingPages.length > 0) {
          setSelectedPage(pagesData.landingPages[0])
        }
      }

      if (competitorsResponse.ok) {
        const competitorsData = await competitorsResponse.json()
        setCompetitors(competitorsData.competitors || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    }
  }

  const filteredPages = landingPages.filter(page => {
    const matchesSearch = page.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.url.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCompetitor = selectedCompetitor === 'all' || page.competitorId === selectedCompetitor
    return matchesSearch && matchesCompetitor
  })

  const handlePageSelect = async (page: LandingPage) => {
    setSelectedPage(page)
    setAnalysis(null) // Clear previous analysis
    
    // Check if analysis already exists
    if (page.semanticAnalysis) {
      try {
        const parsedAnalysis = typeof page.semanticAnalysis === 'string' 
          ? JSON.parse(page.semanticAnalysis) 
          : page.semanticAnalysis
        setAnalysis(parsedAnalysis)
      } catch (error) {
        console.error('Error parsing existing analysis:', error)
      }
    }
  }

  const runSemanticAnalysis = async () => {
    if (!selectedPage) {
      toast.error('Please select a landing page first')
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/semantic-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          landingPageId: selectedPage.id
        })
      })

      const result = await response.json()

      if (result.success) {
        setAnalysis(result.analysis)
        toast.success('Semantic analysis completed successfully!')
        
        // Update the selected page with the new analysis
        if (selectedPage) {
          setSelectedPage({
            ...selectedPage,
            semanticAnalysis: result.analysis
          })
        }
        
        // Refresh the page data to get updated analysis
        fetchData()
      } else {
        toast.error(result.error || 'Analysis failed')
      }
    } catch (error) {
      console.error('Error running analysis:', error)
      toast.error('Failed to run semantic analysis')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getPageStatus = (page: LandingPage) => {
    if (page.semanticAnalysis) {
      return {
        status: 'completed',
        icon: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
        text: 'Analysis Complete'
      }
    }
    return {
      status: 'pending',
      icon: <ClockIcon className="h-4 w-4 text-gray-400" />,
      text: 'No Analysis'
    }
  }

  return (
    <DashboardLayout>
      <div className="flex h-screen bg-gray-100">
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Semantic Analysis
                </h1>
                <p className="text-gray-600">
                  AI-powered fold-by-fold analysis of landing pages with conversion insights
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel - Page Selection */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Select Landing Page
                    </h2>

                    {/* Search and Filters */}
                    <div className="space-y-4 mb-6">
                      <div className="relative">
                        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search pages..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="relative">
                        <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <select
                          value={selectedCompetitor}
                          onChange={(e) => setSelectedCompetitor(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Competitors</option>
                          {competitors.map((competitor) => (
                            <option key={competitor.id} value={competitor.id}>
                              {competitor.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Page List */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredPages.map((page) => {
                        const pageStatus = getPageStatus(page)
                        const isSelected = selectedPage?.id === page.id
                        
                        return (
                          <button
                            key={page.id}
                            onClick={() => handlePageSelect(page)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 truncate">
                                  {page.title || 'Untitled Page'}
                                </h3>
                                <p className="text-sm text-gray-500 truncate">
                                  {page.url}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  {pageStatus.icon}
                                  <span className="text-xs text-gray-500">
                                    {pageStatus.text}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {/* Analysis Button */}
                    {selectedPage && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <button
                          onClick={runSemanticAnalysis}
                          disabled={isAnalyzing}
                          className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isAnalyzing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <SparklesIcon className="h-4 w-4" />
                              <span>Run Semantic Analysis</span>
                            </>
                          )}
                        </button>
                        
                        {selectedPage.semanticAnalysis && (
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Analysis already exists. Click to re-run.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel - Analysis Results */}
                <div className="lg:col-span-2">
                  {selectedPage ? (
                    <div>
                      {/* Page Info */}
                      <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                              {selectedPage.title || 'Untitled Page'}
                            </h2>
                            <p className="text-gray-600 mb-2">{selectedPage.url}</p>
                            {selectedPage.description && (
                              <p className="text-gray-700">{selectedPage.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              Captured: {new Date(selectedPage.capturedAt).toLocaleDateString()}
                            </p>
                            {selectedPage.competitor && (
                              <p className="text-sm text-gray-500">
                                Competitor: {selectedPage.competitor.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Analysis Results */}
                      {analysis ? (
                        <FoldAnalysisDisplay analysis={analysis} />
                      ) : selectedPage.semanticAnalysis ? (
                        <div className="bg-white rounded-lg shadow p-6">
                          <div className="text-center py-8">
                            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              Analysis Available
                            </h3>
                            <p className="text-gray-600 mb-4">
                              This page has been analyzed. Click "Run Semantic Analysis" to view results.
                            </p>
                            <button
                              onClick={runSemanticAnalysis}
                              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                              Load Analysis
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg shadow p-6">
                          <div className="text-center py-8">
                            <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              No Analysis Yet
                            </h3>
                            <p className="text-gray-600 mb-4">
                              Run semantic analysis to get detailed fold-by-fold insights for this page.
                            </p>
                            <button
                              onClick={runSemanticAnalysis}
                              disabled={isAnalyzing}
                              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                              {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-center py-8">
                        <PlayIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Select a Landing Page
                        </h3>
                        <p className="text-gray-600">
                          Choose a landing page from the list to view or run semantic analysis.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}