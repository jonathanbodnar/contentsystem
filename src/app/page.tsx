'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DocumentList from '@/components/sidebar/DocumentList'

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
      
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-light text-gray-800 mb-4">
            Writing Assistant
          </h1>
          <p className="text-gray-600 mb-8 max-w-md">
            Select a document from the sidebar to start editing, or create a new document to begin writing.
          </p>
          <button
            onClick={handleNewDocument}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Writing
          </button>
        </div>
      </div>
    </div>
  )
}