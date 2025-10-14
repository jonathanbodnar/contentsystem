'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Save, ArrowLeft, Send, Database, Target } from 'lucide-react'
import WritingEditor from '@/components/editor/WritingEditor'
import AISuggestions from '@/components/suggestions/AISuggestions'
import ContextManager from '@/components/context/ContextManager'
import IkigaiEditor from '@/components/ikigai/IkigaiEditor'
import TitleInput from '@/components/TitleInput'

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
  const [autoSaving, setAutoSaving] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedContentRef = useRef<string>('')
  const lastSavedTitleRef = useRef<string>('')
  const documentLoadedRef = useRef<boolean>(false)
  const isTypingRef = useRef<boolean>(false)

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

  const saveDocument = useCallback(async (isDraft: boolean = true) => {
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
      
      // Update our saved content refs
      lastSavedContentRef.current = content
      lastSavedTitleRef.current = title
    } catch (error) {
      console.error('Failed to save document:', error)
    } finally {
      setSaving(false)
    }
  }, [resolvedParams, content, title, router])

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

  // Smart auto-save system that doesn't interfere with typing
  useEffect(() => {
    // Don't auto-save if we're currently saving or loading
    if (saving || loading || !documentLoadedRef.current) return
    
    // Only save if content or title has actually changed since last save
    const contentChanged = content !== lastSavedContentRef.current
    const titleChanged = title !== lastSavedTitleRef.current
    
    if (!contentChanged && !titleChanged) return
    if (!content.trim() && !title.trim()) return
    
    // Clear any existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    
    // Set typing flag to prevent saves during active typing
    isTypingRef.current = true
    
    // Auto-save after user stops typing for 5 seconds
    autoSaveTimeoutRef.current = setTimeout(async () => {
      // Double-check that content has actually changed
      if (content !== lastSavedContentRef.current || title !== lastSavedTitleRef.current) {
        console.log('Auto-saving...', { 
          contentChanged: content !== lastSavedContentRef.current,
          titleChanged: title !== lastSavedTitleRef.current 
        })
        setAutoSaving(true)
        await saveDocument()
        setAutoSaving(false)
      }
      isTypingRef.current = false
    }, 5000) // 5 seconds after stopping typing

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [content, title, saving, loading, saveDocument])

  // Update saved refs when document is initially loaded
  useEffect(() => {
    if (documentLoadedRef.current) {
      lastSavedContentRef.current = content
      lastSavedTitleRef.current = title
    }
  }, [content, title])

  // Save on page unload/visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && (content !== lastSavedContentRef.current || title !== lastSavedTitleRef.current)) {
        saveDocument()
      }
    }

    const handleBeforeUnload = () => {
      if (content !== lastSavedContentRef.current || title !== lastSavedTitleRef.current) {
        saveDocument()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [content, title, saveDocument])

  // Keyboard shortcut for manual save (Cmd/Ctrl + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        console.log('Manual save triggered via keyboard shortcut')
        saveDocument()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [saveDocument])

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
            <TitleInput
              initialValue={title}
              onTitleChange={(newTitle) => {
                console.log('Title changing to:', newTitle)
                setTitle(newTitle)
              }}
              placeholder="Document title..."
            />
          </div>

          <div className="flex items-center gap-3">
            {autoSaving ? (
              <span className="text-sm text-blue-600 flex items-center gap-1">
                <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                Auto-saving...
              </span>
            ) : lastSaved ? (
              <span className="text-sm text-green-600">
                ✓ Saved {lastSaved.toLocaleTimeString()}
              </span>
            ) : null}
            
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
