import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const ikigai = await prisma.ikigai.findFirst({
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({ ikigai })
  } catch (error) {
    console.error('Error fetching ikigai:', error)
    return NextResponse.json({ error: 'Failed to fetch ikigai' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mission, purpose, values, goals, audience, voice } = body

    // Check if ikigai already exists
    const existingIkigai = await prisma.ikigai.findFirst()

    let ikigai
    if (existingIkigai) {
      // Update existing ikigai
      ikigai = await prisma.ikigai.update({
        where: { id: existingIkigai.id },
        data: {
          mission,
          purpose,
          values,
          goals,
          audience,
          voice,
        }
      })
    } else {
      // Create new ikigai
      ikigai = await prisma.ikigai.create({
        data: {
          mission,
          purpose,
          values,
          goals,
          audience,
          voice,
        }
      })
    }

    return NextResponse.json({ ikigai })
  } catch (error) {
    console.error('Error saving ikigai:', error)
    return NextResponse.json({ error: 'Failed to save ikigai' }, { status: 500 })
  }
}
