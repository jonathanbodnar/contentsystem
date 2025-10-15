import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    const { name, platform, prompt, postsCount, contextFiles, postingRules } = body

    // Delete existing posting rules
    await prisma.postingRule.deleteMany({
      where: { formatId: resolvedParams.id }
    })

    // Update format with new posting rules
    const format = await prisma.format.update({
      where: { id: resolvedParams.id },
      data: {
        name,
        platform,
        prompt,
        postsCount: postsCount || 1,
        contextFiles: contextFiles ? JSON.stringify(contextFiles) : null,
        postingRules: {
          create: postingRules || []
        }
      },
      include: {
        postingRules: true
      }
    })

    return NextResponse.json({ format })
  } catch (error) {
    console.error('Error updating format:', error)
    return NextResponse.json({ error: 'Failed to update format' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    
    await prisma.format.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting format:', error)
    return NextResponse.json({ error: 'Failed to delete format' }, { status: 500 })
  }
}
