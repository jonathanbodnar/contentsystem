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
      onChange(editor.getHTML())
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

  // REMOVE the content sync useEffect entirely - it's causing the loop

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
