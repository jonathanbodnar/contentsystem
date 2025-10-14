'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Eye, Presentation, Plus, GripVertical, Trash2 } from 'lucide-react'
import WritingEditor from '@/components/editor/WritingEditor'

interface PlaybookStep {
  title: string
  content: string
  order: number
  duration?: string
  resources?: string[]
  checkpoints?: string[]
}

interface PlaybookData {
  title: string
  description: string
  steps: PlaybookStep[]
}

interface Playbook {
  id: string
  title: string
  description?: string
  content: string
  prompt: string
  sourceDocument?: {
    title: string
  }
  isDraft: boolean
}

export default function PlaybookEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const [playbook, setPlaybook] = useState<Playbook | null>(null)
  const [playbookData, setPlaybookData] = useState<PlaybookData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null)

  // Resolve params
  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  useEffect(() => {
    if (resolvedParams) {
      fetchPlaybook()
    }
  }, [resolvedParams])

  const fetchPlaybook = async () => {
    if (!resolvedParams) return
    
    try {
      const response = await fetch(`/api/playbooks/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setPlaybook(data.playbook)
        
        try {
          const parsed = JSON.parse(data.playbook.content)
          setPlaybookData(parsed)
        } catch (error) {
          console.error('Failed to parse playbook content:', error)
        }
      }
    } catch (error) {
      console.error('Failed to fetch playbook:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!resolvedParams || !playbookData) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/playbooks/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: playbookData.title,
          description: playbookData.description,
          content: JSON.stringify(playbookData),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setPlaybook(data.playbook)
      }
    } catch (error) {
      console.error('Failed to save playbook:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleStepUpdate = (index: number, field: keyof PlaybookStep, value: string) => {
    if (!playbookData) return
    
    const updatedSteps = [...playbookData.steps]
    updatedSteps[index] = {
      ...updatedSteps[index],
      [field]: value
    }
    
    setPlaybookData({
      ...playbookData,
      steps: updatedSteps
    })
  }

  const addStep = () => {
    if (!playbookData) return
    
    const newStep: PlaybookStep = {
      title: 'New Step',
      content: '',
      order: playbookData.steps.length + 1,
      duration: '',
      resources: [],
      checkpoints: []
    }
    
    setPlaybookData({
      ...playbookData,
      steps: [...playbookData.steps, newStep]
    })
  }

  const removeStep = (index: number) => {
    if (!playbookData) return
    
    const updatedSteps = playbookData.steps.filter((_, i) => i !== index)
    // Reorder the remaining steps
    updatedSteps.forEach((step, i) => {
      step.order = i + 1
    })
    
    setPlaybookData({
      ...playbookData,
      steps: updatedSteps
    })
  }

  if (loading || !resolvedParams) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!playbook || !playbookData) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Playbook not found</p>
          <button
            onClick={() => router.push('/playbooks')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Playbooks
          </button>
        </div>
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
              onClick={() => router.push('/playbooks')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <input
                type="text"
                value={playbookData.title}
                onChange={(e) => setPlaybookData({ ...playbookData, title: e.target.value })}
                className="text-2xl font-semibold bg-transparent border-none outline-none text-gray-800"
              />
              <p className="text-gray-600">
                {playbook.sourceDocument ? `From: ${playbook.sourceDocument.title}` : 'Standalone Playbook'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/playbooks/${resolvedParams.id}`)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>

            <button
              onClick={() => router.push(`/playbooks/${resolvedParams.id}/slides`)}
              className="flex items-center gap-2 px-4 py-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
            >
              <Presentation className="w-4 h-4" />
              Slides
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Description */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Playbook Description
          </label>
          <textarea
            value={playbookData.description || ''}
            onChange={(e) => setPlaybookData({ ...playbookData, description: e.target.value })}
            placeholder="Describe what this playbook helps people achieve..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none text-gray-900 placeholder-gray-500"
          />
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {playbookData.steps.map((step, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Step {step.order}</span>
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => handleStepUpdate(index, 'title', e.target.value)}
                    className="font-semibold text-gray-800 bg-transparent border-none outline-none flex-1"
                    placeholder="Step title..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingStepIndex(editingStepIndex === index ? null : index)}
                    className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    {editingStepIndex === index ? 'Done' : 'Edit'}
                  </button>
                  <button
                    onClick={() => removeStep(index)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                {editingStepIndex === index ? (
                  <WritingEditor
                    content={step.content}
                    onChange={(content) => handleStepUpdate(index, 'content', content)}
                    placeholder="Describe the specific actions for this step..."
                  />
                ) : (
                  <div 
                    className="prose prose-sm max-w-none cursor-pointer hover:bg-gray-50 p-2 rounded"
                    onClick={() => setEditingStepIndex(index)}
                    dangerouslySetInnerHTML={{ __html: step.content || '<p class="text-gray-500">Click to add step content...</p>' }}
                  />
                )}

                {step.duration && (
                  <div className="mt-3 text-sm text-gray-600">
                    <strong>Duration:</strong> {step.duration}
                  </div>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={addStep}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5 mx-auto mb-1" />
            Add Step
          </button>
        </div>
      </div>
    </div>
  )
}
