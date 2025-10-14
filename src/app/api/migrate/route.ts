import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    console.log('Running database migration...')
    
    const { stdout, stderr } = await execAsync('npx prisma db push')
    
    console.log('Migration stdout:', stdout)
    if (stderr) {
      console.error('Migration stderr:', stderr)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database migration completed',
      output: stdout
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
