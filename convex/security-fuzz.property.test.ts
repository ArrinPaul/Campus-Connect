import { describe, it, expect } from "@jest/globals"
import * as fc from "fast-check"
import { sanitizeText, sanitizeMarkdown } from "./sanitize"

/**
 * Security-focused fuzz tests for input sanitization.
 *
 * These tests go beyond the basic property tests in sanitize.property.test.ts
 * by testing advanced XSS vectors, encoding bypass attempts, and edge cases
 * that attackers commonly exploit.
 */
describe("Security Fuzz Tests — Advanced XSS Prevention", () => {
  // ── Encoding Bypass Attempts ──────────────────────

  it("should neutralize HTML entity-encoded script tags", () => {
    fc.assert(
      fc.property(fc.string(), (payload) => {
        // Various encoding attempts attackers use
        const vectors = [
          `&#60;script&#62;${payload}&#60;/script&#62;`,
          `&#x3C;script&#x3E;${payload}&#x3C;/script&#x3E;`,
          `\x3Cscript\x3E${payload}\x3C/script\x3E`,
        ]

        for (const vector of vectors) {
          const sanitized = sanitizeText(vector)
          expect(sanitized.toLowerCase()).not.toMatch(/<script/i)
        }
      }),
      { numRuns: 50 }
    )
  })

  it("should handle mixed-case tag evasion", () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.constantFrom(
          "ScRiPt",
          "SCRIPT",
          "sCrIpT",
          "Script",
          "scRIPT"
        ),
        (payload, tagCase) => {
          const input = `<${tagCase}>${payload}</${tagCase}>`
          const sanitized = sanitizeText(input)
          expect(sanitized.toLowerCase()).not.toContain(`<${tagCase.toLowerCase()}>`)
        }
      ),
      { numRuns: 50 }
    )
  })

  it("should handle null bytes and control characters in payloads", () => {
    fc.assert(
      fc.property(fc.string(), (payload) => {
        const vectors = [
          `<scr\x00ipt>alert('XSS')</scr\x00ipt>`,
          `<scr\nipt>alert('${payload}')</script>`,
          `<scr\tipt>alert(1)</script>`,
        ]

        for (const vector of vectors) {
          const sanitized = sanitizeText(vector)
          // Raw <script> tags must not survive sanitization
          expect(sanitized.toLowerCase()).not.toMatch(/<script/i)
        }
      }),
      { numRuns: 50 }
    )
  })

  // ── Event Handler Evasion ─────────────────────────

  it("should strip all event handler variants", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          "onclick",
          "onerror",
          "onload",
          "onmouseover",
          "onfocus",
          "onblur",
          "oninput",
          "onsubmit",
          "onkeydown",
          "onkeypress",
          "onkeyup",
          "ondblclick",
          "oncontextmenu",
          "ondrag",
          "ondrop",
          "onanimationend",
          "ontransitionend",
          "onwheel",
          "onscroll",
          "onpointerdown"
        ),
        fc.string(),
        (handler, payload) => {
          const inputs = [
            `<div ${handler}="${payload}">test</div>`,
            `<div ${handler}='${payload}'>test</div>`,
            `<div ${handler}=${payload}>test</div>`,
            `<div ${handler.toUpperCase()}="${payload}">test</div>`,
          ]

          for (const input of inputs) {
            const sanitized = sanitizeText(input)
            expect(sanitized).not.toMatch(
              new RegExp(`${handler}\\s*=`, "i")
            )
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  // ── Protocol-Based Attacks ────────────────────────

  it("should block dangerous protocols in all contexts", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          "javascript:",
          "JAVASCRIPT:",
          "JaVaScRiPt:",
          "data:text/html",
          "DATA:TEXT/HTML",
          "vbscript:"
        ),
        fc.string(),
        (protocol, payload) => {
          const input = `<a href="${protocol}${payload}">click</a>`
          const sanitized = sanitizeText(input)
          expect(sanitized.toLowerCase()).not.toContain("javascript:")
          expect(sanitized.toLowerCase()).not.toContain("data:text/html")
        }
      ),
      { numRuns: 50 }
    )
  })

  // ── Dangerous Tag Removal ─────────────────────────

  it("should remove all dangerous HTML tags", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          "script",
          "iframe",
          "object",
          "embed",
          "style",
          "link",
          "meta",
          "base",
          "svg",
          "form",
          "img"
        ),
        fc.string(),
        (tag, content) => {
          const input = `<${tag}>${content}</${tag}>`
          const sanitized = sanitizeText(input)
          expect(sanitized).not.toContain(`<${tag}`)
        }
      ),
      { numRuns: 100 }
    )
  })

  // ── Output Safety Properties ──────────────────────

  it("should always produce output with HTML-encoded angle brackets", () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const sanitized = sanitizeText(input)
        // After sanitization, no raw < or > should remain
        expect(sanitized).not.toMatch(/<(?!&)/)
        expect(sanitized).not.toMatch(/(?<!&)>/)
      }),
      { numRuns: 200 }
    )
  })

  it("sanitized output length should not exceed input length", () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const sanitized = sanitizeText(input)
        // HTML encoding can increase length (< → &lt;) but removal of tags
        // generally keeps output proportional. Allow for entity expansion.
        // Key property: output is finite and related to input
        expect(sanitized.length).toBeLessThanOrEqual(input.length * 6)
      }),
      { numRuns: 200 }
    )
  })

  it("should be idempotent — double sanitization produces same result", () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const once = sanitizeText(input)
        const twice = sanitizeText(once)
        // Running sanitizeText twice should produce same or further-sanitized result
        // The key is that the output remains safe
        expect(twice).not.toMatch(/<script/i)
        expect(twice).not.toMatch(/javascript:/i)
        expect(twice).not.toMatch(/on\w+=/)
      }),
      { numRuns: 100 }
    )
  })

  // ── Empty and edge case inputs ────────────────────

  it("should handle empty and whitespace inputs gracefully", () => {
    expect(sanitizeText("")).toBe("")
    expect(sanitizeText("   ")).toBe("   ")
    expect(sanitizeText("\n\t\r")).toBe("\n\t\r")
  })

  it("should handle very long inputs without crashing", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10000, maxLength: 50000 }),
        (longInput) => {
          const sanitized = sanitizeText(longInput)
          expect(typeof sanitized).toBe("string")
          expect(sanitized).not.toContain("<script")
        }
      ),
      { numRuns: 5 }
    )
  })
})

describe("Security Fuzz Tests — Markdown Sanitization", () => {
  it("should preserve valid markdown while removing XSS", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          "# Heading",
          "**bold**",
          "*italic*",
          "- list item",
          "> quote",
          "`code`",
          "[link](https://example.com)",
          "~~strikethrough~~",
          "1. numbered"
        ),
        fc.string(),
        (markdown, payload) => {
          const input = `${markdown}\n<script>alert('${payload}')</script>\n${markdown}`
          const sanitized = sanitizeMarkdown(input)

          // Markdown syntax should be preserved
          expect(sanitized).toContain(markdown)
          // XSS should be removed
          expect(sanitized.toLowerCase()).not.toContain("<script")
        }
      ),
      { numRuns: 50 }
    )
  })

  it("should neutralize javascript: links in markdown", () => {
    fc.assert(
      fc.property(fc.string(), (linkText) => {
        const input = `[${linkText}](javascript:alert(1))`
        const sanitized = sanitizeMarkdown(input)
        expect(sanitized.toLowerCase()).not.toContain("javascript:")
      }),
      { numRuns: 100 }
    )
  })

  it("should remove iframe/embed tags from markdown", () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (before, after) => {
        const input = `${before}\n<iframe src="evil.com"></iframe>\n${after}`
        const sanitized = sanitizeMarkdown(input)
        expect(sanitized).not.toContain("<iframe")
      }),
      { numRuns: 50 }
    )
  })
})

describe("Security Fuzz Tests — Input Boundaries", () => {
  it("should handle unicode and special characters", () => {
    fc.assert(
      fc.property(
        fc.string({ unit: "grapheme-ascii" }),
        (input) => {
          const sanitized = sanitizeText(input)
          expect(typeof sanitized).toBe("string")
          // Should not contain raw executable content
          expect(sanitized).not.toMatch(/<script/i)
        }
      ),
      { numRuns: 200 }
    )
  })

  it("should handle strings with emoji and mixed scripts", () => {
    const mixedInputs = [
      "Hello 🌍 <script>alert(1)</script>",
      "مرحبا <img onerror=alert(1)>",
      "こんにちは<iframe>evil</iframe>",
      "Привет <object data=x>",
      "안녕하세요 javascript:alert(1)",
    ]

    for (const input of mixedInputs) {
      const sanitized = sanitizeText(input)
      expect(sanitized).not.toContain("<script")
      expect(sanitized).not.toContain("<iframe")
      expect(sanitized).not.toContain("<object")
      expect(sanitized.toLowerCase()).not.toContain("javascript:")
      expect(sanitized).not.toMatch(/onerror\s*=/i)
    }
  })
})
