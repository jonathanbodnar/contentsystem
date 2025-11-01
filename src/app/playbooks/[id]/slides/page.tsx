'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Image as ImageIcon, Type, Layout, Save } from 'lucide-react'

interface Playbook {
  id: string
  title: string
  description?: string
}

interface Slide {
  id: string
  order: number
  title: string
  content: string
  layout: string
  images?: string
  position?: string
}

export default function PlaybookSlidesPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const [playbook, setPlaybook] = useState<Playbook | null>(null)
  const [slides, setSlides] = useState<Slide[]>([])
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
        setSlides(data.playbook.slides || [])
      }
    } catch (error) {
      console.error('Failed to fetch playbook:', error)
    } finally {
      setLoading(false)
    }
  }

  const addSlide = () => {
    const newSlide: Slide = {
      id: `temp-${Date.now()}`,
      order: slides.length + 1,
      title: 'New Slide',
      content: '',
      layout: 'text',
    }
    setSlides([...slides, newSlide])
    setCurrentSlideIndex(slides.length)
  }

  const deleteSlide = (index: number) => {
    const updatedSlides = slides.filter((_, i) => i !== index)
    // Reorder slides
    updatedSlides.forEach((slide, i) => {
      slide.order = i + 1
    })
    setSlides(updatedSlides)
    if (currentSlideIndex >= updatedSlides.length) {
      setCurrentSlideIndex(Math.max(0, updatedSlides.length - 1))
    }
  }

  const updateSlide = (index: number, field: keyof Slide, value: string) => {
    const updatedSlides = [...slides]
    updatedSlides[index] = {
      ...updatedSlides[index],
      [field]: value
    }
    setSlides(updatedSlides)
  }

  const saveSlides = async () => {
    if (!resolvedParams) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/playbooks/${resolvedParams.id}/slides`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slides }),
      })

      if (response.ok) {
        alert('Slides saved successfully!')
      }
    } catch (error) {
      console.error('Failed to save slides:', error)
      alert('Failed to save slides')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !resolvedParams) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!playbook) {
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

  const currentSlide = slides[currentSlideIndex]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/playbooks/${resolvedParams.id}/edit`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">{playbook.title}</h1>
              <p className="text-gray-600">Slide Editor</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              Slide {currentSlideIndex + 1} of {slides.length || 1}
            </span>
            <button
              onClick={saveSlides}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Slides'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Slide Thumbnails */}
          <div className="col-span-3 space-y-3">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Slides</h3>
              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                {slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    onClick={() => setCurrentSlideIndex(index)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      index === currentSlideIndex
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">Slide {index + 1}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSlide(index)
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-800 font-medium truncate">{slide.title}</p>
                    <p className="text-xs text-gray-500 truncate">{slide.layout}</p>
                  </div>
                ))}
                <button
                  onClick={addSlide}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          </div>

          {/* Slide Editor */}
          <div className="col-span-9">
            {slides.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Layout className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-800 mb-2">No Slides Yet</h2>
                <p className="text-gray-600 mb-6">Create your first slide to start building your playbook presentation</p>
                <button
                  onClick={addSlide}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create First Slide
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Slide Canvas */}
                <div className="aspect-video bg-gray-50 p-12 relative">
                  <div className="h-full flex flex-col">
                    <input
                      type="text"
                      value={currentSlide.title}
                      onChange={(e) => updateSlide(currentSlideIndex, 'title', e.target.value)}
                      className="text-4xl font-bold mb-6 bg-transparent border-none outline-none text-gray-900"
                      placeholder="Slide Title"
                    />
                    <textarea
                      value={currentSlide.content}
                      onChange={(e) => updateSlide(currentSlideIndex, 'content', e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none text-gray-800 text-lg resize-none"
                      placeholder="Slide content..."
                    />
                  </div>
                </div>

                {/* Slide Controls */}
                <div className="border-t border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700">Layout:</label>
                      <select
                        value={currentSlide.layout}
                        onChange={(e) => updateSlide(currentSlideIndex, 'layout', e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded text-gray-900 text-sm"
                      >
                        <option value="text">Text Only</option>
                        <option value="image-text">Image + Text</option>
                        <option value="image-grid">Image Grid</option>
                        <option value="centered">Centered Text</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                        disabled={currentSlideIndex === 0}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                      >
                        ← Previous
                      </button>
                      <button
                        onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
                        disabled={currentSlideIndex === slides.length - 1}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
