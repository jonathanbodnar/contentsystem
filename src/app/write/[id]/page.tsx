'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, ArrowLeft, Send, Database } from 'lucide-react'
import WritingEditor from '@/components/editor/WritingEditor'
import AISuggestions from '@/components/suggestions/AISuggestions'
import ContextManager from '@/components/context/ContextManager'

interface Document {
  id: string
  title: string
  content: string
  isDraft: boolean
  createdAt: string
  updatedAt: string
}

interface Suggestion {
  id: string
  type: 'fact' | 'reference' | 'idea'
  title: string
  content: string
  source?: string
  relevanceScore: number
}

export default function WritePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const [document, setDocument] = useState<Document | null>(null)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showContextManager, setShowContextManager] = useState(false)

  // Resolve params
  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  const fetchDocument = async (id: string) => {
    try {
      const response = await fetch(`/api/documents/${id}`)
      if (response.ok) {
        const data = await response.json()
        setDocument(data.document)
        setContent(data.document.content)
        setTitle(data.document.title)
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Failed to fetch document:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!resolvedParams) return
    
    if (resolvedParams.id === 'new') {
      setDocument(null)
      setContent('')
      setTitle('')
      setLoading(false)
    } else {
      fetchDocument(resolvedParams.id)
    }
  }, [resolvedParams, router, fetchDocument])

  const saveDocument = async (isDraft: boolean = true) => {
    if (!resolvedParams) return
    setSaving(true)
    try {
      if (resolvedParams.id === 'new') {
        // Create new document
        const response = await fetch('/api/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: title || 'Untitled',
            content,
            isDraft,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          router.replace(`/write/${data.document.id}`)
          setDocument(data.document)
        }
      } else {
        // Update existing document
        const response = await fetch(`/api/documents/${resolvedParams.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            content,
            isDraft,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setDocument(data.document)
        }
      }
      setLastSaved(new Date())
    } catch (error) {
      console.error('Failed to save document:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSuggestionClick = (suggestion: Suggestion) => {
    // Insert suggestion at the end of the current content
    const newContent = content + '\n\n' + suggestion.content
    setContent(newContent)
  }

  const handlePush = async () => {
    if (!resolvedParams) return
    await saveDocument(false)
    router.push(`/formats/${resolvedParams.id}`)
  }

  // Auto-save functionality
  useEffect(() => {
    if (!content && !title) return
    
    const timer = setTimeout(() => {
      if (content || title) {
        saveDocument()
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [content, title, saveDocument])

  if (loading || !resolvedParams) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-white">
      {/* Main writing area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title..."
              className="text-xl font-semibold bg-transparent border-none outline-none text-gray-800 placeholder-gray-400"
            />
          </div>

          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-sm text-gray-500">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            
            <button
              onClick={() => setShowContextManager(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Database className="w-4 h-4" />
              Context
            </button>

            <button
              onClick={() => saveDocument()}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Draft'}
            </button>

            <button
              onClick={handlePush}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Send className="w-4 h-4" />
              Push to Formats
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <WritingEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your thoughts..."
          />
        </div>
      </div>

      {/* AI Suggestions Sidebar */}
      <AISuggestions
        currentContent={content}
        onSuggestionClick={handleSuggestionClick}
      />

      {/* Context Manager Modal */}
      <ContextManager
        isOpen={showContextManager}
        onClose={() => setShowContextManager(false)}
      />
    </div>
  )
}
