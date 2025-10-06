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
    'src/plugin/convert.ts',
    'src/serializer/hintmeta/**/*.ts'
  ],
  coverageThreshold: {
    global: {
      lines: 100,
      branches: 100,
      functions: 100,
      statements: 100
    }
  }
}
