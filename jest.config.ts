/**
 * Jest Configuration for Integration Tests
 * 
 * Configures Jest for TypeScript support and Amplify testing
 */

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'amplify/**/*.{ts,tsx}',
    '!amplify/**/*.d.ts',
    '!amplify/**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@amplify/(.*)$': '<rootDir>/amplify/$1',
  },
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
