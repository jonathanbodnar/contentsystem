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

    // Get the last 100 words to focus on what they're writing RIGHT NOW
    const words = content.trim().split(' ')
    const recentContent = words.slice(-100).join(' ')
    const lastSentence = content.split(/[.!?]+/).slice(-2).join('.').trim()

    const prompt = `
You are an AI writing coach reading over the author's shoulder. They just wrote this:

"${lastSentence}"

Based on what they JUST wrote, send ONE quick suggestion to help them continue. Be:

- DIRECTLY RELEVANT to their last sentence/thought
- CONVERSATIONAL (like texting a friend)
- SHORT (8-12 words max)
- SPECIFIC to what they actually wrote

${ikigaiText ? `Author's mission context: ${ikigai?.mission}` : ''}

Context documents available:
${contextText}

Recent previous writing:
${previousWritingsText}

Examples of GOOD suggestions based on their last sentence:
- If they wrote about failure: "Maybe share how you bounced back?"
- If they mentioned a stat: "Got a story that proves this?"
- If they made a claim: "What evidence supports this?"
- If they started a list: "What's the next point?"

Return ONE suggestion as JSON:
{
  "id": "unique_id",
  "type": "continuation",
  "content": "your 8-12 word suggestion",
  "source": "context" or "ai" (mark if from their context docs or AI thinking),
  "relevanceScore": 0.9
}

Focus ONLY on their last sentence. Help them write the very next thing.
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a writing assistant that provides contextual suggestions to enhance content. Always respond with valid JSON only.'
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
