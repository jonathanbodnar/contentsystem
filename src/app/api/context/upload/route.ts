import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { uploadFile, generateS3Key } from '@/lib/s3'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require('mammoth')

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'context'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX
    ]
    
    if (!supportedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only PDF and DOCX files are supported' }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Extract text based on file type
    let extractedText = ''
    try {
      if (file.type === 'application/pdf') {
        // Extract text from PDF
        const pdfData = await pdf(buffer)
        extractedText = pdfData.text
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Extract text from DOCX
        const result = await mammoth.extractRawText({ buffer })
        extractedText = result.value
      }
    } catch (parseError) {
      console.error('Document parsing error:', parseError)
      return NextResponse.json({ error: 'Failed to extract text from document' }, { status: 400 })
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: 'No text content found in document' }, { status: 400 })
    }

    // Generate S3 key and upload file
    const s3Key = generateS3Key(file.name, folder)
    const uploadResult = await uploadFile(s3Key, buffer, file.type)

    if (!uploadResult.success) {
      return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 })
    }

    // Save to database
    const contextDocument = await prisma.contextDocument.create({
      data: {
        filename: file.name,
        content: extractedText,
        s3Key,
      }
    })

    return NextResponse.json({
      contextDocument: {
        id: contextDocument.id,
        filename: contextDocument.filename,
        createdAt: contextDocument.createdAt,
      }
    })
  } catch (error) {
    console.error('Context upload error:', error)
    return NextResponse.json({ error: 'Failed to process upload' }, { status: 500 })
  }
}
