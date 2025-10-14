import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 5
        },
        formats: {
          include: {
            format: true
          }
        }
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, content, isDraft } = body

    // Get current document to create version
    const currentDocument = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1
        }
      }
    })

    if (!currentDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Create new version if content changed
    const shouldCreateVersion = currentDocument.content !== content
    const nextVersion = currentDocument.versions.length > 0 
      ? currentDocument.versions[0].version + 1 
      : 1

    const updateData = {
      title: title || currentDocument.title,
      content,
      isDraft: isDraft ?? currentDocument.isDraft,
    }

    const [document] = await Promise.all([
      prisma.document.update({
        where: { id: params.id },
        data: updateData
      }),
      shouldCreateVersion ? prisma.documentVersion.create({
        data: {
          documentId: params.id,
          content: currentDocument.content,
          version: nextVersion
        }
      }) : Promise.resolve(null)
    ])

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.document.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
