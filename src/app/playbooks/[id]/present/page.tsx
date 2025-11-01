'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface Slide {
  id: string
  order: number
  title: string
  content: string
  layout: string
  images?: string
}

interface Playbook {
  id: string
  title: string
  description?: string
}

export default function PlaybookPresentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const [playbook, setPlaybook] = useState<Playbook | null>(null)
  const [slides, setSlides] = useState<Slide[]>([])
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
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
        
        // If no slides exist, generate them from playbook steps
        if (!data.playbook.slides || data.playbook.slides.length === 0) {
          try {
            const playbookContent = JSON.parse(data.playbook.content)
            if (playbookContent.steps && playbookContent.steps.length > 0) {
              const autoSlides = playbookContent.steps.map((step: { title: string; content: string }, index: number) => ({
                id: `auto-${index}`,
                order: index + 1,
                title: step.title,
                content: step.content.replace(/<[^>]*>/g, ''),
                layout: 'text',
              }))
              setSlides(autoSlides)
            }
          } catch (error) {
            console.error('Failed to parse playbook content:', error)
          }
        } else {
          setSlides(data.playbook.slides)
        }
      }
    } catch (error) {
      console.error('Failed to fetch playbook:', error)
    } finally {
      setLoading(false)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        nextSlide()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        previousSlide()
      } else if (e.key === 'Escape') {
        router.push(`/playbooks/${resolvedParams?.id}`)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentSlideIndex, slides.length])

  const nextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1)
    }
  }

  const previousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1)
    }
  }

  if (loading || !resolvedParams) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!playbook || slides.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-xl mb-4">No slides available for this playbook</p>
          <button
            onClick={() => router.push(`/playbooks/${resolvedParams.id}`)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Playbook
          </button>
        </div>
      </div>
    )
  }

  const currentSlide = slides[currentSlideIndex]
  const progress = ((currentSlideIndex + 1) / slides.length) * 100

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{playbook.title}</h1>
            <p className="text-sm text-gray-400">
              Slide {currentSlideIndex + 1} of {slides.length}
            </p>
          </div>
          <button
            onClick={() => router.push(`/playbooks/${resolvedParams.id}`)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-800">
        <div className="h-1 bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Main Slide Content */}
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="max-w-5xl w-full">
          <div className="bg-white text-gray-900 rounded-2xl p-12 shadow-2xl min-h-[500px] flex flex-col justify-center">
            <h2 className="text-5xl font-bold mb-8 leading-tight">{currentSlide.title}</h2>
            <div className="text-2xl leading-relaxed whitespace-pre-wrap">
              {currentSlide.content}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={previousSlide}
            disabled={currentSlideIndex === 0}
            className="flex items-center gap-2 px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {/* Slide Dots */}
          <div className="flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlideIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlideIndex
                    ? 'bg-blue-600 w-8'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            disabled={currentSlideIndex === slides.length - 1}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="absolute bottom-20 left-6 text-xs text-gray-500">
        <p>← → to navigate | ESC to exit</p>
      </div>
    </div>
  )
}
