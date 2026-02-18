import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { sanitizeText } from './sanitize';

describe('XSS Prevention Property Tests', () => {
  /**
   * Property 42: XSS prevention
   * For any text input containing potentially malicious content (script tags, event handlers, etc.),
   * the content must be sanitized before storage and display.
   * Validates: Requirements 12.3
   */
  it('Property 42: should remove script tags from any input', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        (before, after) => {
          const maliciousInput = `${before}<script>alert('XSS')</script>${after}`;
          const sanitized = sanitizeText(maliciousInput);
          
          // Script tags should be removed
          expect(sanitized).not.toContain('<script>');
          expect(sanitized).not.toContain('</script>');
          expect(sanitized).not.toContain("alert('XSS')");
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 42: should remove event handlers from any input', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.constantFrom('onclick', 'onerror', 'onload', 'onmouseover'),
        fc.string(),
        (text, eventHandler, payload) => {
          const maliciousInput = `${text} ${eventHandler}="${payload}"`;
          const sanitized = sanitizeText(maliciousInput);
          
          // Event handlers should be removed
          expect(sanitized).not.toMatch(new RegExp(`${eventHandler}\\s*=`, 'i'));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 42: should remove javascript: protocol from any input', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        (before, after) => {
          const maliciousInput = `${before}javascript:alert('XSS')${after}`;
          const sanitized = sanitizeText(maliciousInput);
          
          // javascript: protocol should be removed
          expect(sanitized.toLowerCase()).not.toContain('javascript:');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 42: should remove iframe tags from any input', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        (before, after) => {
          const maliciousInput = `${before}<iframe src="evil.com"></iframe>${after}`;
          const sanitized = sanitizeText(maliciousInput);
          
          // iframe tags should be removed
          expect(sanitized).not.toContain('<iframe');
          expect(sanitized).not.toContain('</iframe>');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 42: should remove object and embed tags from any input', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.constantFrom('object', 'embed'),
        fc.string(),
        (before, tag, after) => {
          const maliciousInput = `${before}<${tag} data="evil.swf"></${tag}>${after}`;
          const sanitized = sanitizeText(maliciousInput);
          
          // object/embed tags should be removed
          expect(sanitized).not.toContain(`<${tag}`);
          expect(sanitized).not.toContain(`</${tag}>`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 42: should preserve safe text content', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => 
          !s.includes('<') && 
          !s.includes('>') && 
          !s.includes('&') &&
          !s.includes('"') &&
          !s.includes("'") &&
          !s.includes('javascript:') &&
          !s.includes('data:text/html') &&
          s.length > 0
        ),
        (safeText) => {
          const sanitized = sanitizeText(safeText);
          
          // Safe text should be preserved
          expect(sanitized).toBe(safeText);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 42: should handle multiple XSS vectors in single input', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (text) => {
          const maliciousInput = `
            ${text}
            <script>alert('XSS')</script>
            <img src=x onerror="alert('XSS')">
            <a href="javascript:alert('XSS')">Click</a>
            <iframe src="evil.com"></iframe>
          `;
          const sanitized = sanitizeText(maliciousInput);
          
          // All XSS vectors should be removed
          expect(sanitized).not.toContain('<script>');
          expect(sanitized).not.toMatch(/onerror\s*=/i);
          expect(sanitized.toLowerCase()).not.toContain('javascript:');
          expect(sanitized).not.toContain('<iframe');
        }
      ),
      { numRuns: 100 }
    );
  });
});
