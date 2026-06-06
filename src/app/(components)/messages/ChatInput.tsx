"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Image as ImageIcon, Smile, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSendMessage: (content: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSendMessage, disabled, placeholder = "Type a message..." }: ChatInputProps) {
  const [content, setContent] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!content.trim() || disabled) return
    onSendMessage(content.trim())
    setContent("")
    
    // Reset height
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    
    // Auto-resize
    e.target.style.height = "auto"
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  return (
    <form 
      onSubmit={handleSubmit}
      className="p-4 bg-canvas border-t border-hairline flex items-end gap-3 animate-in"
    >
      <div className="flex items-center gap-1 pb-1">
        <button type="button" className="p-2 rounded-full text-ink-muted-48 hover:bg-canvas-parchment hover:text-primary transition-colors btn-press">
          <Paperclip size={20} />
        </button>
        <button type="button" className="p-2 rounded-full text-ink-muted-48 hover:bg-canvas-parchment hover:text-primary transition-colors btn-press">
          <ImageIcon size={20} />
        </button>
      </div>

      <div className="flex-1 relative">
        <textarea
          ref={inputRef}
          rows={1}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full resize-none bg-canvas-parchment/50 border border-hairline rounded-lg px-4 py-2.5 text-body focus:outline-none focus:ring-1 focus:ring-primary transition-all max-h-32 scrollbar-none",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          style={{ height: "44px" }}
        />
        <button 
          type="button" 
          className="absolute right-3 bottom-2.5 p-1 rounded-full text-ink-muted-48 hover:text-primary transition-colors"
        >
          <Smile size={20} />
        </button>
      </div>

      <div className="pb-0.5">
        <Button
          type="submit"
          disabled={!content.trim() || disabled}
          variant="primary"
          size="icon"
          className="h-10 w-10 rounded-full shadow-sm"
        >
          <Send size={18} />
        </Button>
      </div>
    </form>
  )
}
