'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar as CalendarIcon, Copy, ArrowLeft, Eye, X } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

interface CalendarPost {
  id: string
  title: string
  content: string
  platform: string
  scheduledDate: string
  status: 'SCHEDULED' | 'PUBLISHED' | 'CANCELLED'
}

export default function CalendarPage() {
  const router = useRouter()
  // const searchParams = useSearchParams()
  const [posts, setPosts] = useState<CalendarPost[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCalendarPosts()
  }, [])

  const fetchCalendarPosts = async () => {
    try {
      const response = await fetch('/api/calendar')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts)
      }
    } catch (error) {
      console.error('Failed to fetch calendar posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPostsForDate = (date: Date) => {
    return posts.filter(post => {
      const postDate = new Date(post.scheduledDate)
      return postDate.toDateString() === date.toDateString()
    })
  }

  const getDatesWithPosts = () => {
    return posts.map(post => new Date(post.scheduledDate))
  }

  const copyToClipboard = (content: string) => {
    // Remove HTML tags for clipboard
    const textContent = content.replace(/<[^>]*>/g, '')
    navigator.clipboard.writeText(textContent)
  }

  const selectedDatePosts = getPostsForDate(selectedDate)

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
              <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                <CalendarIcon className="w-6 h-6" />
                Content Calendar
              </h1>
              <p className="text-gray-600">Manage your scheduled posts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                modifiers={{
                  hasPost: getDatesWithPosts()
                }}
                modifiersStyles={{
                  hasPost: { 
                    backgroundColor: '#3B82F6',
                    color: 'white',
                    fontWeight: 'bold'
                  }
                }}
                className="rdp-custom"
              />
              <div className="mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span>Days with scheduled posts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Posts for Selected Date */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">
                  Posts for {selectedDate.toLocaleDateString()}
                </h2>
                <p className="text-gray-600">
                  {selectedDatePosts.length} post{selectedDatePosts.length !== 1 ? 's' : ''} scheduled
                </p>
              </div>

              <div className="p-6">
                {selectedDatePosts.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No posts scheduled</p>
                    <p className="text-sm">Select a different date or create new content</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedDatePosts.map((post) => (
                      <div
                        key={post.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-gray-800">{post.title}</h3>
                            <p className="text-sm text-gray-600">
                              {post.platform} • {new Date(post.scheduledDate).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              post.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                              post.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {post.status}
                            </span>
                            <button
                              onClick={() => setSelectedPost(post)}
                              className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                              title="View full content"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => copyToClipboard(post.content)}
                              className="p-1 text-gray-600 hover:text-green-600 transition-colors"
                              title="Copy to clipboard"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded p-3 max-h-32 overflow-hidden">
                          <div 
                            className="text-sm text-gray-700 line-clamp-4"
                            dangerouslySetInnerHTML={{ 
                              __html: post.content.length > 200 
                                ? post.content.substring(0, 200) + '...' 
                                : post.content 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{selectedPost.title}</h2>
                <p className="text-gray-600">
                  {selectedPost.platform} • {new Date(selectedPost.scheduledDate).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                />
              </div>

              <button
                onClick={() => copyToClipboard(selectedPost.content)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
