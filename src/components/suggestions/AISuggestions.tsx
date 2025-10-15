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
    
    if (!currentContent || contentLength < 10) { // Very low threshold for instant feedback
      setSuggestions([])
      return
    }

    console.log('Scheduling suggestions fetch for content:', contentLength, 'characters')
    const debounceTimer = setTimeout(() => {
      fetchSuggestions(currentContent)
    }, 800) // Much faster - almost instant feedback

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
    <div className="w-80 bg-white border-l border-gray-100 flex flex-col max-h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-700">AI Writing Coach</h3>
        <p className="text-xs text-gray-500">Live feedback as you write</p>
      </div>

      {/* Chat-like suggestions feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="flex items-center gap-2 text-xs text-blue-500">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <span className="ml-2">AI is thinking...</span>
          </div>
        )}

        {suggestions.map((suggestion, index) => (
          <div key={suggestion.id} className="flex justify-start">
            <div
              className="max-w-xs bg-blue-500 text-white rounded-2xl rounded-bl-sm px-4 py-2 cursor-pointer hover:bg-blue-600 transition-colors"
              onClick={() => onSuggestionClick?.(suggestion)}
            >
              <div className="text-sm leading-relaxed">
                {suggestion.content}
              </div>
              {suggestion.source && (
                <div className="text-xs opacity-75 mt-1">
                  💡 from {suggestion.source}
                </div>
              )}
            </div>
          </div>
        ))}

        {!loading && suggestions.length === 0 && currentContent && currentContent.length >= 10 && (
          <div className="text-center text-gray-400 py-4">
            <p className="text-xs">Keep writing... AI coach will chime in soon! 💭</p>
          </div>
        )}

        {(!currentContent || currentContent.length < 10) && (
          <div className="text-center text-gray-400 py-8">
            <p className="text-sm">Start writing and I&apos;ll jump in with ideas! ✍️</p>
          </div>
        )}
      </div>
    </div>
  )
}
