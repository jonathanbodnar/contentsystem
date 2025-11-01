import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { OpenAI } from 'openai'

export async function POST() {
  try {
    // Initialize OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Get recent documents
    let recentDocs: Array<{ title: string; content: string }> = []
    try {
      recentDocs = await prisma.document.findMany({
        select: {
          title: true,
          content: true,
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 10
      })
    } catch {
      console.log('Documents table not accessible')
    }

    // Get context documents
    let contextDocs: Array<{ filename: string; content: string }> = []
    try {
      contextDocs = await prisma.contextDocument.findMany({
        select: {
          filename: true,
          content: true,
        },
        take: 5
      })
    } catch {
      console.log('Context documents table not accessible')
    }

    // Get Ikigai
    let ikigai = null
    try {
      ikigai = await prisma.ikigai.findFirst()
    } catch {
      console.log('Ikigai table not accessible')
    }

    const recentContent = recentDocs.map(doc => 
      `${doc.title}: ${doc.content.slice(0, 200)}`
    ).join('\n\n')

    const contextContent = contextDocs.map(doc => 
      `${doc.filename}: ${doc.content.slice(0, 300)}`
    ).join('\n\n')

    const prompt = `
Based on the author's recent writing and context documents, generate 10 fresh topic ideas they could write about.

${ikigai ? `Author's Mission: ${ikigai.mission}
Target Audience: ${ikigai.audience}
What They Stand Against: ${ikigai.enemy || 'Not specified'}` : ''}

Recent writings:
${recentContent}

Context documents:
${contextContent}

Generate 10 specific, actionable topic ideas that:
- Align with their mission and audience
- Build on themes from their previous writing
- Reference concepts from their context documents
- Are specific enough to write about (not too broad)
- Would provide value to their audience

Return as a JSON array of strings:
["Topic idea 1", "Topic idea 2", ...]

Be specific and creative. Each idea should be a complete topic they could write about.
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a content strategist generating topic ideas based on an author\'s previous work and mission. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.8,
    })

    let ideas = []
    try {
      const responseContent = response.choices[0]?.message?.content
      if (responseContent) {
        ideas = JSON.parse(responseContent)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
    }

    return NextResponse.json({ ideas })
  } catch (error) {
    console.error('Error generating topic ideas:', error)
    return NextResponse.json({ error: 'Failed to generate ideas' }, { status: 500 })
  }
}
