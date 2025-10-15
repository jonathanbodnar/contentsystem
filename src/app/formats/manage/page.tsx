'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit, Trash2, Upload, FileText, Database, X } from 'lucide-react'
import ContextManager from '@/components/context/ContextManager'

interface Format {
  id: string
  name: string
  platform: string
  prompt: string
  contextFiles?: string[]
  postingRules: PostingRule[]
}

interface PostingRule {
  id?: string
  frequency: number
  dayOfWeek?: number | null
  timeOfDay?: string | null
}

interface PostingRuleInput {
  frequency: number
  dayOfWeek?: number | null
  timeOfDay?: string | null
}

export default function FormatManagePage() {
  const router = useRouter()
  const [formats, setFormats] = useState<Format[]>([])
  const [loading, setLoading] = useState(true)
  const [editingFormat, setEditingFormat] = useState<Format | null>(null)
  const [showNewFormat, setShowNewFormat] = useState(false)
  const [showContextManager, setShowContextManager] = useState(false)

  useEffect(() => {
    fetchFormats()
  }, [])

  const fetchFormats = async () => {
    try {
      const response = await fetch('/api/formats')
      if (response.ok) {
        const data = await response.json()
        setFormats(data.formats)
      }
    } catch (error) {
      console.error('Failed to fetch formats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveFormat = async (formatData: Partial<Format> & { postingRules: PostingRuleInput[] }) => {
    try {
      const url = editingFormat ? `/api/formats/${editingFormat.id}` : '/api/formats'
      const method = editingFormat ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formatData),
      })

      if (response.ok) {
        await fetchFormats()
        setEditingFormat(null)
        setShowNewFormat(false)
      }
    } catch (error) {
      console.error('Failed to save format:', error)
    }
  }

  const handleDeleteFormat = async (id: string) => {
    if (!confirm('Are you sure you want to delete this format?')) return

    try {
      const response = await fetch(`/api/formats/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchFormats()
      }
    } catch (error) {
      console.error('Failed to delete format:', error)
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
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">
                Format Management
              </h1>
              <p className="text-gray-600">Configure publishing formats and rules</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowContextManager(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Database className="w-4 h-4" />
              Context Library
            </button>

            <button
              onClick={() => setShowNewFormat(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Format
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {formats.map((format) => (
            <FormatCard
              key={format.id}
              format={format}
              onEdit={setEditingFormat}
              onDelete={handleDeleteFormat}
            />
          ))}
        </div>
      </div>

      {/* Format Editor Modal */}
      {(editingFormat || showNewFormat) && (
        <FormatEditor
          format={editingFormat}
          onSave={handleSaveFormat}
          onClose={() => {
            setEditingFormat(null)
            setShowNewFormat(false)
          }}
        />
      )}

      {/* Global Context Manager */}
      <ContextManager
        isOpen={showContextManager}
        onClose={() => setShowContextManager(false)}
      />
    </div>
  )
}

function FormatCard({ format, onEdit, onDelete }: {
  format: Format
  onEdit: (format: Format) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800">{format.name}</h3>
          <p className="text-sm text-gray-600">{format.platform}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(format)}
            className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(format.id)}
            className="p-1 text-gray-600 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-gray-700 mb-1">Posting Rules</p>
          <p className="text-sm text-gray-600">
            {format.postingRules[0]?.frequency || 0} times per week
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-700 mb-1">Prompt Preview</p>
          <p className="text-sm text-gray-600 line-clamp-3">
            {format.prompt.substring(0, 120)}...
          </p>
        </div>

        {format.contextFiles && format.contextFiles.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-700 mb-1">Context Files</p>
            <p className="text-sm text-gray-600">
              {format.contextFiles.length} file{format.contextFiles.length !== 1 ? 's' : ''} attached
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function FormatEditor({ format, onSave, onClose }: {
  format: Format | null
  onSave: (data: Partial<Format> & { postingRules: PostingRuleInput[] }) => void
  onClose: () => void
}) {
  const [name, setName] = useState(format?.name || '')
  const [platform, setPlatform] = useState(format?.platform || '')
  const [prompt, setPrompt] = useState(format?.prompt || '')
  const [frequency, setFrequency] = useState(format?.postingRules[0]?.frequency || 1)
  const [dayOfWeek, setDayOfWeek] = useState(format?.postingRules[0]?.dayOfWeek?.toString() || '')
  const [timeOfDay, setTimeOfDay] = useState(format?.postingRules[0]?.timeOfDay || '')
  const [contextFiles, setContextFiles] = useState<string[]>(format?.contextFiles || [])
  const [showContextUpload, setShowContextUpload] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const postingRules = [{
      frequency,
      dayOfWeek: dayOfWeek ? parseInt(dayOfWeek) : null,
      timeOfDay: timeOfDay || null,
    }]

    onSave({
      name,
      platform,
      prompt,
      contextFiles,
      postingRules,
    })
  }

  const days = [
    { value: '', label: 'Any day' },
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {format ? 'Edit Format' : 'Create New Format'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., LinkedIn Post"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform *
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select platform</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="X">X (Twitter)</option>
                  <option value="Email">Newsletter/Email</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Medium">Medium</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Posting Rules */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">Posting Rules</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Posts per week *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="21"
                      value={frequency}
                      onChange={(e) => setFrequency(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred day
                    </label>
                    <select
                      value={dayOfWeek}
                      onChange={(e) => setDayOfWeek(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {days.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred time
                    </label>
                    <input
                      type="time"
                      value={timeOfDay}
                      onChange={(e) => setTimeOfDay(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Prompt and Context */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format Prompt *
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe how content should be formatted for this platform..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-48 resize-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Describe the style, tone, length, and specific requirements for this platform
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Format-Specific Context Files
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowContextUpload(true)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Upload className="w-4 h-4 inline mr-1" />
                    Upload
                  </button>
                </div>
                
                {contextFiles.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <FileText className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      No format-specific context files
                    </p>
                    <p className="text-xs text-gray-500">
                      Upload documents specific to this format&apos;s style and requirements
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {contextFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{file}</span>
                        <button
                          type="button"
                          onClick={() => setContextFiles(files => files.filter((_, i) => i !== index))}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {format ? 'Update Format' : 'Create Format'}
            </button>
          </div>
        </form>
      </div>

      {/* Context Upload Modal */}
      {showContextUpload && (
        <FormatContextUpload
          onFileSelected={(filename) => {
            setContextFiles(prev => [...prev, filename])
            setShowContextUpload(false)
          }}
          onClose={() => setShowContextUpload(false)}
        />
      )}
    </div>
  )
}

function FormatContextUpload({ onFileSelected, onClose }: {
  onFileSelected: (filename: string) => void
  onClose: () => void
}) {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!supportedTypes.includes(file.type)) {
      alert('Please select a PDF or DOCX file')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'format-context')

      const response = await fetch('/api/context/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        onFileSelected(file.name)
      } else {
        const error = await response.json()
        console.error('Upload error response:', error)
        const errorMessage = error.details ? 
          `${error.error}: ${error.details}` : 
          (error.error || 'Failed to upload file')
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Upload Context File</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileUpload}
            className="hidden"
            id="format-context-upload"
            disabled={uploading}
          />
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 mb-2">
            Upload format-specific context
          </p>
          <label
            htmlFor="format-context-upload"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-block"
          >
            {uploading ? 'Uploading...' : 'Select File'}
          </label>
        </div>
      </div>
    </div>
  )
}
