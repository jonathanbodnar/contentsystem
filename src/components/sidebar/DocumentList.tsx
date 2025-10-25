'use client'

import { useState, useEffect } from 'react'
import { FileText, Folder, FolderOpen, Plus, Edit3 } from 'lucide-react'

interface Document {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  isDraft: boolean
  folderId?: string
}

interface FolderType {
  id: string
  name: string
  parentId?: string
  children: FolderType[]
  documents: Document[]
}

interface DocumentListProps {
  onDocumentSelect: (document: Document) => void
  onNewDocument: () => void
  selectedDocumentId?: string
}

export default function DocumentList({ onDocumentSelect, onNewDocument, selectedDocumentId }: DocumentListProps) {
  const [folders, setFolders] = useState<FolderType[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
        setFolders(data.folders || [])
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  const renderFolder = (folder: FolderType, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const paddingLeft = level * 16 + 8

    return (
      <div key={folder.id}>
        <div
          className="flex items-center gap-2 py-2 px-2 hover:bg-gray-50 cursor-pointer rounded-md"
          style={{ paddingLeft }}
          onClick={() => toggleFolder(folder.id)}
        >
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-gray-500" />
          ) : (
            <Folder className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-sm text-gray-700 font-medium">{folder.name}</span>
        </div>

        {isExpanded && (
          <div>
            {folder.documents.map(doc => renderDocument(doc, level + 1))}
            {folder.children.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const renderDocument = (document: Document, level: number = 0) => {
    const paddingLeft = level * 16 + 8
    const isSelected = document.id === selectedDocumentId

    return (
      <div
        key={document.id}
        className={`flex items-center gap-2 py-2 px-2 hover:bg-gray-50 cursor-pointer rounded-md ${
          isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''
        }`}
        style={{ paddingLeft }}
        onClick={() => onDocumentSelect(document)}
      >
        <FileText className="w-4 h-4 text-gray-400" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 truncate">
            {document.title || 'Untitled'}
          </p>
          <p className="text-xs text-gray-500">
            {document.isDraft ? 'Draft' : 'Published'} • {new Date(document.updatedAt).toLocaleDateString()}
          </p>
        </div>
        {document.isDraft && (
          <Edit3 className="w-3 h-3 text-gray-400" />
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-64 bg-white border-r border-gray-100 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-8 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const rootDocuments = documents.filter(doc => !doc.folderId)
  const rootFolders = folders.filter(folder => !folder.parentId)

  return (
    <div className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-100">
        <button
          onClick={onNewDocument}
          className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Document
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {rootFolders.map(folder => renderFolder(folder))}
          {rootDocuments.map(doc => renderDocument(doc))}
        </div>

        {rootFolders.length === 0 && rootDocuments.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No documents yet</p>
            <p className="text-xs mt-1">Create your first document</p>
          </div>
        )}
      </div>
    </div>
  )
}

