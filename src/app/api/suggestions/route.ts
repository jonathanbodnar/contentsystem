import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    console.log('Suggestions API called with content length:', content?.length || 0)
    
    if (!content || content.length < 15) {
      console.log('Content too short for suggestions, returning empty')
      return NextResponse.json({ suggestions: [] })
    }

    // Initialize OpenAI client at runtime
    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key not configured')
      return NextResponse.json({ 
        suggestions: [],
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

    const prompt = `
You are a writing partner helping the author continue their thought. Based on what they've written so far, suggest what they should write NEXT to develop their ideas further.

${ikigaiText ? `CONTEXT - The author's mission and purpose (use this to guide suggestions):
${ikigaiText}` : ''}

CURRENT WRITING:
${content}

AVAILABLE CONTEXT FOR INSPIRATION:
${contextText}

AUTHOR'S PREVIOUS WRITINGS:
${previousWritingsText}

Your job is to suggest what the author should write NEXT. Think like a writing coach sitting beside them, helping them:

1. **Continue the current thought** - What's the logical next sentence or paragraph?
2. **Deepen the argument** - What evidence, examples, or stories would strengthen this point?
3. **Add supporting details** - What specific facts or data from their context would help?
4. **Transition to next idea** - What related concept should they explore next?
5. **Include personal stories** - What relevant experiences from their previous writing could add depth?

Provide suggestions as JSON array with:
- id: unique identifier
- type: "continuation" | "evidence" | "story" | "transition" | "detail"
- title: What this suggestion helps with (e.g., "Continue this thought", "Add supporting evidence")
- content: The actual text/bullet point they could add next (1-2 sentences)
- source: where this comes from if applicable
- relevanceScore: 0-1 score

Focus on helping them write the NEXT part of their piece. Be specific and actionable.
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

    let suggestions = []
    try {
      const responseContent = response.choices[0]?.message?.content
      if (responseContent) {
        suggestions = JSON.parse(responseContent)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      suggestions = []
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error generating suggestions:', error)
    return NextResponse.json({ 
      suggestions: [],
      error: 'Failed to generate suggestions' 
    }, { status: 500 })
  }
}
