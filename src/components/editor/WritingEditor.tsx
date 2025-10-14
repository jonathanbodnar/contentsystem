'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'

interface WritingEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export default function WritingEditor({ content, onChange, placeholder = "Start writing..." }: WritingEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
    onCreate: ({ editor }) => {
      // Set initial content if provided
      if (content && content !== editor.getHTML()) {
        editor.commands.setContent(content, false)
      }
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[500px] cursor-text',
        contenteditable: 'true',
        role: 'textbox',
        'aria-label': 'Writing editor',
        spellcheck: 'true',
      },
    },
    autofocus: true,
    editable: true,
  })

  // Only update content if it's significantly different to avoid sync issues
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      const currentContent = editor.getHTML()
      // Only update if the content is actually different (not just whitespace/formatting)
      const isSignificantlyDifferent = content.replace(/<[^>]*>/g, '').trim() !== 
        currentContent.replace(/<[^>]*>/g, '').trim()
      
      if (isSignificantlyDifferent) {
        editor.commands.setContent(content || '', false)
      }
    }
  }, [editor, content])

  // Auto-focus the editor when it's ready
  useEffect(() => {
    if (editor) {
      // Small delay to ensure the editor is fully rendered
      setTimeout(() => {
        editor.commands.focus()
      }, 100)
    }
  }, [editor])

  const handleClick = () => {
    if (editor) {
      editor.commands.focus()
    }
  }

  if (!editor) {
    return (
      <div className="w-full h-full bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    )
  }

  return (
    <div 
      className="w-full h-full bg-white cursor-text p-4"
      onClick={handleClick}
    >
      <EditorContent 
        editor={editor} 
        className="w-full h-full focus-within:outline-none prose prose-lg max-w-none"
      />
    </div>
  )
}
