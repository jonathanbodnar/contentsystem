import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const posts = await prisma.calendarPost.findMany({
      orderBy: {
        scheduledDate: 'asc'
      }
    })

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Error fetching calendar posts:', error)
    return NextResponse.json({ error: 'Failed to fetch calendar posts' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, scheduledDate } = body

    const post = await prisma.calendarPost.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(scheduledDate && { scheduledDate: new Date(scheduledDate) })
      }
    })

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Error updating calendar post:', error)
    return NextResponse.json({ error: 'Failed to update calendar post' }, { status: 500 })
  }
}

