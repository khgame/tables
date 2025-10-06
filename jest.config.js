/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test/unit', '<rootDir>/test/e2e'],
  transform: {
    '^.+\\.(ts|tsx|js)$': 'babel-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  collectCoverageFrom: [
    'src/plugin/convertInternals.ts',
    'src/serializer/hintmeta/**/*.ts'
  ],
  coverageThreshold: {
    global: {
      lines: 98,
      branches: 90,
      functions: 100,
      statements: 98
    }
  }
}
