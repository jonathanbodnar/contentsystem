import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import OpenAI from 'openai'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    // Get the document
    const document = await prisma.document.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Get all formats with error handling for missing fields
    let formats
    try {
      formats = await prisma.format.findMany({
        include: {
          postingRules: true
        }
      })
    } catch (error) {
      console.error('Error fetching formats:', error)
      return NextResponse.json({ error: 'Database error - please run migration first' }, { status: 500 })
    }

    if (formats.length === 0) {
      // Create default formats if none exist
      await createDefaultFormats()
      const newFormats = await prisma.format.findMany({
        include: {
          postingRules: true
        }
      })
      formats.push(...newFormats)
    }

    // Initialize OpenAI client at runtime
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured' 
      }, { status: 500 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Get context documents for additional context
    console.log('Fetching context documents for format generation...')
    let contextDocs: Array<{ filename: string; content: string }> = []
    try {
      contextDocs = await prisma.contextDocument.findMany({
        select: {
          filename: true,
          content: true,
        },
        take: 5
      })
      console.log('Found context documents for formats:', contextDocs.length)
    } catch (contextError) {
      console.error('Error fetching context documents (table might not exist):', contextError)
    }

    // Get Ikigai for mission-driven context
    console.log('Fetching Ikigai for format generation...')
    let ikigai = null
    try {
      ikigai = await prisma.ikigai.findFirst({
        orderBy: {
          updatedAt: 'desc'
        }
      })
      console.log('Ikigai found for formats:', !!ikigai)
    } catch (ikigaiError) {
      console.error('Error fetching Ikigai (table might not exist):', ikigaiError)
    }

    const contextText = contextDocs.map(doc => 
      `[${doc.filename}]\n${doc.content.slice(0, 800)}`
    ).join('\n\n')

    // Generate formats in parallel, creating multiple posts per format if specified
    const formatPromises = formats.flatMap(async (format) => {
      // Get format-specific context files
      let formatContextText = ''
      if (format.contextFiles) {
        try {
          const formatContextFileNames = JSON.parse(format.contextFiles)
          const formatContextDocs = await prisma.contextDocument.findMany({
            where: {
              filename: {
                in: formatContextFileNames
              }
            },
            select: {
              filename: true,
              content: true,
            }
          })

          formatContextText = formatContextDocs.map(doc => 
            `[${doc.filename}]\n${doc.content.slice(0, 800)}`
          ).join('\n\n')
          
          console.log('Format-specific context loaded:', formatContextDocs.length, 'documents')
        } catch (error) {
          console.error('Failed to load format-specific context (table might not exist):', error)
        }
      }

      const ikigaiText = ikigai ? `
IKIGAI - CORE MISSION & PURPOSE (This should guide ALL content creation):
Mission: ${ikigai.mission}
Purpose: ${ikigai.purpose}
Values: ${ikigai.values}
Goals: ${ikigai.goals}
Target Audience: ${ikigai.audience}
Brand Voice: ${ikigai.voice}
What You Stand Against: ${ikigai.enemy || 'Not specified'}
` : ''

      // Generate multiple posts for this format if postsCount > 1
      const postsCount = format.postsCount || 1
      const postPromises = Array.from({ length: postsCount }, async (_, index) => {
        const prompt = `
${ikigaiText ? `${ikigaiText}\nIMPORTANT: All content must align with and advance the above Ikigai. This is your PRIMARY guiding principle.\n` : ''}

${format.prompt}

${postsCount > 1 ? `
IMPORTANT: You are creating post ${index + 1} of ${postsCount} unique posts from this content.
- Each post should be completely unique and approach the content from a different angle
- Vary the tone, focus, and specific points highlighted
- Don't repeat the same examples or phrasing from other posts
- Make each post valuable and standalone
` : ''}

Original content to transform:
${document.content}

General context from user's knowledge base:
${contextText}

${formatContextText ? `\nFormat-specific context for ${format.platform}:\n${formatContextText}` : ''}

Please transform the content according to the format requirements while staying true to the mission, values, and goals defined in the Ikigai. The content should serve the target audience and reflect the specified brand voice. Return only the formatted content, ready to post on ${format.platform}.
`

        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a content formatting expert specializing in ${format.platform} content. Transform the provided content according to the specific requirements while maintaining the core message and value.${postsCount > 1 ? ` You are creating unique variation ${index + 1} of ${postsCount}.` : ''}`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.8, // Higher temperature for more variation when creating multiple posts
        })

        const formattedContent = response.choices[0]?.message?.content || ''

        return {
          formatId: format.id,
          content: formattedContent,
          postIndex: index
        }
      })

      return Promise.all(postPromises)
    })

    const generatedFormats = await Promise.all(formatPromises)
    // Flatten the results since we now have arrays of posts per format
    const flattenedFormats = generatedFormats.flat()

    // First, delete existing document formats for this document to avoid conflicts
    await prisma.documentFormat.deleteMany({
      where: {
        documentId: resolvedParams.id
      }
    })

    // Save generated formats to database - create multiple entries for multiple posts
    const documentFormats = await Promise.all(
      flattenedFormats.map(({ formatId, content }) =>
        prisma.documentFormat.create({
          data: {
            documentId: resolvedParams.id,
            formatId,
            content,
            status: 'PENDING'
          }
        })
      )
    )

    return NextResponse.json({ documentFormats })
  } catch (error) {
    console.error('Error generating formats:', error)
    return NextResponse.json({ error: 'Failed to generate formats' }, { status: 500 })
  }
}

async function createDefaultFormats() {
  const defaultFormats = [
    {
      name: 'LinkedIn Post',
      platform: 'LinkedIn',
      prompt: `Transform this content into a professional LinkedIn post that:
- Starts with a hook that grabs attention
- Uses short paragraphs for readability
- Includes relevant hashtags (3-5)
- Has a call-to-action or question to encourage engagement
- Maintains a professional but approachable tone
- Keeps it under 1300 characters for optimal engagement`,
      postsCount: 1,
      postingRules: [{ frequency: 3, dayOfWeek: null, timeOfDay: '09:00' }]
    },
    {
      name: 'X (Twitter) Thread',
      platform: 'X',
      prompt: `Transform this content into an engaging X (Twitter) thread that:
- Breaks down the content into digestible tweets (under 280 characters each)
- Starts with a compelling hook tweet
- Numbers the tweets (1/n, 2/n, etc.)
- Uses relevant hashtags strategically
- Ends with a summary or call-to-action
- Maintains the core message across the thread`,
      postsCount: 1,
      postingRules: [{ frequency: 5, dayOfWeek: null, timeOfDay: '14:00' }]
    },
    {
      name: 'Newsletter',
      platform: 'Email',
      prompt: `Transform this content into a newsletter format that:
- Has a compelling subject line
- Opens with a personal greeting
- Structures content with clear sections and headers
- Includes actionable insights or takeaways
- Has a conversational, friendly tone
- Ends with a clear next step or call-to-action
- Is scannable with bullet points and short paragraphs`,
      postsCount: 1,
      postingRules: [{ frequency: 1, dayOfWeek: 2, timeOfDay: '08:00' }] // Tuesday mornings
    },
    {
      name: 'YouTube Script',
      platform: 'YouTube',
      prompt: `Transform this content into a YouTube video script that:
- Opens with a strong hook in the first 15 seconds
- Includes clear sections with smooth transitions
- Has natural, conversational language meant to be spoken
- Includes engagement prompts (like, subscribe, comment)
- Has a compelling title suggestion
- Ends with a strong call-to-action
- Includes suggested timestamps for key sections`,
      postsCount: 1,
      postingRules: [{ frequency: 1, dayOfWeek: 4, timeOfDay: '16:00' }] // Thursday afternoons
    }
  ]

  for (const formatData of defaultFormats) {
    const { postingRules, ...formatInfo } = formatData
    await prisma.format.create({
      data: {
        ...formatInfo,
        postingRules: {
          create: postingRules
        }
      }
    })
  }
}
