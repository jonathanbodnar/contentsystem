'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'

interface SimpleEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export default function SimpleEditor({ content, onChange, placeholder = "Start writing..." }: SimpleEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    autofocus: true,
    editable: true,
  })

  // Only set content once when editor is created, then let it manage itself
  useEffect(() => {
    if (editor && content && !editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [editor]) // Only run when editor is created

  if (!editor) {
    return (
      <div className="w-full h-full bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-white">
      <EditorContent 
        editor={editor} 
        className="w-full h-full prose prose-lg max-w-none p-8 focus:outline-none"
      />
    </div>
  )
}

