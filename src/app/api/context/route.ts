import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { deleteFile } from '@/lib/s3'

export async function GET() {
  try {
    const contextDocuments = await prisma.contextDocument.findMany({
      select: {
        id: true,
        filename: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ contextDocuments })
  } catch (error) {
    console.error('Error fetching context documents:', error)
    return NextResponse.json({ error: 'Failed to fetch context documents' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
    }

    // Get document to retrieve S3 key
    const contextDocument = await prisma.contextDocument.findUnique({
      where: { id }
    })

    if (!contextDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete from S3
    await deleteFile(contextDocument.s3Key)

    // Delete from database
    await prisma.contextDocument.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting context document:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}

