import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import OpenAI from 'openai'

export async function GET() {
  try {
    const playbooks = await prisma.playbook.findMany({
      include: {
        sourceDocument: {
          select: {
            title: true
          }
        },
        slides: {
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({ playbooks })
  } catch (error) {
    console.error('Error fetching playbooks:', error)
    return NextResponse.json({ error: 'Failed to fetch playbooks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sourceDocumentId, prompt, title, description } = body

    // Get the source document
    const sourceDocument = await prisma.document.findUnique({
      where: { id: sourceDocumentId }
    })

    if (!sourceDocument) {
      return NextResponse.json({ error: 'Source document not found' }, { status: 404 })
    }

    // Get Ikigai for mission context
    const ikigai = await prisma.ikigai.findFirst({
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Get context documents
    const contextDocs = await prisma.contextDocument.findMany({
      select: {
        filename: true,
        content: true,
      },
      take: 5
    })

    // Initialize OpenAI client
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured' 
      }, { status: 500 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Prepare context
    const contextText = contextDocs.map(doc => 
      `[${doc.filename}]\n${doc.content.slice(0, 800)}`
    ).join('\n\n')

    const ikigaiText = ikigai ? `
IKIGAI - CORE MISSION & PURPOSE (Guide all playbook content):
Mission: ${ikigai.mission}
Purpose: ${ikigai.purpose}
Values: ${ikigai.values}
Goals: ${ikigai.goals}
Target Audience: ${ikigai.audience}
Brand Voice: ${ikigai.voice}
What You Stand Against: ${ikigai.enemy || 'Not specified'}
` : ''

    const fullPrompt = `
${ikigaiText ? `${ikigaiText}\nIMPORTANT: This playbook must align with and advance the above Ikigai. All steps should serve the mission and target audience.\n` : ''}

${prompt}

Source concept to transform into playbook:
Title: ${sourceDocument.title}
Content: ${sourceDocument.content}

Additional context from knowledge base:
${contextText}

Generate a comprehensive playbook as a JSON structure with this format:
{
  "title": "Actionable title for the playbook",
  "description": "Brief description of what this playbook achieves",
  "steps": [
    {
      "title": "Step title",
      "content": "Detailed step content with specific actions",
      "order": 1,
      "duration": "Estimated time to complete",
      "resources": ["List of tools/resources needed"],
      "checkpoints": ["Success indicators for this step"]
    }
  ]
}

Ensure the playbook is practical, actionable, and aligned with the mission and values defined in the Ikigai.
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating actionable playbooks and step-by-step guides. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: fullPrompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.7,
    })

    let playbookData
    try {
      const responseContent = response.choices[0]?.message?.content
      if (responseContent) {
        playbookData = JSON.parse(responseContent)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      return NextResponse.json({ error: 'Failed to generate playbook structure' }, { status: 500 })
    }

    if (!playbookData) {
      return NextResponse.json({ error: 'No playbook data generated' }, { status: 500 })
    }

    // Create playbook
    const playbook = await prisma.playbook.create({
      data: {
        title: title || playbookData.title || sourceDocument.title + ' Playbook',
        description: description || playbookData.description,
        sourceDocumentId,
        content: JSON.stringify(playbookData),
        prompt,
      }
    })

    return NextResponse.json({ playbook })
  } catch (error) {
    console.error('Error creating playbook:', error)
    return NextResponse.json({ error: 'Failed to create playbook' }, { status: 500 })
  }
}
