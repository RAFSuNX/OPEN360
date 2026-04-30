import type { Config } from 'jest'

const config: Config = {
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      transform: { '^.+\\.tsx?$': ['ts-jest', {}] },
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
      testMatch: ['**/__tests__/**/*.test.ts'],
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      transform: { '^.+\\.tsx?$': ['ts-jest', {}] },
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
      testMatch: ['**/__tests__/**/*.test.tsx'],
    },
  ],
}

export default config
