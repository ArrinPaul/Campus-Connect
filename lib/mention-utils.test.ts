import {
  extractMentions,
  parseMentions,
  isValidMention,
  getMentionDisplay,
  MENTION_REGEX,
} from './mention-utils'

describe('MENTION_REGEX', () => {
  it('should match basic mentions', () => {
    const text = 'Hey @john how are you?'
    const matches = Array.from(text.matchAll(MENTION_REGEX))
    expect(matches).toHaveLength(1)
    expect(matches[0][1]).toBe('john')
  })

  it('should match multiple mentions', () => {
    const text = 'Hey @john and @jane!'
    const matches = Array.from(text.matchAll(MENTION_REGEX))
    expect(matches).toHaveLength(2)
    expect(matches[0][1]).toBe('john')
    expect(matches[1][1]).toBe('jane')
  })

  it('should match mentions with underscores and numbers', () => {
    const text = '@john_doe123 @user_name @test123'
    const matches = Array.from(text.matchAll(MENTION_REGEX))
    expect(matches).toHaveLength(3)
    expect(matches[0][1]).toBe('john_doe123')
    expect(matches[1][1]).toBe('user_name')
    expect(matches[2][1]).toBe('test123')
  })

  it('should not match @ followed by space', () => {
    const text = '@ john'
    const matches = Array.from(text.matchAll(MENTION_REGEX))
    expect(matches).toHaveLength(0)
  })

  it('should not match @ at end', () => {
    const text = 'email@'
    const matches = Array.from(text.matchAll(MENTION_REGEX))
    expect(matches).toHaveLength(0)
  })
})

describe('extractMentions', () => {
  it('should extract single mention', () => {
    const mentions = extractMentions('Hey @john!')
    expect(mentions).toEqual(['john'])
  })

  it('should extract multiple mentions', () => {
    const mentions = extractMentions('Hey @john and @jane!')
    expect(mentions).toEqual(['john', 'jane'])
  })

  it('should extract unique mentions only', () => {
    const mentions = extractMentions('Hey @john, I said @john!')
    expect(mentions).toEqual(['john'])
  })

  it('should handle mentions with underscores and numbers', () => {
    const mentions = extractMentions('@user_name @test123 @john_doe')
    expect(mentions).toEqual(['user_name', 'test123', 'john_doe'])
  })

  it('should return empty array for no mentions', () => {
    const mentions = extractMentions('No mentions here')
    expect(mentions).toEqual([])
  })

  it('should return empty array for empty string', () => {
    const mentions = extractMentions('')
    expect(mentions).toEqual([])
  })

  it('should return empty array for null/undefined', () => {
    expect(extractMentions(null as any)).toEqual([])
    expect(extractMentions(undefined as any)).toEqual([])
  })

  it('should handle mentions at start and end', () => {
    const mentions = extractMentions('@start hello @end')
    expect(mentions).toEqual(['start', 'end'])
  })

  it('should handle mentions with newlines', () => {
    const mentions = extractMentions('Hello @john\nHow are you @jane?')
    expect(mentions).toEqual(['john', 'jane'])
  })
})

describe('parseMentions', () => {
  it('should parse text with no mentions', () => {
    const segments = parseMentions('Just plain text')
    expect(segments).toEqual([
      { type: 'text', content: 'Just plain text' },
    ])
  })

  it('should parse single mention', () => {
    const segments = parseMentions('Hey @john!')
    expect(segments).toEqual([
      { type: 'text', content: 'Hey ' },
      { type: 'mention', content: 'john' },
      { type: 'text', content: '!' },
    ])
  })

  it('should parse multiple mentions', () => {
    const segments = parseMentions('Hey @john and @jane!')
    expect(segments).toEqual([
      { type: 'text', content: 'Hey ' },
      { type: 'mention', content: 'john' },
      { type: 'text', content: ' and ' },
      { type: 'mention', content: 'jane' },
      { type: 'text', content: '!' },
    ])
  })

  it('should parse mention at start', () => {
    const segments = parseMentions('@john hello')
    expect(segments).toEqual([
      { type: 'mention', content: 'john' },
      { type: 'text', content: ' hello' },
    ])
  })

  it('should parse mention at end', () => {
    const segments = parseMentions('Hello @john')
    expect(segments).toEqual([
      { type: 'text', content: 'Hello ' },
      { type: 'mention', content: 'john' },
    ])
  })

  it('should handle empty string', () => {
    const segments = parseMentions('')
    expect(segments).toEqual([
      { type: 'text', content: '' },
    ])
  })

  it('should handle mentions with underscores and numbers', () => {
    const segments = parseMentions('Hi @user_name and @test123')
    expect(segments).toEqual([
      { type: 'text', content: 'Hi ' },
      { type: 'mention', content: 'user_name' },
      { type: 'text', content: ' and ' },
      { type: 'mention', content: 'test123' },
    ])
  })

  it('should handle consecutive mentions', () => {
    const segments = parseMentions('@john @jane')
    expect(segments).toEqual([
      { type: 'mention', content: 'john' },
      { type: 'text', content: ' ' },
      { type: 'mention', content: 'jane' },
    ])
  })

  it('should handle mentions with newlines', () => {
    const segments = parseMentions('Hello @john\nHow are you?')
    expect(segments).toEqual([
      { type: 'text', content: 'Hello ' },
      { type: 'mention', content: 'john' },
      { type: 'text', content: '\nHow are you?' },
    ])
  })
})

describe('isValidMention', () => {
  it('should validate correct usernames', () => {
    expect(isValidMention('john')).toBe(true)
    expect(isValidMention('john_doe')).toBe(true)
    expect(isValidMention('user123')).toBe(true)
    expect(isValidMention('test_user_123')).toBe(true)
    expect(isValidMention('a')).toBe(true)
  })

  it('should reject invalid usernames', () => {
    expect(isValidMention('')).toBe(false)
    expect(isValidMention('john doe')).toBe(false) // space
    expect(isValidMention('john-doe')).toBe(false) // hyphen
    expect(isValidMention('john.doe')).toBe(false) // period
    expect(isValidMention('@john')).toBe(false) // @ symbol
    expect(isValidMention('john!')).toBe(false) // special char
  })

  it('should reject usernames that are too long', () => {
    const longUsername = 'a'.repeat(31)
    expect(isValidMention(longUsername)).toBe(false)
  })

  it('should accept maximum length username', () => {
    const maxUsername = 'a'.repeat(30)
    expect(isValidMention(maxUsername)).toBe(true)
  })

  it('should reject null/undefined', () => {
    expect(isValidMention(null as any)).toBe(false)
    expect(isValidMention(undefined as any)).toBe(false)
  })

  it('should reject non-string types', () => {
    expect(isValidMention(123 as any)).toBe(false)
    expect(isValidMention({} as any)).toBe(false)
    expect(isValidMention([] as any)).toBe(false)
  })
})

describe('getMentionDisplay', () => {
  it('should prepend @ to username', () => {
    expect(getMentionDisplay('john')).toBe('@john')
    expect(getMentionDisplay('user_name')).toBe('@user_name')
    expect(getMentionDisplay('test123')).toBe('@test123')
  })

  it('should handle empty string', () => {
    expect(getMentionDisplay('')).toBe('@')
  })
})

describe('Edge cases and integration', () => {
  it('should handle mentions mixed with hashtags', () => {
    const text = 'Check out @john talking about #javascript'
    const mentions = extractMentions(text)
    expect(mentions).toEqual(['john'])
  })

  it('should handle email addresses vs mentions', () => {
    const text = 'Email me at test@example.com or mention @john'
    const mentions = extractMentions(text)
    // Note: Simple regex will match both 'example' and 'john'
    // In real usage, context and validation help distinguish
    expect(mentions).toEqual(['example', 'john'])
  })

  it('should handle mentions in different contexts', () => {
    const contexts = [
      'Hey @john',
      '@john hey',
      'Hi @john!',
      '(@john)',
      '"@john"',
      'Hello@john', // This will still match
    ]
    
    contexts.forEach(text => {
      const mentions = extractMentions(text)
      expect(mentions).toContain('john')
    })
  })

  it('should parse complex content correctly', () => {
    const content = 'Meeting with @alice and @bob about #project!\n@charlie will join later.'
    const segments = parseMentions(content)
    
    // Should have mentions for alice, bob, charlie
    const mentionSegments = segments.filter(s => s.type === 'mention')
    expect(mentionSegments).toHaveLength(3)
    expect(mentionSegments.map(s => s.content)).toEqual(['alice', 'bob', 'charlie'])
  })
})
