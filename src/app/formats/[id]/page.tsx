'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, X, Calendar, Settings, Database, Target } from 'lucide-react'
import ContextManager from '@/components/context/ContextManager'
import IkigaiEditor from '@/components/ikigai/IkigaiEditor'

interface Document {
  id: string
  title: string
  content: string
  isDraft: boolean
}

interface Format {
  id: string
  name: string
  platform: string
  prompt: string
}

interface DocumentFormat {
  id: string
  formatId: string
  format: Format
  content: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  scheduledFor?: string
}

export default function FormatsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const [document, setDocument] = useState<Document | null>(null)
  const [documentFormats, setDocumentFormats] = useState<DocumentFormat[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [showContextManager, setShowContextManager] = useState(false)
  const [showIkigaiEditor, setShowIkigaiEditor] = useState(false)

  // Resolve params
  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  const fetchData = async () => {
    if (!resolvedParams) return
    try {
      const [docResponse, docFormatsResponse] = await Promise.all([
        fetch(`/api/documents/${resolvedParams.id}`),
        fetch(`/api/documents/${resolvedParams.id}/formats`)
      ])

      if (docResponse.ok) {
        const docData = await docResponse.json()
        setDocument(docData.document)
      }

      if (docFormatsResponse.ok) {
        const docFormatsData = await docFormatsResponse.json()
        setDocumentFormats(docFormatsData.documentFormats)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (resolvedParams) {
      fetchData()
    }
  }, [resolvedParams])

  const generateFormats = async () => {
    if (!resolvedParams) return
    setProcessing(true)
    try {
      const response = await fetch(`/api/documents/${resolvedParams.id}/generate-formats`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Failed to generate formats:', error)
    } finally {
      setProcessing(false)
    }
  }

  const approveFormat = async (formatId: string) => {
    if (!resolvedParams) return
    try {
      const response = await fetch(`/api/documents/${resolvedParams.id}/formats/${formatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'APPROVED' }),
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Failed to approve format:', error)
    }
  }

  const rejectFormat = async (formatId: string) => {
    if (!resolvedParams) return
    try {
      const response = await fetch(`/api/documents/${resolvedParams.id}/formats/${formatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'REJECTED' }),
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Failed to reject format:', error)
    }
  }

  if (loading || !resolvedParams) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Document not found</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const hasGeneratedFormats = documentFormats.length > 0
  const approvedFormats = documentFormats.filter(df => df.status === 'APPROVED')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
            onClick={() => router.push(`/write/${resolvedParams.id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              {document.title}
            </h1>
              <p className="text-gray-600">Format & Publish</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowIkigaiEditor(true)}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Target className="w-4 h-4" />
              Ikigai
            </button>

            <button
              onClick={() => setShowContextManager(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Database className="w-4 h-4" />
              Context Library
            </button>

            <button
              onClick={() => router.push('/formats/manage')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Manage Formats
            </button>

            {approvedFormats.length > 0 && (
              <button
                onClick={() => router.push(`/calendar?document=${resolvedParams.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                View Calendar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {!hasGeneratedFormats ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Generate Formats
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Transform your writing into platform-specific formats optimized for LinkedIn, X, newsletters, and YouTube.
            </p>
            <button
              onClick={generateFormats}
              disabled={processing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {processing ? 'Generating...' : 'Generate All Formats'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documentFormats.map((docFormat) => (
              <div
                key={docFormat.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {docFormat.format.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {docFormat.format.platform}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {docFormat.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => approveFormat(docFormat.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => rejectFormat(docFormat.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {docFormat.status === 'APPROVED' && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Approved
                        </span>
                      )}
                      {docFormat.status === 'REJECTED' && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-80 overflow-y-auto">
                    {docFormat.content ? (
                      <div className="space-y-4">
                        {/* Format-specific preview styling */}
                        {docFormat.format.platform === 'LinkedIn' && (
                          <div className="linkedin-preview">
                            <div className="text-sm text-gray-600 mb-3 font-medium">LinkedIn Post Preview:</div>
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                              <div 
                                className="text-gray-900 leading-relaxed whitespace-pre-wrap"
                                style={{ lineHeight: '1.6' }}
                              >
                                {docFormat.content.replace(/<[^>]*>/g, '')}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {docFormat.format.platform === 'X' && (
                          <div className="twitter-preview">
                            <div className="text-sm text-gray-600 mb-3 font-medium">X (Twitter) Thread Preview:</div>
                            <div className="space-y-3">
                              {(() => {
                                const cleanContent = docFormat.content.replace(/<[^>]*>/g, '')
                                // Split by line breaks and look for tweet indicators
                                const lines = cleanContent.split('\n').filter(line => line.trim())
                                const tweets = []
                                
                                let currentTweet = ''
                                for (const line of lines) {
                                  if (line.match(/^\d+\/\d+/) || line.match(/^Tweet \d+/) || line.match(/^\d+\./)) {
                                    if (currentTweet.trim()) {
                                      tweets.push(currentTweet.trim())
                                    }
                                    currentTweet = line.replace(/^\d+\/\d+\s*/, '').replace(/^Tweet \d+[:\s]*/, '').replace(/^\d+\.\s*/, '')
                                  } else if (line.trim()) {
                                    currentTweet += (currentTweet ? ' ' : '') + line
                                  }
                                }
                                if (currentTweet.trim()) {
                                  tweets.push(currentTweet.trim())
                                }
                                
                                // If no clear tweet structure, split by character count (~280 chars)
                                if (tweets.length <= 1) {
                                  const words = cleanContent.split(' ')
                                  const autoTweets = []
                                  let currentAutoTweet = ''
                                  
                                  for (const word of words) {
                                    if ((currentAutoTweet + ' ' + word).length > 280) {
                                      if (currentAutoTweet.trim()) {
                                        autoTweets.push(currentAutoTweet.trim())
                                      }
                                      currentAutoTweet = word
                                    } else {
                                      currentAutoTweet += (currentAutoTweet ? ' ' : '') + word
                                    }
                                  }
                                  if (currentAutoTweet.trim()) {
                                    autoTweets.push(currentAutoTweet.trim())
                                  }
                                  
                                  return autoTweets.map((tweet, index) => (
                                    <div key={index} className="bg-black text-white p-4 rounded-xl max-w-sm border border-gray-700">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
                                        <div>
                                          <div className="text-sm font-medium">Your Name</div>
                                          <div className="text-xs text-gray-400">@yourhandle</div>
                                        </div>
                                      </div>
                                      <div className="text-sm leading-relaxed mb-2">{tweet}</div>
                                      <div className="text-xs text-gray-400">{index + 1}/{autoTweets.length}</div>
                                    </div>
                                  ))
                                }
                                
                                return tweets.map((tweet, index) => (
                                  <div key={index} className="bg-black text-white p-4 rounded-xl max-w-sm border border-gray-700">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
                                      <div>
                                        <div className="text-sm font-medium">Your Name</div>
                                        <div className="text-xs text-gray-400">@yourhandle</div>
                                      </div>
                                    </div>
                                    <div className="text-sm leading-relaxed mb-2">{tweet}</div>
                                    <div className="text-xs text-gray-400">{index + 1}/{tweets.length}</div>
                                  </div>
                                ))
                              })()}
                            </div>
                          </div>
                        )}
                        
                        {docFormat.format.platform === 'Email' && (
                          <div className="email-preview">
                            <div className="text-sm text-gray-600 mb-3 font-medium">Newsletter Preview:</div>
                            <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                              <div className="bg-gray-100 px-6 py-3 border-b">
                                <div className="text-sm text-gray-600">Subject:</div>
                                <div className="font-semibold text-gray-900">
                                  {(() => {
                                    const lines = docFormat.content.replace(/<[^>]*>/g, '').split('\n')
                                    const subjectMatch = lines.find(line => line.toLowerCase().includes('subject'))
                                    return subjectMatch || lines[0] || 'Your Newsletter Subject'
                                  })()}
                                </div>
                              </div>
                              <div className="p-6 max-h-64 overflow-y-auto">
                                <div 
                                  className="prose prose-sm max-w-none text-gray-900"
                                  style={{ 
                                    lineHeight: '1.7',
                                    fontSize: '15px'
                                  }}
                                  dangerouslySetInnerHTML={{ 
                                    __html: docFormat.content
                                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Convert **bold** to <strong>
                                      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Convert *italic* to <em>
                                      .replace(/\n\n/g, '</p><p>') // Convert double line breaks to paragraphs
                                      .replace(/\n/g, '<br>') // Convert single line breaks to <br>
                                      .replace(/^/, '<p>') // Add opening paragraph
                                      .replace(/$/, '</p>') // Add closing paragraph
                                      .replace(/<p><\/p>/g, '') // Remove empty paragraphs
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {docFormat.format.platform === 'YouTube' && (
                          <div className="youtube-preview">
                            <div className="text-sm text-gray-600 mb-3 font-medium">YouTube Script Preview:</div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <div className="text-red-800 font-medium mb-2">🎬 Video Script</div>
                              <div 
                                className="text-gray-900 leading-relaxed whitespace-pre-wrap font-mono text-sm"
                                style={{ lineHeight: '1.8' }}
                              >
                                {docFormat.content.replace(/<[^>]*>/g, '')}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {!['LinkedIn', 'X', 'Email', 'YouTube'].includes(docFormat.format.platform) && (
                          <div className="generic-preview">
                            <div className="text-sm text-gray-600 mb-3 font-medium">{docFormat.format.platform} Preview:</div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <div 
                                className="prose prose-sm max-w-none text-gray-900"
                                dangerouslySetInnerHTML={{ __html: docFormat.content }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-sm italic">No content generated</div>
                        <div className="text-xs mt-2">Try running migration at /migrate and setting OpenAI API key</div>
                      </div>
                    )}
                  </div>

                  {docFormat.status === 'APPROVED' && (
                    <button
                      onClick={() => navigator.clipboard.writeText(docFormat.content.replace(/<[^>]*>/g, ''))}
                      className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Copy to Clipboard
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ikigai Editor */}
      <IkigaiEditor
        isOpen={showIkigaiEditor}
        onClose={() => setShowIkigaiEditor(false)}
      />

      {/* Global Context Manager */}
      <ContextManager
        isOpen={showContextManager}
        onClose={() => setShowContextManager(false)}
      />
    </div>
  )
}
