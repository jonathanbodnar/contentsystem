'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Save, ArrowLeft, Send, Database, Target } from 'lucide-react'
import WritingEditor from '@/components/editor/WritingEditor'
import AISuggestions from '@/components/suggestions/AISuggestions'
import ContextManager from '@/components/context/ContextManager'
import IkigaiEditor from '@/components/ikigai/IkigaiEditor'

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
  const [showIkigaiEditor, setShowIkigaiEditor] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastContentRef = useRef<string>('')
  const documentLoadedRef = useRef<boolean>(false)

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
        setContent(data.document.content || '')
        
        // Only set title on initial load, not on subsequent fetches
        if (!documentLoadedRef.current) {
          setTitle(data.document.title || '')
          documentLoadedRef.current = true
        }
        console.log('Document loaded:', { title: data.document.title, content: data.document.content?.length })
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
    
    // Reset the document loaded flag when switching documents
    documentLoadedRef.current = false
    
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

  // DISABLE ALL AUTO-SAVE for debugging title issue
  // useEffect(() => {
  //   // Only auto-save if content has actually changed
  //   if (content === lastContentRef.current) return
  //   if (!content && !title) return
    
  //   // Clear any existing timeout
  //   if (autoSaveTimeoutRef.current) {
  //     clearTimeout(autoSaveTimeoutRef.current)
  //   }
    
  //   // Set new timeout for auto-save
  //   autoSaveTimeoutRef.current = setTimeout(() => {
  //     if (content !== lastContentRef.current) {
  //       lastContentRef.current = content
  //       saveDocument()
  //     }
  //   }, 3000) // Increased to 3 seconds to give more typing time

  //   return () => {
  //     if (autoSaveTimeoutRef.current) {
  //       clearTimeout(autoSaveTimeoutRef.current)
  //     }
  //   }
  // }, [content, title])

  // Disable title auto-save for now to prevent jumping
  // useEffect(() => {
  //   if (!title.trim()) return
    
  //   const titleSaveTimeout = setTimeout(() => {
  //     saveDocument()
  //   }, 1000)

  //   return () => clearTimeout(titleSaveTimeout)
  // }, [title])

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
              onChange={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Title changing to:', e.target.value)
                setTitle(e.target.value)
              }}
              onKeyDown={(e) => e.stopPropagation()}
              onKeyUp={(e) => e.stopPropagation()}
              placeholder="Document title..."
              className="text-xl font-semibold bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 flex-1 min-w-0"
              autoComplete="off"
              spellCheck="false"
            />
          </div>

          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-sm text-gray-500">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            
            <button
              onClick={() => setShowIkigaiEditor(true)}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Target className="w-4 h-4" />
              Ikigai
            </button>

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
        <div className="flex-1 overflow-y-auto">
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

      {/* Ikigai Editor */}
      <IkigaiEditor
        isOpen={showIkigaiEditor}
        onClose={() => setShowIkigaiEditor(false)}
      />

      {/* Context Manager Modal */}
      <ContextManager
        isOpen={showContextManager}
        onClose={() => setShowContextManager(false)}
      />
    </div>
  )
}
