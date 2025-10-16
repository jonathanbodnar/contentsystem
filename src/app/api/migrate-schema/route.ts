import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    // Try to add the postsCount column if it doesn't exist
    await prisma.$executeRaw`
      ALTER TABLE formats 
      ADD COLUMN IF NOT EXISTS "postsCount" INTEGER DEFAULT 1;
    `
    
    // Try to create the format_feedback table if it doesn't exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "format_feedback" (
        "id" TEXT NOT NULL,
        "formatId" TEXT NOT NULL,
        "documentId" TEXT NOT NULL,
        "feedback" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT "format_feedback_pkey" PRIMARY KEY ("id")
      );
    `
    
    // Add foreign key constraints if they don't exist
    try {
      await prisma.$executeRaw`
        ALTER TABLE "format_feedback" 
        ADD CONSTRAINT "format_feedback_formatId_fkey" 
        FOREIGN KEY ("formatId") REFERENCES "formats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `
    } catch (e) {
      // Constraint might already exist
      console.log('Foreign key constraint for formatId might already exist')
    }
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "format_feedback" 
        ADD CONSTRAINT "format_feedback_documentId_fkey" 
        FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `
    } catch (e) {
      // Constraint might already exist
      console.log('Foreign key constraint for documentId might already exist')
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Schema migration completed successfully' 
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to run schema migration',
    instructions: 'Send a POST request to this endpoint to add missing database fields'
  })
}
