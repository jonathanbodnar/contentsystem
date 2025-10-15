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
          keepAttributes: true,
          HTMLAttributes: {
            class: 'tiptap-bullet-list',
          },
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: true,
          HTMLAttributes: {
            class: 'tiptap-ordered-list',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'tiptap-list-item',
          },
        },
        paragraph: {
          HTMLAttributes: {
            class: 'tiptap-paragraph',
          },
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
        class: 'focus:outline-none min-h-[500px] cursor-text tiptap-editor',
        contenteditable: 'true',
        role: 'textbox',
        'aria-label': 'Writing editor',
        spellcheck: 'true',
      },
      handleKeyDown: (view, event) => {
        const { state } = view
        const { selection } = state
        const { $from } = selection
        
        // Handle Enter key in lists
        if (event.key === 'Enter') {
          // Check if we're in a list item
          if ($from.parent.type.name === 'listItem') {
            // If the current list item is empty, exit the list
            if ($from.parent.textContent.trim() === '') {
              event.preventDefault()
              // Exit the list and create a paragraph
              const tr = state.tr.lift(selection.$from, selection.$from.depth - 1)
              view.dispatch(tr)
              return true
            }
          }
        }
        
        // Handle Backspace in lists
        if (event.key === 'Backspace') {
          if ($from.parent.type.name === 'listItem') {
            // If at the start of an empty list item, exit the list
            if ($from.parentOffset === 0 && $from.parent.textContent.trim() === '') {
              event.preventDefault()
              // Exit the list and create a paragraph
              const tr = state.tr.lift(selection.$from, selection.$from.depth - 1)
              view.dispatch(tr)
              return true
            }
          }
        }
        
        return false
      },
    },
    autofocus: true,
    editable: true,
    parseOptions: {
      preserveWhitespace: 'full',
    },
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
