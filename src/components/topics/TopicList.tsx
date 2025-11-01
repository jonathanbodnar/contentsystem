'use client'

import { useState, useEffect } from 'react'
import { Plus, Lightbulb, X } from 'lucide-react'

interface Topic {
  id: string
  title: string
  completed: boolean
  createdAt: string
}

interface TopicListProps {
  onTopicClick?: (topic: Topic) => void
}

export default function TopicList({ onTopicClick }: TopicListProps) {
  const [topics, setTopics] = useState<Topic[]>([])
  const [newTopicTitle, setNewTopicTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showIdeaModal, setShowIdeaModal] = useState(false)
  const [generatedIdeas, setGeneratedIdeas] = useState<string[]>([])

  useEffect(() => {
    fetchTopics()
  }, [])

  const fetchTopics = async () => {
    try {
      const response = await fetch('/api/topics')
      if (response.ok) {
        const data = await response.json()
        setTopics(data.topics || [])
      }
    } catch (error) {
      console.error('Failed to fetch topics:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTopic = async (title: string) => {
    if (!title.trim()) return

    try {
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: title.trim() }),
      })

      if (response.ok) {
        await fetchTopics()
        setNewTopicTitle('')
      }
    } catch (error) {
      console.error('Failed to add topic:', error)
    }
  }

  const toggleTopic = async (id: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/topics/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed }),
      })

      if (response.ok) {
        await fetchTopics()
      }
    } catch (error) {
      console.error('Failed to toggle topic:', error)
    }
  }

  const deleteTopic = async (id: string) => {
    try {
      const response = await fetch(`/api/topics/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchTopics()
      }
    } catch (error) {
      console.error('Failed to delete topic:', error)
    }
  }

  const generateTopicIdeas = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/topics/generate', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedIdeas(data.ideas || [])
        setShowIdeaModal(true)
      }
    } catch (error) {
      console.error('Failed to generate ideas:', error)
    } finally {
      setGenerating(false)
    }
  }

  const addGeneratedIdea = async (idea: string) => {
    await addTopic(idea)
    setGeneratedIdeas(generatedIdeas.filter(i => i !== idea))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTopic(newTopicTitle)
    }
  }

  return (
    <div className="w-80 bg-white border-l border-gray-100 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Topics & Ideas</h3>
          <button
            onClick={generateTopicIdeas}
            disabled={generating}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Lightbulb className="w-3 h-3" />
            {generating ? 'Generating...' : 'Generate Ideas'}
          </button>
        </div>
        
        {/* Quick add input */}
        <input
          type="text"
          value={newTopicTitle}
          onChange={(e) => setNewTopicTitle(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add a topic..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
        />
      </div>

      {/* Topics List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No topics yet</p>
            <p className="text-xs mt-1">Add ideas as you think of them</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded group"
              >
                <input
                  type="checkbox"
                  checked={topic.completed}
                  onChange={(e) => toggleTopic(topic.id, e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${topic.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {topic.title}
                  </p>
                </div>
                <button
                  onClick={() => deleteTopic(topic.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generated Ideas Modal */}
      {showIdeaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Topic Ideas</h3>
              <button
                onClick={() => setShowIdeaModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Click to add ideas to your topic list
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {generatedIdeas.map((idea, index) => (
                <button
                  key={index}
                  onClick={() => addGeneratedIdea(idea)}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200 hover:border-blue-300"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-800 flex-1">{idea}</p>
                    <Plus className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))}
              
              {generatedIdeas.length === 0 && (
                <p className="text-center text-gray-500 py-4 text-sm">
                  No more ideas available
                </p>
              )}
            </div>

            <button
              onClick={() => setShowIdeaModal(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
