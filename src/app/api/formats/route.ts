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

    return NextResponse.json({ formats })
  } catch (error) {
    console.error('Error fetching formats:', error)
    return NextResponse.json({ error: 'Failed to fetch formats' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, platform, prompt, contextFiles, postingRules } = body

    const format = await prisma.format.create({
      data: {
        name,
        platform,
        prompt,
        contextFiles: contextFiles ? JSON.stringify(contextFiles) : null,
        postingRules: {
          create: postingRules || []
        }
      },
      include: {
        postingRules: true
      }
    })

    return NextResponse.json({ format })
  } catch (error) {
    console.error('Error creating format:', error)
    return NextResponse.json({ error: 'Failed to create format' }, { status: 500 })
  }
}
