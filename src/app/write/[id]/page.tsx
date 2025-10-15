'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Save, ArrowLeft, Send, Database, Target, Trash2 } from 'lucide-react'
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
        
        // Set title and content from document
        const docTitle = data.document.title || ''
        const docContent = data.document.content || ''
        setTitle(docTitle)
        setContent(docContent)
        documentLoadedRef.current = true
        console.log('Document loaded and state set:', { 
          docTitle, 
          docContentLength: docContent.length,
          stateTitle: title,
          stateContentLength: content.length
        })
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

  // Track if we've already initialized this document to prevent loops
  const initializedDocIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!resolvedParams) return
    
    // Only initialize if this is a different document
    if (initializedDocIdRef.current === resolvedParams.id) return
    
    console.log('Document change detected:', { 
      from: initializedDocIdRef.current, 
      to: resolvedParams.id 
    })
    
    // Reset the document loaded flag when switching documents
    documentLoadedRef.current = false
    initializedDocIdRef.current = resolvedParams.id
    
    if (resolvedParams.id === 'new') {
      setDocument(null)
      setContent('')
      setTitle('')
      setLoading(false)
      // Reset tracking refs for new document
      lastSavedContentRef.current = ''
      lastSavedTitleRef.current = ''
      console.log('New document initialized ONCE')
    } else {
      fetchDocument(resolvedParams.id)
    }
  }, [resolvedParams, router, fetchDocument])

  const saveDocument = useCallback(async (isDraft: boolean = true, forceEmptySave: boolean = false) => {
    if (!resolvedParams) return
    
    // Prevent saving completely empty documents unless forced
    if (!forceEmptySave && !title.trim() && !content.trim()) {
      console.log('Skipping save - no content to save', { title, content, titleLength: title.length, contentLength: content.length })
      return
    }
    
    console.log('Saving document...', { 
      id: resolvedParams.id,
      title: title || 'Untitled', 
      contentLength: content.length,
      isDraft,
      forceEmptySave 
    })
    
    setSaving(true)
    try {
      if (resolvedParams.id === 'new') {
        // Create new document - only if there's actual content
        if (!title.trim() && !content.trim() && !forceEmptySave) {
          console.log('Skipping new document creation - no content')
          setSaving(false)
          return
        }
        
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
          setDocument(data.document)
          // Update our tracking refs immediately after successful save
          lastSavedContentRef.current = content
          lastSavedTitleRef.current = title
          // DON'T redirect - this causes content loss
          // Just update the URL without navigation
          window.history.replaceState(null, '', `/write/${data.document.id}`)
          // Update the resolved params to reflect the new ID
          setResolvedParams({ id: data.document.id })
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

  const handleDelete = async () => {
    if (!resolvedParams || resolvedParams.id === 'new') return
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${title || 'this document'}"? This action cannot be undone.`
    )
    
    if (!confirmDelete) return
    
    try {
      const response = await fetch(`/api/documents/${resolvedParams.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        console.log('Document deleted successfully')
        router.push('/')
      } else {
        alert('Failed to delete document')
      }
    } catch (error) {
      console.error('Failed to delete document:', error)
      alert('Failed to delete document')
    }
  }

  // DISABLE AUTO-SAVE COMPLETELY until save cycle is fixed
  // useEffect(() => {
  //   // Don't auto-save if we're currently saving or loading
  //   if (saving || loading || !documentLoadedRef.current) return
    
  //   // Only save if content or title has actually changed since last save
  //   const contentChanged = content !== lastSavedContentRef.current
  //   const titleChanged = title !== lastSavedTitleRef.current
    
  //   if (!contentChanged && !titleChanged) return
  //   // Only auto-save if there's actual content (at least 10 characters)
  //   if (!content.trim() && !title.trim()) return
  //   if (content.trim().length < 10 && !title.trim()) return
    
  //   // Clear any existing timeout
  //   if (autoSaveTimeoutRef.current) {
  //     clearTimeout(autoSaveTimeoutRef.current)
  //   }
    
  //   // Set typing flag to prevent saves during active typing
  //   isTypingRef.current = true
    
  //   // Auto-save after user stops typing for 5 seconds
  //   autoSaveTimeoutRef.current = setTimeout(async () => {
  //     // Double-check that content has actually changed
  //     if (content !== lastSavedContentRef.current || title !== lastSavedTitleRef.current) {
  //       console.log('Auto-saving...', { 
  //         contentChanged: content !== lastSavedContentRef.current,
  //         titleChanged: title !== lastSavedTitleRef.current,
  //         contentLength: content.length,
  //         titleLength: title.length,
  //         contentTrimmed: content.trim().length,
  //         titleTrimmed: title.trim().length
  //       })
  //       setAutoSaving(true)
  //       await saveDocument()
  //       setAutoSaving(false)
  //     } else {
  //       console.log('Auto-save skipped - no changes detected')
  //     }
  //     isTypingRef.current = false
  //   }, 5000) // 5 seconds after stopping typing

  //   return () => {
  //     if (autoSaveTimeoutRef.current) {
  //       clearTimeout(autoSaveTimeoutRef.current)
  //     }
  //   }
  // }, [content, title, saving, loading, saveDocument])

  // Update saved refs when document is initially loaded (but not during typing)
  useEffect(() => {
    if (documentLoadedRef.current && !isTypingRef.current) {
      // Only update refs if this seems to be from a document load, not user typing
      if (lastSavedContentRef.current === '' && lastSavedTitleRef.current === '') {
        lastSavedContentRef.current = content
        lastSavedTitleRef.current = title
        console.log('Updated saved refs on document load:', { content: content.length, title: title.length })
      }
    }
  }, [content, title])

  // Save on page unload/visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (typeof window !== 'undefined' && typeof window.document !== 'undefined' && window.document.hidden && (content !== lastSavedContentRef.current || title !== lastSavedTitleRef.current)) {
        saveDocument()
      }
    }

    const handleBeforeUnload = () => {
      if (content !== lastSavedContentRef.current || title !== lastSavedTitleRef.current) {
        saveDocument()
      }
    }

    if (typeof window !== 'undefined') {
      window.document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
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

    if (typeof window !== 'undefined') {
      window.document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.document.removeEventListener('keydown', handleKeyDown)
      }
    }
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
            <input
              type="text"
              value={title}
              onChange={(e) => {
                console.log('Direct title change:', e.target.value)
                setTitle(e.target.value)
              }}
              placeholder="Document title..."
              className="text-xl font-semibold bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 flex-1 min-w-0"
              autoComplete="off"
              spellCheck="false"
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
              onClick={() => saveDocument(true, true)} // Force save even if empty
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Draft'}
            </button>

            {resolvedParams?.id !== 'new' && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}

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
