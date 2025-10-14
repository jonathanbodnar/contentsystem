import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { uploadFile, generateS3Key } from '@/lib/s3'
import pdf from 'pdf-parse'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Extract text from PDF
    let extractedText = ''
    try {
      const pdfData = await pdf(buffer)
      extractedText = pdfData.text
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError)
      return NextResponse.json({ error: 'Failed to extract text from PDF' }, { status: 400 })
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: 'No text content found in PDF' }, { status: 400 })
    }

    // Generate S3 key and upload file
    const s3Key = generateS3Key(file.name, 'context')
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
