import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const formats = await prisma.format.findMany({
      include: {
        postingRules: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Parse contextFiles JSON strings to arrays and ensure postsCount exists
    const formatsWithParsedContext = formats.map(format => {
      let contextFiles = []
      try {
        contextFiles = format.contextFiles ? JSON.parse(format.contextFiles) : []
      } catch (e) {
        console.warn('Failed to parse contextFiles for format:', format.id)
        contextFiles = []
      }
      
      return {
        ...format,
        contextFiles,
        postsCount: format.postsCount || 1 // Default to 1 if field doesn't exist yet
      }
    })

    return NextResponse.json({ formats: formatsWithParsedContext })
  } catch (error) {
    console.error('Error fetching formats:', error)
    return NextResponse.json({ error: 'Failed to fetch formats' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, platform, prompt, postsCount, contextFiles, postingRules } = body

    const format = await prisma.format.create({
      data: {
        name,
        platform,
        prompt,
        postsCount: postsCount || 1,
        contextFiles: contextFiles ? JSON.stringify(contextFiles) : null,
        postingRules: {
          create: postingRules || []
        }
      },
      include: {
        postingRules: true
      }
    })

    // Parse contextFiles for response
    const formatWithParsedContext = {
      ...format,
      contextFiles: format.contextFiles ? JSON.parse(format.contextFiles) : [],
      postsCount: format.postsCount || 1
    }

    return NextResponse.json({ format: formatWithParsedContext })
  } catch (error) {
    console.error('Error creating format:', error)
    return NextResponse.json({ error: 'Failed to create format' }, { status: 500 })
  }
}
