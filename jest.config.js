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
    'src/**/*.ts',
    '!src/types*.ts',
    // Re-export barrel adds little value for coverage
    '!src/plugin/index.ts'
  ],
  coverageThreshold: {
    global: {
      lines: 70,
      branches: 70,
      functions: 70,
      statements: 70
    }
  }
}
