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
        console.log('Processing PDF file:', file.name, 'Size:', buffer.length)
        try {
          // Extract text from PDF
          const pdfData = await pdf(buffer)
          console.log('PDF parsed successfully, text length:', pdfData.text?.length || 0)
          extractedText = pdfData.text || ''
        } catch (pdfError) {
          console.error('PDF parsing failed with pdf-parse:', pdfError)
          // For now, we'll still throw the error, but we could add alternative PDF libraries here
          throw pdfError
        }
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        console.log('Processing DOCX file:', file.name, 'Size:', buffer.length)
        // Extract text from DOCX
        const result = await mammoth.extractRawText({ buffer })
        console.log('DOCX parsed successfully, text length:', result.value?.length || 0)
        extractedText = result.value || ''
      }
    } catch (parseError) {
      console.error('Document parsing error:', parseError)
      console.error('File details:', {
        name: file.name,
        type: file.type,
        size: file.size,
        bufferLength: buffer.length
      })
      return NextResponse.json({ 
        error: 'Failed to extract text from document', 
        details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
      }, { status: 400 })
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: 'No text content found in document' }, { status: 400 })
    }

    // Generate S3 key and upload file (optional for development)
    const s3Key = generateS3Key(file.name, folder)
    let uploadResult = { success: true }
    
    // Only upload to S3 if credentials are configured
    if (process.env.WASABI_ACCESS_KEY_ID && process.env.WASABI_SECRET_ACCESS_KEY) {
      uploadResult = await uploadFile(s3Key, buffer, file.type)
      
      if (!uploadResult.success) {
        return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 })
      }
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
    
    // Provide more specific error information
    let errorMessage = 'Failed to process upload'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: error instanceof Error ? error.stack : 'Unknown error'
    }, { status: 500 })
  }
}
