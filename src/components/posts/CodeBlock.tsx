"use client"

import { useEffect, useRef, useState } from "react"
import Prism from "prismjs"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

// Load commonly needed language grammars
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-jsx"
import "prismjs/components/prism-tsx"
import "prismjs/components/prism-python"
import "prismjs/components/prism-java"
import "prismjs/components/prism-c"
import "prismjs/components/prism-cpp"
import "prismjs/components/prism-bash"
import "prismjs/components/prism-css"
import "prismjs/components/prism-json"
import "prismjs/components/prism-markdown"
import "prismjs/components/prism-sql"
import "prismjs/components/prism-yaml"
import "prismjs/components/prism-rust"
import "prismjs/components/prism-go"

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
  className?: string
}

export function CodeBlock({ code, language = "text", filename, className }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)

  // Normalize language alias
  const normalizedLang = normalizeLanguage(language)

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current)
    }
  }, [code, normalizedLang])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div className={cn("group relative my-3 rounded-xl overflow-hidden border border-border bg-[#1e1e2e]", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-card/5">
        <div className="flex items-center gap-2">
          {/* macOS-style dots */}
          <span className="h-3 w-3 rounded-full bg-destructive/70" />
          <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
          <span className="h-3 w-3 rounded-full bg-success/70" />
          {filename && (
            <span className="ml-2 text-xs text-primary-foreground/50 font-mono">{filename}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-primary-foreground/30 font-mono uppercase tracking-wide">{normalizedLang}</span>
          <button
            onClick={handleCopy}
            className="rounded-md p-1 text-primary-foreground/40 hover:text-primary-foreground/80 hover:bg-card/10 transition-colors"
            aria-label="Copy code"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="overflow-x-auto">
        <pre className="m-0 p-4 text-sm leading-relaxed bg-transparent">
          <code ref={codeRef} className={`language-${normalizedLang} font-mono`}>
            {code}
          </code>
        </pre>
      </div>
    </div>
  )
}

function normalizeLanguage(lang: string): string {
  const aliases: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    py: "python",
    rb: "ruby",
    sh: "bash",
    shell: "bash",
    zsh: "bash",
    fish: "bash",
    yml: "yaml",
    md: "markdown",
    plaintext: "text",
    plain: "text",
    txt: "text",
  }
  return aliases[lang.toLowerCase()] ?? lang.toLowerCase()
}
