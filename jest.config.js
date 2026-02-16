const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/convex/_generated/(.*)$': '<rootDir>/__mocks__/convex/$1',
    '../../convex/_generated/api': '<rootDir>/__mocks__/convex/api.js',
    '../../convex/_generated/dataModel': '<rootDir>/__mocks__/convex/dataModel.ts',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
}

module.exports = createJestConfig(customJestConfig)
