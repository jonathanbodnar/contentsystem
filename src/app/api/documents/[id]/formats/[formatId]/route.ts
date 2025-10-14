import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; formatId: string } }
) {
  try {
    const body = await request.json()
    const { status, content } = body

    const documentFormat = await prisma.documentFormat.update({
      where: {
        documentId_formatId: {
          documentId: params.id,
          formatId: params.formatId
        }
      },
      data: {
        status,
        ...(content && { content })
      },
      include: {
        format: {
          include: {
            postingRules: true
          }
        }
      }
    })

    // If approved, create calendar entry
    if (status === 'APPROVED') {
      await createCalendarEntry(documentFormat)
    }

    return NextResponse.json({ documentFormat })
  } catch (error) {
    console.error('Error updating document format:', error)
    return NextResponse.json({ error: 'Failed to update document format' }, { status: 500 })
  }
}

async function createCalendarEntry(documentFormat: {
  id: string
  documentId: string
  format: {
    name: string
    platform: string
    postingRules: Array<{
      dayOfWeek: number | null
      timeOfDay: string | null
    }>
  }
  content: string
}) {
  try {
    // Calculate next scheduled date based on posting rules
    const postingRule = documentFormat.format.postingRules[0]
    if (!postingRule) return

    const now = new Date()
    const scheduledDate = new Date(now)

    // Simple scheduling logic - can be enhanced
    if (postingRule.dayOfWeek !== null) {
      // Schedule for specific day of week
      const daysUntilTarget = (postingRule.dayOfWeek - now.getDay() + 7) % 7
      scheduledDate.setDate(now.getDate() + (daysUntilTarget || 7))
    } else {
      // Schedule for tomorrow if no specific day
      scheduledDate.setDate(now.getDate() + 1)
    }

    // Set time if specified
    if (postingRule.timeOfDay) {
      const [hours, minutes] = postingRule.timeOfDay.split(':').map(Number)
      scheduledDate.setHours(hours, minutes, 0, 0)
    }

    // Get document title for calendar entry
    const document = await prisma.document.findUnique({
      where: { id: documentFormat.documentId },
      select: { title: true }
    })

    await prisma.calendarPost.create({
      data: {
        documentFormatId: documentFormat.id,
        title: `${document?.title || 'Untitled'} - ${documentFormat.format.name}`,
        content: documentFormat.content,
        platform: documentFormat.format.platform,
        scheduledDate,
        status: 'SCHEDULED'
      }
    })
  } catch (error) {
    console.error('Error creating calendar entry:', error)
  }
}
