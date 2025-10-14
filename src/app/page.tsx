'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Database, Target } from 'lucide-react'
import DocumentList from '@/components/sidebar/DocumentList'
import ContextManager from '@/components/context/ContextManager'
import IkigaiEditor from '@/components/ikigai/IkigaiEditor'

interface Document {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  isDraft: boolean
  folderId?: string
}

export default function Home() {
  const router = useRouter()
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>()
  const [showContextManager, setShowContextManager] = useState(false)
  const [showIkigaiEditor, setShowIkigaiEditor] = useState(false)

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocumentId(document.id)
    router.push(`/write/${document.id}`)
  }

  const handleNewDocument = () => {
    router.push('/write/new')
  }

  return (
    <div className="h-screen flex bg-white">
      <DocumentList
        onDocumentSelect={handleDocumentSelect}
        onNewDocument={handleNewDocument}
        selectedDocumentId={selectedDocumentId}
      />
      
      <div className="flex-1 flex flex-col">
        {/* Header with navigation */}
        <div className="border-b border-gray-100 p-4 flex justify-end gap-3">
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
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-3xl font-light text-gray-800 mb-4">
              Writing Assistant
            </h1>
            <p className="text-gray-600 mb-8 max-w-md">
              Select a document from the sidebar to start editing, or create a new document to begin writing.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleNewDocument}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Writing
              </button>
              <button
                onClick={() => setShowIkigaiEditor(true)}
                className="px-6 py-3 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Define Ikigai
              </button>
              <button
                onClick={() => setShowContextManager(true)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Manage Context
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ikigai Editor */}
      <IkigaiEditor
        isOpen={showIkigaiEditor}
        onClose={() => setShowIkigaiEditor(false)}
      />

      {/* Global Context Manager */}
      <ContextManager
        isOpen={showContextManager}
        onClose={() => setShowContextManager(false)}
      />
    </div>
  )
}