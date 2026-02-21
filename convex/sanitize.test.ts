import { describe, it, expect } from '@jest/globals';
import { sanitizeText, sanitizeMarkdown, isValidSafeUrl } from './sanitize';

// ─────────────────────────────────────────────
// sanitizeText — allowlist approach tests
// ─────────────────────────────────────────────

describe('sanitizeText', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeText('')).toBe('');
    expect(sanitizeText(null as unknown as string)).toBe('');
    expect(sanitizeText(undefined as unknown as string)).toBe('');
  });

  it('preserves plain text without special characters', () => {
    expect(sanitizeText('Hello world')).toBe('Hello world');
    expect(sanitizeText('Just a normal sentence.')).toBe('Just a normal sentence.');
  });

  it('HTML-encodes special characters', () => {
    expect(sanitizeText('a & b')).toBe('a &amp; b');
    expect(sanitizeText('1 < 2')).toBe('1 &lt; 2');
    expect(sanitizeText('2 > 1')).toBe('2 &gt; 1');
    expect(sanitizeText('say "hello"')).toBe('say &quot;hello&quot;');
    expect(sanitizeText("it's fine")).toBe("it&#39;s fine");
  });

  // ── XSS Vectors that MUST be neutralized ──

  it('strips <script> tags and their content', () => {
    const result = sanitizeText('<script>alert("xss")</script>');
    expect(result).not.toContain('<script');
    // Script content is removed along with the tags
    expect(result).not.toContain('alert(');
  });

  it('strips nested/obfuscated script tags', () => {
    // The inner <script>ipt>alert(1)</script> is removed as a script block,
    // leaving '<scr' which is not a valid tag. HTML-encoding converts '<' to '&lt;'.
    const result = sanitizeText('<scr<script>ipt>alert(1)</script>');
    expect(result).not.toContain('<script');
    // The remaining '<scr' gets HTML-encoded, so no raw angle brackets
    expect(result).not.toContain('<');
  });

  it('strips <img> tags (onerror vector)', () => {
    const result = sanitizeText('<img src=x onerror="alert(1)">');
    expect(result).not.toContain('<img');
    expect(result).not.toContain('onerror');
  });

  it('strips <a> tags', () => {
    const result = sanitizeText('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain('<a ');
    expect(result).not.toContain('javascript');
  });

  it('strips <div>, <span>, <marquee> and other HTML tags', () => {
    const result = sanitizeText('<div onmouseover="alert(1)">text</div>');
    expect(result).not.toContain('<div');
    expect(result).not.toContain('onmouseover');
    expect(result).toContain('text');
  });

  it('strips <iframe> tags', () => {
    const result = sanitizeText('<iframe src="evil.com"></iframe>');
    expect(result).not.toContain('<iframe');
  });

  it('strips <svg> tags', () => {
    const result = sanitizeText('<svg onload="alert(1)"><circle/></svg>');
    expect(result).not.toContain('<svg');
  });

  it('strips <form> and input tags', () => {
    const result = sanitizeText('<form action="evil"><input type="text"></form>');
    expect(result).not.toContain('<form');
    expect(result).not.toContain('<input');
  });

  it('strips HTML comments', () => {
    const result = sanitizeText('before <!-- comment --> after');
    expect(result).not.toContain('<!--');
    expect(result).not.toContain('-->');
    expect(result).toContain('before');
    expect(result).toContain('after');
  });

  it('strips case-insensitive tags', () => {
    const result = sanitizeText('<SCRIPT>alert(1)</SCRIPT>');
    expect(result).not.toContain('<SCRIPT');
    // Script content is removed along with the tags
    expect(result).not.toContain('alert(1)');
  });

  it('neutralizes javascript: protocol', () => {
    const result = sanitizeText('javascript:alert(1)');
    expect(result.toLowerCase()).not.toContain('javascript:');
  });

  it('neutralizes vbscript: protocol', () => {
    const result = sanitizeText('vbscript:msgbox(1)');
    expect(result.toLowerCase()).not.toContain('vbscript:');
  });

  it('neutralizes data:text/html protocol', () => {
    const result = sanitizeText('data:text/html,<script>alert(1)</script>');
    expect(result.toLowerCase()).not.toContain('data:text/html');
    expect(result).not.toContain('<script');
  });

  it('handles multiple XSS vectors in one input', () => {
    const input = `
      <script>alert(1)</script>
      <img src=x onerror="alert(2)">
      <a href="javascript:void(0)">link</a>
      <div onmouseover="alert(3)">hover</div>
      <iframe src="evil.com"></iframe>
    `;
    const result = sanitizeText(input);
    expect(result).not.toContain('<script');
    expect(result).not.toContain('<img');
    expect(result).not.toContain('<a ');
    expect(result).not.toContain('<div');
    expect(result).not.toContain('<iframe');
    expect(result.toLowerCase()).not.toContain('javascript:');
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('onmouseover');
  });
});

// ─────────────────────────────────────────────
// sanitizeMarkdown — allowlist with markdown preservation
// ─────────────────────────────────────────────

describe('sanitizeMarkdown', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeMarkdown('')).toBe('');
  });

  it('preserves plain text', () => {
    expect(sanitizeMarkdown('Hello world')).toBe('Hello world');
  });

  // ── Markdown preservation ──

  it('preserves bold/italic syntax', () => {
    expect(sanitizeMarkdown('**bold** and *italic*')).toBe('**bold** and *italic*');
  });

  it('preserves headings', () => {
    expect(sanitizeMarkdown('# Heading 1\n## Heading 2')).toBe('# Heading 1\n## Heading 2');
  });

  it('preserves code blocks', () => {
    const input = '```js\nconsole.log("hi")\n```';
    expect(sanitizeMarkdown(input)).toBe(input);
  });

  it('preserves inline code', () => {
    expect(sanitizeMarkdown('use `const x = 1`')).toBe('use `const x = 1`');
  });

  it('preserves blockquotes', () => {
    expect(sanitizeMarkdown('> quoted text')).toBe('> quoted text');
  });

  it('preserves lists', () => {
    const input = '- item 1\n- item 2\n1. numbered';
    expect(sanitizeMarkdown(input)).toBe(input);
  });

  it('preserves safe markdown links', () => {
    expect(sanitizeMarkdown('[Google](https://google.com)')).toBe('[Google](https://google.com)');
  });

  it('preserves markdown images', () => {
    expect(sanitizeMarkdown('![alt](https://img.com/pic.png)')).toBe('![alt](https://img.com/pic.png)');
  });

  it('preserves strikethrough', () => {
    expect(sanitizeMarkdown('~~deleted~~')).toBe('~~deleted~~');
  });

  it('preserves LaTeX math syntax', () => {
    expect(sanitizeMarkdown('$E = mc^2$ and $$\\sum_{i=1}^n$$')).toBe('$E = mc^2$ and $$\\sum_{i=1}^n$$');
  });

  // ── XSS Vectors that MUST be neutralized ──

  it('strips <script> tags and their content', () => {
    const result = sanitizeMarkdown('text <script>alert(1)</script> more');
    expect(result).not.toContain('<script');
    // Script content is removed along with the tags
    expect(result).not.toContain('alert(1)');
    expect(result).toContain('text');
    expect(result).toContain('more');
  });

  it('strips ALL HTML tags (allowlist approach)', () => {
    const result = sanitizeMarkdown('<div onclick="alert(1)">text</div>');
    expect(result).not.toContain('<div');
    expect(result).not.toContain('onclick');
    expect(result).toContain('text');
  });

  it('strips <a> tags (only markdown links allowed)', () => {
    const result = sanitizeMarkdown('<a href="evil.com" onclick="alert(1)">link</a>');
    expect(result).not.toContain('<a ');
    expect(result).toContain('link');
  });

  it('strips <img> tags (only markdown images allowed)', () => {
    const result = sanitizeMarkdown('<img src=x onerror="alert(1)">');
    expect(result).not.toContain('<img');
  });

  it('strips <iframe>, <object>, <embed> tags', () => {
    const result = sanitizeMarkdown('<iframe src="evil.com"></iframe><object data="x"></object>');
    expect(result).not.toContain('<iframe');
    expect(result).not.toContain('<object');
  });

  it('neutralizes javascript: in markdown links', () => {
    const result = sanitizeMarkdown('[click me](javascript:alert(1))');
    expect(result).not.toContain('javascript:');
    expect(result).toContain('[click me]');
    expect(result).toContain('(#)');
  });

  it('neutralizes vbscript: in markdown links', () => {
    const result = sanitizeMarkdown('[click](vbscript:msgbox(1))');
    expect(result).not.toContain('vbscript:');
    expect(result).toContain('(#)');
  });

  it('neutralizes data:text/html in markdown links', () => {
    const result = sanitizeMarkdown('[click](data:text/html,<script>alert(1)</script>)');
    expect(result.toLowerCase()).not.toContain('data:text/html');
    expect(result).not.toContain('<script');
  });

  it('strips nested/obfuscated tags', () => {
    const result = sanitizeMarkdown('<scr<script>ipt>alert(1)</script>');
    expect(result).not.toContain('<script');
  });

  it('strips HTML comments', () => {
    const result = sanitizeMarkdown('text <!-- hidden --> more');
    expect(result).not.toContain('<!--');
  });

  it('handles mixed markdown + XSS', () => {
    const input = '**bold** <script>alert(1)</script> [link](https://safe.com) <img onerror="x">';
    const result = sanitizeMarkdown(input);
    expect(result).toContain('**bold**');
    expect(result).toContain('[link](https://safe.com)');
    expect(result).not.toContain('<script');
    expect(result).not.toContain('<img');
    expect(result).not.toContain('onerror');
  });
});

// ─────────────────────────────────────────────
// isValidSafeUrl — URL protocol validation
// ─────────────────────────────────────────────

describe('isValidSafeUrl', () => {
  it('accepts valid https URLs', () => {
    expect(isValidSafeUrl('https://example.com')).toBe(true);
    expect(isValidSafeUrl('https://github.com/user/repo')).toBe(true);
    expect(isValidSafeUrl('https://sub.domain.co.uk/path?q=1&b=2')).toBe(true);
  });

  it('rejects javascript: protocol', () => {
    expect(isValidSafeUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects data: protocol', () => {
    expect(isValidSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('rejects blob: protocol', () => {
    expect(isValidSafeUrl('blob:https://example.com/uuid')).toBe(false);
  });

  it('rejects ftp: protocol', () => {
    expect(isValidSafeUrl('ftp://files.example.com/file.txt')).toBe(false);
  });

  it('rejects empty and whitespace strings', () => {
    expect(isValidSafeUrl('')).toBe(false);
    expect(isValidSafeUrl('   ')).toBe(false);
  });

  it('rejects malformed URLs', () => {
    expect(isValidSafeUrl('not-a-url')).toBe(false);
    expect(isValidSafeUrl('://missing-protocol')).toBe(false);
  });

  it('trims whitespace before validation', () => {
    expect(isValidSafeUrl('  https://example.com  ')).toBe(true);
  });
});
