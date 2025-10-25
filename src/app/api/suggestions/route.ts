import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    console.log('Suggestions API called with content length:', content?.length || 0)
    
    if (!content || content.length < 15) {
      console.log('Content too short for suggestions, returning empty')
      return NextResponse.json({ suggestion: null })
    }

    // Initialize OpenAI client at runtime
    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key not configured')
      return NextResponse.json({ 
        suggestion: null,
        error: 'OpenAI API key not configured' 
      })
    }

    console.log('OpenAI API key found, initializing client')
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Get context documents for reference
    console.log('Fetching context documents...')
    let contextDocs: Array<{ filename: string; content: string }> = []
    try {
      contextDocs = await prisma.contextDocument.findMany({
        select: {
          filename: true,
          content: true,
        },
        take: 10 // Limit to most recent for performance
      })
      console.log('Found context documents:', contextDocs.length)
    } catch (contextError) {
      console.error('Error fetching context documents (table might not exist):', contextError)
    }

    // Get user's previous writings for reference
    const previousWritings = await prisma.document.findMany({
      where: {
        isDraft: false,
        content: {
          not: ''
        }
      },
      select: {
        title: true,
        content: true,
      },
      take: 5,
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Get Ikigai for mission-driven context
    console.log('Fetching Ikigai...')
    let ikigai = null
    try {
      ikigai = await prisma.ikigai.findFirst({
        orderBy: {
          updatedAt: 'desc'
        }
      })
      console.log('Ikigai found:', !!ikigai)
    } catch (ikigaiError) {
      console.error('Error fetching Ikigai (table might not exist):', ikigaiError)
    }

    // Prepare context for AI
    const contextText = contextDocs.map(doc => 
      `[${doc.filename}]\n${doc.content.slice(0, 1000)}`
    ).join('\n\n')

    const previousWritingsText = previousWritings.map(doc => 
      `[${doc.title}]\n${doc.content.slice(0, 500)}`
    ).join('\n\n')

    const ikigaiText = ikigai ? `
IKIGAI - CORE MISSION & PURPOSE (Use this as the primary guiding context):
Mission: ${ikigai.mission}
Purpose: ${ikigai.purpose}
Values: ${ikigai.values}
Goals: ${ikigai.goals}
Audience: ${ikigai.audience}
Voice: ${ikigai.voice}
What You Stand Against: ${ikigai.enemy || 'Not specified'}
` : ''

    // Get the last 200 words and current paragraph to provide better context
    const words = content.trim().split(' ')
    const recentContent = words.slice(-200).join(' ')
    // const lastSentence = content.split(/[.!?]+/).slice(-2).join('.').trim()
    
    // Get the current paragraph they're working on
    const paragraphs = content.split('\n\n')
    const currentParagraph = paragraphs[paragraphs.length - 1]
    
    // Get the full document context (truncated for token limits)
    const fullContext = content.slice(0, 2000)

    const prompt = `
You are finding relevant stories, quotes, and specific content from the author's context documents that relate to what they're currently writing.

WHAT THEY'RE WRITING NOW:
${currentParagraph}

RECENT CONTENT:
${recentContent}

FULL DOCUMENT FOR CONTEXT:
${fullContext}

AUTHOR'S CONTEXT DOCUMENTS:
${contextText}

AUTHOR'S PREVIOUS WRITINGS:
${previousWritingsText}

${ikigaiText}

Your job: Find ONE specific story, quote, stat, or example from their context documents or previous writings that directly relates to what they just wrote. This should be:

- A DIRECT QUOTE or specific story from their uploaded context
- HIGHLY RELEVANT to their current paragraph
- Something they can immediately add to strengthen their point
- Attributed to the source document

Return ONE relevant piece as JSON:
{
  "id": "unique_id",
  "type": "story" | "quote" | "stat" | "example",
  "content": "The actual quote, story, or example (direct excerpt from their context, 20-40 words)",
  "source": "Name of the context document this came from",
  "relevanceScore": 0.9
}

Examples:
- If they wrote about leadership → Pull a leadership story from their context
- If they mentioned failure → Find a failure example from their previous writing
- If they discussed systems → Reference a specific framework from their context docs

IMPORTANT: The content should be a direct excerpt or paraphrase from their actual context documents, not made up content.
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a context retrieval assistant that finds relevant stories, quotes, statistics, and examples from the author\'s uploaded context documents and previous writings. You pull direct quotes and specific content that relates to what they\'re currently writing. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    })

    let suggestion = null
    try {
      const responseContent = response.choices[0]?.message?.content
      if (responseContent) {
        suggestion = JSON.parse(responseContent)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      suggestion = null
    }

    return NextResponse.json({ suggestion })
  } catch (error) {
    console.error('Error generating suggestions:', error)
    return NextResponse.json({ 
      suggestion: null,
      error: 'Failed to generate suggestions' 
    }, { status: 500 })
  }
}
