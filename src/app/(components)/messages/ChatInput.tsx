"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Send, Image as ImageIcon, Smile, Paperclip, X, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSendMessage: (content: string) => void
  disabled?: boolean
  placeholder?: string
}

const EMOJI_LIST = [
  "😊", "😂", "❤️", "👍", "🔥", "🚀", "🎉", "💡", 
  "👏", "🙌", "😎", "🤔", "🥳", "✨", "💯", "💻", 
  "📚", "🎓", "🤝", "💪", "⚡", "🎯", "💬", "👀"
]

export function ChatInput({ onSendMessage, disabled, placeholder = "Type a message..." }: ChatInputProps) {
  const [content, setContent] = useState("")
  const [selectedFile, setSelectedFile] = useState<{ name: string; url: string; isImage: boolean } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    let finalContent = content.trim()

    if (selectedFile) {
      if (selectedFile.isImage) {
        finalContent = finalContent ? `${finalContent}\n![Image](${selectedFile.url})` : `![Image](${selectedFile.url})`
      } else {
        finalContent = finalContent ? `${finalContent}\n[📎 ${selectedFile.name}](${selectedFile.url})` : `[📎 ${selectedFile.name}](${selectedFile.url})`
      }
    }

    if (!finalContent || disabled) return

    onSendMessage(finalContent)
    setContent("")
    setSelectedFile(null)
    setShowEmojiPicker(false)

    if (inputRef.current) {
      inputRef.current.style.height = "44px"
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
    e.target.style.height = "auto"
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isImageOnly: boolean) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const isImg = file.type.startsWith("image/")
      const reader = new FileReader()
      reader.onload = (event) => {
        const url = event.target?.result as string
        setSelectedFile({
          name: file.name,
          url,
          isImage: isImg,
        })
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setIsUploading(false)
    }
    // reset input
    e.target.value = ""
  }

  const addEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji)
    setShowEmojiPicker(false)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div className="relative p-4 bg-background/90 backdrop-blur-md border-t border-border flex flex-col gap-2">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e, false)}
        accept="image/*,.pdf,.doc,.docx,.zip,.txt"
        className="hidden"
      />
      <input
        type="file"
        ref={imageInputRef}
        onChange={(e) => handleFileUpload(e, true)}
        accept="image/*"
        className="hidden"
      />

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 right-12 z-30 bg-card border border-border rounded-xl shadow-xl p-3 w-64 animate-in fade-in zoom-in duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Emojis</span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted"
            >
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="text-xl p-1.5 rounded-md hover:bg-accent hover:scale-110 transition-all text-center"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected File / Image Preview */}
      {selectedFile && (
        <div className="flex items-center gap-3 p-2 bg-accent/40 border border-border rounded-lg w-fit max-w-sm animate-in fade-in">
          {selectedFile.isImage ? (
            <Image src={selectedFile.url} alt="Upload preview" width={48} height={48} unoptimized className="h-12 w-12 object-cover rounded-md border border-border" />
          ) : (
            <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <FileText size={20} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{selectedFile.name}</p>
            <p className="text-[10px] text-muted-foreground">{selectedFile.isImage ? "Image ready to send" : "Document attached"}</p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedFile(null)}
            className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex items-center gap-1 pb-1 text-muted-foreground">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            title="Attach file"
            className="p-2 rounded-full hover:bg-accent hover:text-foreground transition-colors"
          >
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
          </button>
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={disabled || isUploading}
            title="Attach image"
            className="p-2 rounded-full hover:bg-accent hover:text-primary transition-colors"
          >
            <ImageIcon size={18} />
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
              "w-full resize-none bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all max-h-32 scrollbar-none pr-10",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{ height: "44px" }}
          />
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            title="Add emoji"
            className="absolute right-3 bottom-2.5 p-1 rounded-full text-muted-foreground hover:text-primary transition-colors"
          >
            <Smile size={18} />
          </button>
        </div>

        <div className="pb-0.5">
          <Button
            type="submit"
            disabled={(!content.trim() && !selectedFile) || disabled}
            size="icon"
            className="h-10 w-10 rounded-full shadow-md transition-all active:scale-95"
          >
            <Send size={16} />
          </Button>
        </div>
      </form>
    </div>
  )
}
