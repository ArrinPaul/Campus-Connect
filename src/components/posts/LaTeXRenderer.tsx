"use client"

import { useEffect, useRef } from "react"
import katex from "katex"
import { cn } from "@/lib/utils"

interface LaTeXRendererProps {
  latex: string
  /** If true, renders as a display (block) equation; otherwise inline */
  displayMode?: boolean
  className?: string
}

export function LaTeXRenderer({ latex, displayMode = false, className }: LaTeXRendererProps) {
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    try {
      katex.render(latex, containerRef.current, {
        displayMode,
        throwOnError: false,
        errorColor: "#ef4444",
        trust: false,
        strict: false,
      })
    } catch {
      if (containerRef.current) {
        containerRef.current.textContent = latex
      }
    }
  }, [latex, displayMode])

  return (
    <span
      ref={containerRef}
      className={cn(
        "katex-wrapper",
        displayMode && "block my-3 text-center overflow-x-auto",
        className
      )}
      aria-label={`Math equation: ${latex}`}
    />
  )
}
