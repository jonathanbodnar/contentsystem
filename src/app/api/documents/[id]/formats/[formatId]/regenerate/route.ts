import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { OpenAI } from 'openai'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; formatId: string }> }
) {
  try {
    const resolvedParams = await params
    const { feedback } = await request.json()

    // Initialize OpenAI client at runtime
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Get the document format
    const documentFormat = await prisma.documentFormat.findFirst({
      where: {
        id: resolvedParams.formatId,
        documentId: resolvedParams.id,
      },
      include: {
        format: true,
        document: true,
      },
    })

    if (!documentFormat) {
      return NextResponse.json({ error: 'Document format not found' }, { status: 404 })
    }

    // Save feedback if provided
    if (feedback && feedback.trim()) {
      await prisma.formatFeedback.create({
        data: {
          formatId: documentFormat.format.id,
          feedback: feedback.trim(),
          documentId: resolvedParams.id,
        },
      })
    }

    // Get context documents and ikigai
    let contextDocs: Array<{ filename: string; content: string }> = []
    let ikigai = null
    
    try {
      contextDocs = await prisma.contextDocument.findMany({
        select: {
          filename: true,
          content: true,
        },
      })
    } catch {
      console.log('Context documents table not found, continuing without context')
    }

    try {
      ikigai = await prisma.ikigai.findFirst()
    } catch {
      console.log('Ikigai table not found, continuing without ikigai')
    }

    // Get previous feedback for this format
    let previousFeedback: string[] = []
    try {
      const feedbackRecords = await prisma.formatFeedback.findMany({
        where: {
          formatId: documentFormat.format.id,
        },
        select: {
          feedback: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5, // Last 5 pieces of feedback
      })
      previousFeedback = feedbackRecords.map(f => f.feedback)
    } catch {
      console.log('Format feedback table not found, continuing without previous feedback')
    }

    // Build context
    const contextText = contextDocs.length > 0 
      ? contextDocs.map(doc => `${doc.filename}:\n${doc.content}`).join('\n\n')
      : ''

    const ikigaiText = ikigai 
      ? `Mission: ${ikigai.mission}\nPurpose: ${ikigai.purpose}\nValues: ${ikigai.values}\nGoals: ${ikigai.goals}\nAudience: ${ikigai.audience}\nVoice: ${ikigai.voice}${ikigai.enemy ? `\nWhat you stand against: ${ikigai.enemy}` : ''}`
      : ''

    const feedbackText = previousFeedback.length > 0
      ? `Previous feedback for this format:\n${previousFeedback.join('\n')}`
      : ''

    const currentFeedbackText = feedback && feedback.trim()
      ? `Current feedback: ${feedback.trim()}`
      : ''

    // Generate new content with AI
    const prompt = `
You are regenerating content for the ${documentFormat.format.name} format (${documentFormat.format.platform}).

Original document content:
${documentFormat.document.content}

Format requirements:
${documentFormat.format.prompt}

${ikigaiText ? `Author's mission and voice:\n${ikigaiText}\n` : ''}

${contextText ? `Context documents:\n${contextText}\n` : ''}

${feedbackText ? `${feedbackText}\n` : ''}

${currentFeedbackText ? `${currentFeedbackText}\n` : ''}

Previous generated version:
${documentFormat.content}

Please regenerate this content incorporating the feedback provided. Make meaningful improvements while staying true to the format requirements and the author's mission.

Return only the improved content, no explanations.
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    })

    const generatedContent = completion.choices[0]?.message?.content || ''

    // Update the document format with new content and reset status to PENDING
    await prisma.documentFormat.update({
      where: {
        id: resolvedParams.formatId,
      },
      data: {
        content: generatedContent,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Regenerate format error:', error)
    return NextResponse.json({ error: 'Failed to regenerate format' }, { status: 500 })
  }
}
