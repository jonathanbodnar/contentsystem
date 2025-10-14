'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, BookOpen, FileText, Target, Database, Presentation } from 'lucide-react'
import ContextManager from '@/components/context/ContextManager'
import IkigaiEditor from '@/components/ikigai/IkigaiEditor'

interface Playbook {
  id: string
  title: string
  description?: string
  sourceDocumentId?: string
  sourceDocument?: {
    title: string
  }
  isDraft: boolean
  createdAt: string
  updatedAt: string
  slides: PlaybookSlide[]
}

interface PlaybookSlide {
  id: string
  order: number
  title: string
  content: string
  layout: string
}

interface Document {
  id: string
  title: string
  content: string
  isDraft: boolean
}

export default function PlaybooksPage() {
  const router = useRouter()
  const [playbooks, setPlaybooks] = useState<Playbook[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showContextManager, setShowContextManager] = useState(false)
  const [showIkigaiEditor, setShowIkigaiEditor] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [playbooksResponse, documentsResponse] = await Promise.all([
        fetch('/api/playbooks'),
        fetch('/api/documents')
      ])

      if (playbooksResponse.ok) {
        const playbooksData = await playbooksResponse.json()
        setPlaybooks(playbooksData.playbooks)
      }

      if (documentsResponse.ok) {
        const documentsData = await documentsResponse.json()
        setDocuments(documentsData.documents.filter((doc: Document) => !doc.isDraft))
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlaybook = async (sourceDocumentId: string, prompt: string) => {
    try {
      const response = await fetch('/api/playbooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceDocumentId,
          prompt,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/playbooks/${data.playbook.id}/edit`)
      }
    } catch (error) {
      console.error('Failed to create playbook:', error)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ←
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                <BookOpen className="w-6 h-6" />
                Playbooks
              </h1>
              <p className="text-gray-600">Step-by-step action guides from your concepts</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
              Context Library
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Playbook
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {playbooks.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              No Playbooks Yet
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Transform your written concepts into actionable step-by-step playbooks that help people implement your ideas.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Playbook
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playbooks.map((playbook) => (
              <PlaybookCard
                key={playbook.id}
                playbook={playbook}
                onClick={() => router.push(`/playbooks/${playbook.id}`)}
                onEdit={() => router.push(`/playbooks/${playbook.id}/edit`)}
                onSlides={() => router.push(`/playbooks/${playbook.id}/slides`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Playbook Modal */}
      {showCreateModal && (
        <CreatePlaybookModal
          documents={documents}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreatePlaybook}
        />
      )}

      {/* Ikigai Editor */}
      <IkigaiEditor
        isOpen={showIkigaiEditor}
        onClose={() => setShowIkigaiEditor(false)}
      />

      {/* Context Manager */}
      <ContextManager
        isOpen={showContextManager}
        onClose={() => setShowContextManager(false)}
      />
    </div>
  )
}

function PlaybookCard({ playbook, onClick, onEdit, onSlides }: {
  playbook: Playbook
  onClick: () => void
  onEdit: () => void
  onSlides: () => void
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 mb-1">{playbook.title}</h3>
            {playbook.description && (
              <p className="text-sm text-gray-600 mb-2">{playbook.description}</p>
            )}
            {playbook.sourceDocument && (
              <p className="text-xs text-blue-600">
                From: {playbook.sourceDocument.title}
              </p>
            )}
          </div>
          <span className={`px-2 py-1 text-xs rounded-full ${
            playbook.isDraft ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
          }`}>
            {playbook.isDraft ? 'Draft' : 'Published'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <span>{playbook.slides.length} slides</span>
          <span>•</span>
          <span>{new Date(playbook.updatedAt).toLocaleDateString()}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClick}
            className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FileText className="w-4 h-4 inline mr-1" />
            View
          </button>
          <button
            onClick={onEdit}
            className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onSlides}
            className="flex-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            <Presentation className="w-4 h-4 inline mr-1" />
            Slides
          </button>
        </div>
      </div>
    </div>
  )
}

function CreatePlaybookModal({ documents, onClose, onCreate }: {
  documents: Document[]
  onClose: () => void
  onCreate: (sourceDocumentId: string, prompt: string) => void
}) {
  const [selectedDocumentId, setSelectedDocumentId] = useState('')
  const [customPrompt, setCustomPrompt] = useState(`Transform this concept into a comprehensive, actionable playbook that includes:

1. Clear step-by-step instructions
2. Specific actions readers can take immediately
3. Tools and resources needed for each step
4. Common challenges and how to overcome them
5. Success metrics and checkpoints
6. Real-world examples and case studies

Structure the playbook with:
- Executive summary of the concept
- Prerequisites and preparation steps
- Detailed action steps (numbered and sequential)
- Implementation timeline
- Troubleshooting guide
- Next steps and advanced techniques

Make it practical, actionable, and easy to follow for someone wanting to implement this concept.`)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedDocumentId && customPrompt.trim()) {
      onCreate(selectedDocumentId, customPrompt)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Create New Playbook</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Document *
              </label>
              <select
                value={selectedDocumentId}
                onChange={(e) => setSelectedDocumentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a published document to base the playbook on</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose a published document that contains the concept you want to turn into a playbook
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Playbook Generation Prompt *
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-64 resize-none text-gray-900"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Customize how the AI should transform your concept into an actionable playbook
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedDocumentId || !customPrompt.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Generate Playbook
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
