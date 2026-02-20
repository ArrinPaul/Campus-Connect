const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/convex/_generated/(.*)$': '<rootDir>/__mocks__/convex/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '../../convex/_generated/api': '<rootDir>/__mocks__/convex/api.js',
    '../../convex/_generated/dataModel': '<rootDir>/__mocks__/convex/dataModel.ts',
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
