import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const playbook = await prisma.playbook.findUnique({
      where: { id: resolvedParams.id },
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
      }
    })

    if (!playbook) {
      return NextResponse.json({ error: 'Playbook not found' }, { status: 404 })
    }

    return NextResponse.json({ playbook })
  } catch (error) {
    console.error('Error fetching playbook:', error)
    return NextResponse.json({ error: 'Failed to fetch playbook' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    const { title, description, content, isDraft } = body

    const playbook = await prisma.playbook.update({
      where: { id: resolvedParams.id },
      data: {
        title,
        description,
        content,
        isDraft: isDraft ?? true,
      },
      include: {
        sourceDocument: {
          select: {
            title: true
          }
        }
      }
    })

    return NextResponse.json({ playbook })
  } catch (error) {
    console.error('Error updating playbook:', error)
    return NextResponse.json({ error: 'Failed to update playbook' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    
    await prisma.playbook.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting playbook:', error)
    return NextResponse.json({ error: 'Failed to delete playbook' }, { status: 500 })
  }
}

