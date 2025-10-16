import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const [documents, folders] = await Promise.all([
      prisma.document.findMany({
        orderBy: {
          updatedAt: 'desc'
        },
        select: {
          id: true,
          title: true,
          content: true,
          isDraft: true,
          folderId: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      prisma.folder.findMany({
        include: {
          documents: {
            select: {
              id: true,
              title: true,
              content: true,
              isDraft: true,
              folderId: true,
              createdAt: true,
              updatedAt: true,
            }
          },
          children: {
            include: {
              documents: {
                select: {
                  id: true,
                  title: true,
                  isDraft: true,
                  folderId: true,
                  createdAt: true,
                  updatedAt: true,
                }
              }
            }
          }
        }
      })
    ])

    return NextResponse.json({ documents, folders })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, folderId } = body

    const document = await prisma.document.create({
      data: {
        title: title || 'Untitled',
        content: content || '',
        folderId: folderId || null,
      }
    })

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}
