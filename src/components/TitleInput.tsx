'use client'

import { useState, useEffect, useRef } from 'react'

interface TitleInputProps {
  initialValue: string
  onTitleChange: (title: string) => void
  placeholder?: string
}

export default function TitleInput({ initialValue, onTitleChange, placeholder = "Document title..." }: TitleInputProps) {
  const [localTitle, setLocalTitle] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync with parent state changes
  useEffect(() => {
    setLocalTitle(initialValue)
    console.log('TitleInput synced:', { initialValue })
  }, [initialValue])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    console.log('TitleInput changing:', { from: localTitle, to: newTitle })
    setLocalTitle(newTitle)
    onTitleChange(newTitle)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Don't let any parent components handle these events
    e.stopPropagation()
  }

  const handleFocus = (e: React.FocusEvent) => {
    e.stopPropagation()
  }

  const handleBlur = (e: React.FocusEvent) => {
    e.stopPropagation()
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={localTitle}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className="text-xl font-semibold bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 flex-1 min-w-0"
      autoComplete="off"
      spellCheck="false"
      style={{ 
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
        background: 'transparent'
      }}
    />
  )
}
