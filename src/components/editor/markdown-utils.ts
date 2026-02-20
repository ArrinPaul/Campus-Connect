/**
 * Lightweight HTML ↔ Markdown utilities for the TipTap editor bridge.
 *
 * These converters handle only the subset of HTML that TipTap's StarterKit
 * emits.  They are intentionally minimal — complex nested structures are
 * handled correctly for typical post content.
 */

// ── HTML → Markdown ───────────────────────────────────────────────────────────

/**
 * Convert TipTap HTML output to a markdown string.
 *
 * Handles: h1-h6, strong, em, s (strikethrough), code (inline), pre>code,
 * blockquote, ul/ol/li, a, br, hr, and p.
 */
export function tiptapHtmlToMarkdown(html: string): string {
  if (!html || html === "<p></p>") return ""

  let md = html

  // Code blocks (must come before inline code)
  md = md.replace(
    /<pre[^>]*><code(?:\s+class="language-([^"]*)")?[^>]*>([\s\S]*?)<\/code><\/pre>/gi,
    (_, lang, code) => {
      const decoded = decodeHtmlEntities(code)
      return `\`\`\`${lang ?? ""}\n${decoded}\n\`\`\`\n\n`
    }
  )

  // Headings
  md = md.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, lvl, inner) => {
    const prefix = "#".repeat(Number(lvl))
    return `${prefix} ${stripTags(inner).trim()}\n\n`
  })

  // Blockquotes
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, inner) => {
    const text = tiptapHtmlToMarkdown(inner).trim()
    return text
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n") + "\n\n"
  })

  // Ordered lists
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, inner) => {
    let counter = 0
    const items = inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_: string, li: string) => {
      counter++
      return `${counter}. ${stripTags(li).trim()}\n`
    })
    return items + "\n"
  })

  // Unordered lists
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, inner) => {
    const items = inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_: string, li: string) => {
      return `- ${stripTags(li).trim()}\n`
    })
    return items + "\n"
  })

  // Bold
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
  md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**")

  // Italic
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "*$1*")
  md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "*$1*")

  // Strikethrough
  md = md.replace(/<s[^>]*>([\s\S]*?)<\/s>/gi, "~~$1~~")
  md = md.replace(/<del[^>]*>([\s\S]*?)<\/del>/gi, "~~$1~~")

  // Inline code
  md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, inner) => {
    return "`" + decodeHtmlEntities(inner) + "`"
  })

  // Links
  md = md.replace(/<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")

  // Hard breaks
  md = md.replace(/<br\s*\/?>/gi, "\n")

  // Horizontal rules
  md = md.replace(/<hr\s*\/?>/gi, "\n---\n\n")

  // Paragraphs → text + double newline
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "$1\n\n")

  // Strip any remaining HTML tags
  md = stripTags(md)

  // Decode HTML entities
  md = decodeHtmlEntities(md)

  // Collapse 3+ consecutive newlines to 2
  md = md.replace(/\n{3,}/g, "\n\n")

  return md.trim()
}

// ── Markdown → HTML  (minimal — just enough for TipTap initialisation) ───────

/**
 * Convert a markdown string to basic HTML for loading into TipTap.
 * This is intentionally lightweight; TipTap takes over from there.
 */
export function markdownToTiptapHtml(markdown: string): string {
  if (!markdown) return "<p></p>"

  let html = markdown

  // Escape existing HTML entities that shouldn't be processed
  // (don't double-encode)

  // Fenced code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = encodeHtmlEntities(code)
    const cls = lang ? ` class="language-${lang}"` : ""
    return `<pre><code${cls}>${escaped}</code></pre>`
  })

  // Headings
  html = html.replace(/^(#{1,6})\s+(.+)$/gm, (_, hashes, text) => {
    const lvl = hashes.length
    return `<h${lvl}>${text}</h${lvl}>`
  })

  // Horizontal rules
  html = html.replace(/^---$/gm, "<hr/>")

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, "<blockquote><p>$1</p></blockquote>")

  // Unordered lists
  html = html.replace(/(?:^- .+\n?)+/gm, (block) => {
    const items = block
      .trim()
      .split("\n")
      .map((line) => `<li>${line.replace(/^- /, "")}</li>`)
      .join("")
    return `<ul>${items}</ul>`
  })

  // Ordered lists
  html = html.replace(/(?:^\d+\. .+\n?)+/gm, (block) => {
    const items = block
      .trim()
      .split("\n")
      .map((line) => `<li>${line.replace(/^\d+\. /, "")}</li>`)
      .join("")
    return `<ol>${items}</ol>`
  })

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")

  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>")

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, "<s>$1</s>")

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>")

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // Line breaks within paragraphs → <br>
  html = html.replace(/(?<!\>)\n(?!\n)(?!<)/g, "<br/>")

  // Double newlines → paragraph breaks
  // Wrap blocks of text in <p> tags
  html = html
    .split(/\n\n+/)
    .map((block) => {
      block = block.trim()
      if (!block) return ""
      // Already wrapped in block-level tag
      if (/^<(h[1-6]|ul|ol|blockquote|pre|hr)/.test(block)) return block
      return `<p>${block}</p>`
    })
    .filter(Boolean)
    .join("")

  return html || "<p></p>"
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "")
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
}

function encodeHtmlEntities(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}
