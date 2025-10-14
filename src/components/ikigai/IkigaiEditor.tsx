'use client'

import { useState, useEffect } from 'react'
import { Save, Target, X } from 'lucide-react'

interface IkigaiData {
  id?: string
  mission: string
  purpose: string
  values: string
  goals: string
  audience: string
  voice: string
}

interface IkigaiEditorProps {
  isOpen: boolean
  onClose: () => void
}

export default function IkigaiEditor({ isOpen, onClose }: IkigaiEditorProps) {
  const [ikigai, setIkigai] = useState<IkigaiData>({
    mission: '',
    purpose: '',
    values: '',
    goals: '',
    audience: '',
    voice: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchIkigai()
    }
  }, [isOpen])

  const fetchIkigai = async () => {
    try {
      const response = await fetch('/api/ikigai')
      if (response.ok) {
        const data = await response.json()
        if (data.ikigai) {
          setIkigai(data.ikigai)
        }
      }
    } catch (error) {
      console.error('Failed to fetch ikigai:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/ikigai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ikigai),
      })

      if (response.ok) {
        setLastSaved(new Date())
      }
    } catch (error) {
      console.error('Failed to save ikigai:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof IkigaiData, value: string) => {
    setIkigai(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Your Ikigai</h2>
              <p className="text-sm text-gray-600">Define your mission and purpose to guide all content creation</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-sm text-gray-500">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mission Statement *
                  </label>
                  <textarea
                    value={ikigai.mission}
                    onChange={(e) => handleChange('mission', e.target.value)}
                    placeholder="What is your core mission? What are you trying to achieve?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Your fundamental purpose and what drives you</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purpose & Why *
                  </label>
                  <textarea
                    value={ikigai.purpose}
                    onChange={(e) => handleChange('purpose', e.target.value)}
                    placeholder="Why does this matter? What impact do you want to make?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">The deeper meaning behind your work</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Core Values *
                  </label>
                  <textarea
                    value={ikigai.values}
                    onChange={(e) => handleChange('values', e.target.value)}
                    placeholder="What principles guide your decisions and content?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">The principles that should be reflected in all content</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Goals & Outcomes *
                  </label>
                  <textarea
                    value={ikigai.goals}
                    onChange={(e) => handleChange('goals', e.target.value)}
                    placeholder="What specific outcomes are you working toward?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Concrete objectives your content should support</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience *
                  </label>
                  <textarea
                    value={ikigai.audience}
                    onChange={(e) => handleChange('audience', e.target.value)}
                    placeholder="Who are you serving? What are their needs and challenges?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">The people you're creating content for</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Voice & Tone *
                  </label>
                  <textarea
                    value={ikigai.voice}
                    onChange={(e) => handleChange('voice', e.target.value)}
                    placeholder="How do you communicate? What's your unique voice?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Your unique communication style and personality</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">How Ikigai Guides Your Content</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>AI Suggestions</strong> will align with your mission and values</li>
                  <li>• <strong>Format Generation</strong> will reflect your voice and serve your goals</li>
                  <li>• <strong>Content Recommendations</strong> will support your audience&apos;s needs</li>
                  <li>• <strong>All Writing</strong> will be guided by your core purpose</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
