const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // All other @/ imports map to src/
    '^@/(.*)$': '<rootDir>/src/$1',
    // Fix wrong-depth relative imports mistakenly using 3 levels up instead of 2
    '\\.\\./\\.\\./\\.\\./lib/validations': '<rootDir>/src/lib/validations',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  // Transform ESM-only packages that react-markdown and its remark/rehype ecosystem require
  transformIgnorePatterns: [
    '/node_modules/(?!(' + [
      'react-markdown',
      'remark-gfm',
      'remark-math',
      'rehype-katex',
      'rehype-highlight',
      'rehype-raw',
      'unified',
      'bail',
      'is-plain-obj',
      'trough',
      'vfile',
      'vfile-message',
      'micromark',
      'micromark-core-commonmark',
      'micromark-extension-gfm.*',
      'micromark-extension-math',
      'micromark-factory-.*',
      'micromark-util-.*',
      'mdast-util-.*',
      'hast-util-.*',
      'unist-util-.*',
      'hast-to-hyperscript',
      'property-information',
      'comma-separated-tokens',
      'space-separated-tokens',
      'estree-util-.*',
      'github-slugger',
      'decode-named-character-reference',
      'character-entities',
      'ccount',
      'escape-string-regexp',
      'devlop',
      'fault',
      'trim-lines',
      'zwitch',
      'longest-streak',
      'mdast-util-find-and-replace',
      'lowlight',
      '@wooorm/.*',
    ].join('|') + ')/)',
  ],
}

module.exports = createJestConfig(customJestConfig)
