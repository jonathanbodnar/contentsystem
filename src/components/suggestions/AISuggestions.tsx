'use client'

import { useEffect, useState } from 'react'
import { Lightbulb, FileText, Quote, ArrowRight, Bookmark } from 'lucide-react'

interface Suggestion {
  id: string
  type: 'continuation' | 'evidence' | 'story' | 'transition' | 'detail'
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
    // Lower threshold and add debugging
    const contentLength = currentContent?.length || 0
    console.log('AISuggestions content check:', { contentLength, hasContent: !!currentContent })
    
    if (!currentContent || contentLength < 15) { // Lowered to 15 for faster suggestions
      setSuggestions([])
      return
    }

    console.log('Scheduling suggestions fetch for content:', contentLength, 'characters')
    const debounceTimer = setTimeout(() => {
      fetchSuggestions(currentContent)
    }, 2000) // Increased to 2 seconds to reduce API calls

    return () => clearTimeout(debounceTimer)
  }, [currentContent])

  const fetchSuggestions = async (content: string) => {
    console.log('Fetching suggestions for content:', content.substring(0, 100) + '...')
    setLoading(true)
    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })
      
      console.log('Suggestions API response:', { 
        status: response.status, 
        ok: response.ok 
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Suggestions received:', data.suggestions?.length || 0, 'suggestions')
        setSuggestions(data.suggestions || [])
        
        if (data.error) {
          console.warn('Suggestions API warning:', data.error)
        }
      } else {
        const errorData = await response.json()
        console.error('Suggestions API error:', errorData)
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSuggestionIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'continuation':
        return <ArrowRight className="w-4 h-4 text-blue-500" />
      case 'evidence':
        return <FileText className="w-4 h-4 text-green-500" />
      case 'story':
        return <Quote className="w-4 h-4 text-purple-500" />
      case 'transition':
        return <ArrowRight className="w-4 h-4 text-orange-500" />
      case 'detail':
        return <Bookmark className="w-4 h-4 text-yellow-500" />
      default:
        return <Lightbulb className="w-4 h-4 text-gray-500" />
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
        <h3 className="text-sm font-medium text-gray-700 mb-2">What to Write Next</h3>
        <p className="text-xs text-gray-500 mb-2">AI suggestions for continuing your thought</p>
        {loading && (
          <div className="text-xs text-blue-500 animate-pulse">Thinking of what to say next...</div>
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
              <div className="flex-1">
                <h4 className="text-xs font-medium text-gray-600 mb-1">
                  {suggestion.title}
                </h4>
                <p className="text-sm text-gray-800 leading-relaxed">
                  • {suggestion.content}
                </p>
              </div>
            </div>
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
