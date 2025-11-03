'use client'

import { useState } from 'react'
import { Search, BookOpen, ExternalLink, Loader } from 'lucide-react'

interface ResearchResult {
  type: 'insight' | 'source' | 'study' | 'statistic'
  content: string
  source?: string
  url?: string
}

interface ResearchPanelProps {
  currentContent: string
}

export default function ResearchPanel({ currentContent }: ResearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [researching, setResearching] = useState(false)
  const [results, setResults] = useState<ResearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const researchTopic = async (customQuery?: string) => {
    setResearching(true)
    setHasSearched(true)
    
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: currentContent,
          customQuery: customQuery || searchQuery,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
      } else {
        const errorData = await response.json()
        alert('Research failed: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Research error:', error)
      alert('Failed to research topic. Check console for details.')
    } finally {
      setResearching(false)
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      researchTopic(searchQuery)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const getResultIcon = (type: string) => {
    return <BookOpen className="w-4 h-4 text-blue-500" />
  }

  return (
    <div className="w-96 bg-white border-l border-gray-100 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Research & Explore</h3>
        
        {/* Search Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search a topic..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
          <button
            onClick={handleSearch}
            disabled={researching || !searchQuery.trim()}
            className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Research Current Topic Button */}
        <button
          onClick={() => researchTopic()}
          disabled={researching || !currentContent || currentContent.length < 50}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
        >
          {researching ? (
            <span className="flex items-center justify-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              Researching...
            </span>
          ) : (
            'Research This Topic'
          )}
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {!hasSearched ? (
          <div className="text-center py-12 text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm mb-2">Explore your ideas deeper</p>
            <p className="text-xs">
              Click &quot;Research This Topic&quot; to find sources, studies, and insights related to what you&apos;re writing
            </p>
          </div>
        ) : researching ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm text-gray-600">Finding research and sources...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No results found</p>
            <p className="text-xs mt-1">Try a different search query</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-start gap-2 mb-2">
                  {getResultIcon(result.type)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900 leading-relaxed mb-2">
                      {result.content}
                    </div>
                    {result.source && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <span className="font-medium">Source:</span>
                        <span>{result.source}</span>
                        {result.url && (
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
