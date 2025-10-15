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
    const lastSentence = content.split(/[.!?]+/).slice(-2).join('.').trim()
    
    // Get the current paragraph they're working on
    const paragraphs = content.split('\n\n')
    const currentParagraph = paragraphs[paragraphs.length - 1]
    
    // Get the full document context (truncated for token limits)
    const fullContext = content.slice(0, 2000)

    const prompt = `
You are a content strategist helping the author develop their ideas. 

CURRENT DOCUMENT CONTEXT:
${fullContext}

CURRENT PARAGRAPH:
${currentParagraph}

MOST RECENT CONTENT:
${recentContent}

Based on what they've written so far and where they are in their document, suggest ONE specific, substantive idea they could add next. Look at the flow of their argument, the points they've made, and what logical next step would strengthen their content.

${ikigaiText}

Context available:
${contextText}

Previous writings:
${previousWritingsText}

Give SPECIFIC content suggestions, not generic prompts:

GOOD (specific ideas):
- If they wrote about business failure: "The 80/20 rule applies - 80% of failures come from hiring mistakes"
- If they mentioned necessity: "Consider the 2008 financial crisis - companies that survived innovated out of necessity"
- If they discussed scaling: "Mention the 'founder's trap' - when leaders become bottlenecks"
- If they wrote about people: "Reference Patrick Lencioni's trust pyramid from your context"

BAD (generic prompts):
- "Can you share more about that?"
- "What's a specific example?"
- "Tell us more"

Return ONE substantive idea as JSON:
{
  "id": "unique_id",
  "type": "continuation",
  "content": "specific content idea they could add (15-25 words)",
  "source": "context" or "ai",
  "relevanceScore": 0.9
}

Give them actual IDEAS to write about, not prompts to think about.
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a writing assistant that reads the full context of what the author has written and provides specific, actionable suggestions for what they should write next. You understand the flow and structure of their argument and suggest logical next steps. Always respond with valid JSON only.'
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
