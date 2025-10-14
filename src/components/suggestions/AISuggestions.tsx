'use client'

import { useEffect, useState } from 'react'
import { Lightbulb, FileText, Quote } from 'lucide-react'

interface Suggestion {
  id: string
  type: 'fact' | 'reference' | 'idea'
  title: string
  content: string
  source?: string
  relevanceScore: number
}

interface AISuggestionsProps {
  currentContent: string
  onSuggestionClick?: (suggestion: Suggestion) => void
}

export default function AISuggestions({ currentContent, onSuggestionClick }: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!currentContent || currentContent.length < 50) {
      setSuggestions([])
      return
    }

    const debounceTimer = setTimeout(() => {
      fetchSuggestions(currentContent)
    }, 1000)

    return () => clearTimeout(debounceTimer)
  }, [currentContent])

  const fetchSuggestions = async (content: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSuggestionIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'fact':
        return <FileText className="w-4 h-4 text-blue-500" />
      case 'reference':
        return <Quote className="w-4 h-4 text-green-500" />
      case 'idea':
        return <Lightbulb className="w-4 h-4 text-yellow-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  if (!currentContent || currentContent.length < 50) {
    return (
      <div className="w-80 bg-white border-l border-gray-100 p-6 text-center text-gray-400">
        <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Start writing to see contextual suggestions</p>
      </div>
    )
  }

  return (
    <div className="w-80 bg-white border-l border-gray-100 p-6 overflow-y-auto max-h-screen">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Contextual Suggestions</h3>
        {loading && (
          <div className="text-xs text-gray-500">Analyzing your content...</div>
        )}
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors border border-gray-100"
            onClick={() => onSuggestionClick?.(suggestion)}
          >
            <div className="flex items-start gap-2 mb-1">
              {getSuggestionIcon(suggestion.type)}
              <h4 className="text-sm font-medium text-gray-800 flex-1 leading-tight">
                {suggestion.title}
              </h4>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed pl-6">
              {suggestion.content}
            </p>
            {suggestion.source && (
              <p className="text-xs text-gray-400 mt-1 pl-6">
                from: {suggestion.source}
              </p>
            )}
          </div>
        ))}

        {!loading && suggestions.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <FileText className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No relevant suggestions found</p>
            <p className="text-xs mt-1">Keep writing to get more context</p>
          </div>
        )}
      </div>
    </div>
  )
}
