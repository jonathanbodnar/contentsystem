'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Presentation, Play } from 'lucide-react'

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
  sourceDocument?: {
    title: string
  }
}

export default function PlaybookViewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const [playbook, setPlaybook] = useState<Playbook | null>(null)
  const [playbookData, setPlaybookData] = useState<PlaybookData | null>(null)
  const [loading, setLoading] = useState(true)

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
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/playbooks')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">{playbookData.title}</h1>
              {playbook.sourceDocument && (
                <p className="text-gray-600">From: {playbook.sourceDocument.title}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/playbooks/${resolvedParams.id}/present`)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              Present
            </button>

            <button
              onClick={() => router.push(`/playbooks/${resolvedParams.id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>

            <button
              onClick={() => router.push(`/playbooks/${resolvedParams.id}/slides`)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Presentation className="w-4 h-4" />
              Slides
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Description */}
        {playbookData.description && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Overview</h2>
            <p className="text-gray-700 leading-relaxed">{playbookData.description}</p>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-6">
          {playbookData.steps.map((step, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  {step.order}
                </div>
                <h3 className="text-xl font-semibold text-gray-800">{step.title}</h3>
              </div>

              <div 
                className="prose prose-sm max-w-none text-gray-900 mb-4"
                dangerouslySetInnerHTML={{ __html: step.content }}
              />

              {step.duration && (
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Duration:</strong> {step.duration}
                </div>
              )}

              {step.resources && step.resources.length > 0 && (
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Resources:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {step.resources.map((resource, i) => (
                      <li key={i}>{resource}</li>
                    ))}
                  </ul>
                </div>
              )}

              {step.checkpoints && step.checkpoints.length > 0 && (
                <div className="text-sm text-gray-600">
                  <strong>Success Checkpoints:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {step.checkpoints.map((checkpoint, i) => (
                      <li key={i}>{checkpoint}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
