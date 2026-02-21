"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import CharacterCount from "@tiptap/extension-character-count"
import { useEffect, useCallback, useState } from "react"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Minus,
  Link as LinkIcon,
  Code2,
  Eye,
  Edit3,
  Strikethrough,
} from "lucide-react"
import { tiptapHtmlToMarkdown, markdownToTiptapHtml } from "./markdown-utils"
import { MarkdownRenderer } from "./MarkdownRenderer"

// ── Types ─────────────────────────────────────────────────────────────────────

interface RichTextEditorProps {
  value: string
  onChange: (markdown: string) => void
  placeholder?: string
  maxLength?: number
  minHeight?: string
  /** If true, render as a compact single-line-like editor (for comments) */
  compact?: boolean
  disabled?: boolean
}

// ── Toolbar Button ────────────────────────────────────────────────────────────

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault() // prevent editor blur
        onClick()
      }}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`rounded p-1 transition-colors ${
        active
          ? "bg-primary/10 dark:bg-blue-900/50 text-primary"
          : "text-muted-foreground hover:bg-accent"
      } disabled:opacity-40`}
    >
      {children}
    </button>
  )
}

// ── Link Dialog ───────────────────────────────────────────────────────────────

function LinkDialog({
  onConfirm,
  onCancel,
  initialUrl,
}: {
  onConfirm: (url: string) => void
  onCancel: () => void
  initialUrl?: string
}) {
  const [url, setUrl] = useState(initialUrl ?? "")

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-card rounded-lg border border-border shadow-md">
      <input
        autoFocus
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onConfirm(url)
          if (e.key === "Escape") onCancel()
        }}
        placeholder="https://..."
        className="flex-1 bg-transparent text-sm outline-none min-w-40 text-foreground"
      />
      <button
        type="button"
        onClick={() => onConfirm(url)}
        className="text-xs font-medium text-primary hover:underline"
      >
        Apply
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-xs text-muted-foreground hover:underline"
      >
        Cancel
      </button>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function RichTextEditor({
  value,
  onChange,
  placeholder = "What's on your mind?",
  maxLength,
  minHeight = "5rem",
  compact = false,
  disabled = false,
}: RichTextEditorProps) {
  const [previewMode, setPreviewMode] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable the default hardBreak behaviour — Shift+Enter adds <br>
        hardBreak: {},
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      ...(maxLength
        ? [CharacterCount.configure({ limit: maxLength })]
        : [CharacterCount.configure()]),
    ],
    content: markdownToTiptapHtml(value),
    editable: !disabled,
    onUpdate({ editor }) {
      const html = editor.getHTML()
      const md = tiptapHtmlToMarkdown(html)
      onChange(md)
    },
    editorProps: {
      attributes: {
        class: [
          "prose prose-sm dark:prose-invert max-w-none p-3 focus:outline-none",
          "prose-headings:font-semibold prose-a:text-blue-600 dark:prose-a:text-primary",
          "prose-code:rounded prose-code:bg-muted dark:prose-code:bg-card prose-code:px-1 prose-code:text-sm",
          "prose-pre:bg-background prose-pre:text-foreground",
        ].join(" "),
        style: `min-height: ${minHeight}`,
      },
    },
  })

  // Sync external value changes (e.g., form reset)
  useEffect(() => {
    if (!editor) return
    const currentMd = tiptapHtmlToMarkdown(editor.getHTML())
    if (currentMd !== value) {
      editor.commands.setContent(markdownToTiptapHtml(value), { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Sync editable state
  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [editor, disabled])

  const handleLinkConfirm = useCallback(
    (url: string) => {
      if (!editor) return
      setShowLinkDialog(false)
      if (!url) {
        editor.chain().focus().unsetLink().run()
        return
      }
      editor.chain().focus().setLink({ href: url }).run()
    },
    [editor]
  )

  if (!editor) return null

  const charCount = editor.storage.characterCount?.characters?.() ?? 0
  const isOverLimit = maxLength != null && charCount > maxLength

  // Keyboard shortcut hints
  const isMac =
    typeof navigator !== "undefined" && navigator.platform.includes("Mac")
  const mod = isMac ? "⌘" : "Ctrl"

  return (
    <div
      className={`rounded-lg border transition-colors ${
        isOverLimit
          ? "border-red-400 dark:border-red-600"
          : "border-border focus-within:border-blue-400 dark:focus-within:border-blue-600"
      } bg-card overflow-hidden`}
    >
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      {!compact && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1">
          {/* Formatting group */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title={`Bold (${mod}+B)`}
          >
            <Bold className="h-3.5 w-3.5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title={`Italic (${mod}+I)`}
          >
            <Italic className="h-3.5 w-3.5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title="Strikethrough"
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive("code")}
            title={`Inline code (${mod}+E)`}
          >
            <Code className="h-3.5 w-3.5" />
          </ToolbarButton>

          <div className="mx-1 h-4 border-l border-border" />

          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="h-3.5 w-3.5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="h-3.5 w-3.5" />
          </ToolbarButton>

          <div className="mx-1 h-4 border-l border-border" />

          {/* Blocks */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullet list"
          >
            <List className="h-3.5 w-3.5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Numbered list"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="Blockquote"
          >
            <Quote className="h-3.5 w-3.5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
            title="Code block"
          >
            <Code2 className="h-3.5 w-3.5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal rule"
          >
            <Minus className="h-3.5 w-3.5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => setShowLinkDialog(true)}
            active={editor.isActive("link")}
            title="Insert link"
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </ToolbarButton>

          {/* Spacer + Preview toggle */}
          <div className="ml-auto flex items-center gap-0.5">
            <ToolbarButton
              onClick={() => setPreviewMode(false)}
              active={!previewMode}
              title="Edit mode"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setPreviewMode(true)}
              active={previewMode}
              title="Preview markdown"
            >
              <Eye className="h-3.5 w-3.5" />
            </ToolbarButton>
          </div>
        </div>
      )}

      {/* ── Link dialog ───────────────────────────────────────────────────── */}
      {showLinkDialog && (
        <div className="border-b border-border px-3 py-2">
          <LinkDialog
            onConfirm={handleLinkConfirm}
            onCancel={() => setShowLinkDialog(false)}
            initialUrl={editor.getAttributes("link").href ?? ""}
          />
        </div>
      )}

      {/* ── Editor / Preview area ─────────────────────────────────────────── */}
      {previewMode ? (
        <div className="p-3" style={{ minHeight }}>
          {value ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-muted-foreground text-sm italic">Nothing to preview</p>
          )}
        </div>
      ) : (
        <EditorContent editor={editor} />
      )}

      {/* ── Footer: char count ───────────────────────────────────────────── */}
      {maxLength != null && (
        <div
          className={`flex justify-end px-3 py-1 text-xs border-t border-border ${
            isOverLimit
              ? "text-destructive dark:text-red-400"
              : "text-muted-foreground"
          }`}
        >
          {charCount}/{maxLength}
        </div>
      )}
    </div>
  )
}

// ── Compact/Comment editor ────────────────────────────────────────────────────

/**
 * A lightweight version of `RichTextEditor` for comment composers.
 * Only Bold, Italic, Code and Link are available (no block-level formatting).
 */
export function CompactRichTextEditor({
  value,
  onChange,
  placeholder = "Write a comment…",
  maxLength,
  disabled = false,
}: Omit<RichTextEditorProps, "compact" | "minHeight">) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        codeBlock: false,
        horizontalRule: false,
        hardBreak: {},
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      ...(maxLength ? [CharacterCount.configure({ limit: maxLength })] : []),
    ],
    content: markdownToTiptapHtml(value),
    editable: !disabled,
    onUpdate({ editor }) {
      const html = editor.getHTML()
      const md = tiptapHtmlToMarkdown(html)
      onChange(md)
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none px-3 py-2 focus:outline-none min-h-[2.5rem]",
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const currentMd = tiptapHtmlToMarkdown(editor.getHTML())
    if (currentMd !== value) {
      editor.commands.setContent(markdownToTiptapHtml(value), { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [editor, disabled])

  if (!editor) return null

  return (
    <div className="rounded-lg border border-border focus-within:border-blue-400 dark:focus-within:border-blue-600 bg-card overflow-hidden transition-colors">
      <EditorContent editor={editor} />
      {maxLength != null && (
        <div className="flex justify-end px-2 py-0.5 text-xs text-muted-foreground border-t border-border">
          {editor.storage.characterCount?.characters?.() ?? 0}/{maxLength}
        </div>
      )}
    </div>
  )
}
