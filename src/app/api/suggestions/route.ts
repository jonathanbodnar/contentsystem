import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content || content.length < 50) {
      return NextResponse.json({ suggestions: [] })
    }

    // Initialize OpenAI client at runtime
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        suggestions: [],
        error: 'OpenAI API key not configured' 
      })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Get context documents for reference
    const contextDocs = await prisma.contextDocument.findMany({
      select: {
        filename: true,
        content: true,
      },
      take: 10 // Limit to most recent for performance
    })

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
    const ikigai = await prisma.ikigai.findFirst({
      orderBy: {
        updatedAt: 'desc'
      }
    })

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
` : ''

    const prompt = `
Based on the current writing content and the available context, provide relevant suggestions that could enhance the writing. 

${ikigaiText ? `IMPORTANT: All suggestions should align with and support the user's Ikigai (mission and purpose). Use this as your primary guiding principle when making suggestions.

${ikigaiText}` : ''}

Look for:

1. **Facts** - Specific data, statistics, or factual information from the context that supports the current writing
2. **References** - Related stories, examples, or previous writings that connect to the current topic
3. **Ideas** - Creative connections, angles, or perspectives that could enrich the content

Current writing content:
${content}

Available context documents:
${contextText}

Previous writings:
${previousWritingsText}

Provide suggestions in JSON format as an array of objects with:
- id: unique identifier
- type: "fact" | "reference" | "idea"
- title: brief descriptive title
- content: the suggestion content (2-3 sentences max)
- source: source document name if applicable
- relevanceScore: 0-1 score of relevance

Return only the most relevant 5-8 suggestions. Focus on quality over quantity.
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
