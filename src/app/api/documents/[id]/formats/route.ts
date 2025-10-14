import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const documentFormats = await prisma.documentFormat.findMany({
      where: { documentId: resolvedParams.id },
      include: {
        format: {
          include: {
            postingRules: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ documentFormats })
  } catch (error) {
    console.error('Error fetching document formats:', error)
    return NextResponse.json({ error: 'Failed to fetch document formats' }, { status: 500 })
  }
}
