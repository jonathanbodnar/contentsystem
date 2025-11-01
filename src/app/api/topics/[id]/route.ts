import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    const { title, completed } = body

    const topic = await prisma.topic.update({
      where: { id: resolvedParams.id },
      data: {
        ...(title !== undefined && { title }),
        ...(completed !== undefined && { completed }),
      }
    })

    return NextResponse.json({ topic })
  } catch (error) {
    console.error('Error updating topic:', error)
    return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    
    await prisma.topic.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting topic:', error)
    return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 })
  }
}
