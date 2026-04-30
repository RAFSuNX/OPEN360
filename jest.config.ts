import type { Config } from 'jest'

const config: Config = {
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testPathIgnorePatterns: ['/node_modules/', '/.next/'],
      transform: { '^.+\\.tsx?$': ['ts-jest', {}] },
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
      testMatch: ['**/__tests__/**/*.test.ts'],
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testPathIgnorePatterns: ['/node_modules/', '/.next/'],
      transform: { '^.+\\.tsx?$': ['ts-jest', {}] },
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
      testMatch: ['**/__tests__/**/*.test.tsx'],
    },
  ],
}

export default config
