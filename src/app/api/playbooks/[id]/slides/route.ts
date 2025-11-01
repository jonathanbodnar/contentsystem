import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { slides } = await request.json()

    // Delete existing slides
    await prisma.playbookSlide.deleteMany({
      where: { playbookId: resolvedParams.id }
    })

    // Create new slides
    const createdSlides = await Promise.all(
      slides.map((slide: { order: number; title: string; content: string; layout: string; images?: string; position?: string }) =>
        prisma.playbookSlide.create({
          data: {
            playbookId: resolvedParams.id,
            order: slide.order,
            title: slide.title,
            content: slide.content,
            layout: slide.layout || 'text',
            images: slide.images || null,
            position: slide.position || null,
          }
        })
      )
    )

    return NextResponse.json({ slides: createdSlides })
  } catch (error) {
    console.error('Error saving slides:', error)
    return NextResponse.json({ error: 'Failed to save slides' }, { status: 500 })
  }
}
