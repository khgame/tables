import { tableSchema } from '../../src/plugin/schema'

jest.mock('@khgame/schema', () => {
  const actual = jest.requireActual('@khgame/schema')
  return {
    ...actual,
    parseSchema: jest.fn(() => ({ parsed: true }))
  }
})

jest.mock('../../src/plugin/erows', () => ({
  tableEnsureRows: jest.fn((table: any) => ({
    ...table,
    rows: [1],
    erows: [1]
  }))
}))

jest.mock('../../src/plugin/desc', () => ({
  tableDesc: jest.fn((table: any) => ({
    ...table,
    markCols: ['A'],
    markLine: { A: '@A' },
    descLine: { A: 'alpha' }
  }))
}))

describe('tableSchema', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('ensures rows/desc when schema prerequisites missing', () => {
    const table = { markCols: undefined } as any
    const ret = tableSchema(table)

    const { tableEnsureRows } = require('../../src/plugin/erows') as { tableEnsureRows: jest.Mock }
    const { tableDesc } = require('../../src/plugin/desc') as { tableDesc: jest.Mock }
    const { parseSchema } = require('@khgame/schema') as { parseSchema: jest.Mock }

    expect(tableEnsureRows).toHaveBeenCalled()
    expect(tableDesc).toHaveBeenCalled()
    expect(parseSchema).toHaveBeenCalledWith(['@A'], undefined)
    expect(ret.schema).toEqual({ parsed: true })
    expect(ret.markList).toEqual(['@A'])
  })

  it('skips ensure when marks already present and forwards context', () => {
    const table = {
      marks: { row: 1, col: 'A' },
      markLine: { A: '@A' },
      descLine: { A: 'alpha' },
      markCols: ['A']
    } as any
    const context = { strict: true }
    const ret = tableSchema(table, context)

    const { tableEnsureRows } = require('../../src/plugin/erows') as { tableEnsureRows: jest.Mock }
    const { tableDesc } = require('../../src/plugin/desc') as { tableDesc: jest.Mock }
    const { parseSchema } = require('@khgame/schema') as { parseSchema: jest.Mock }

    expect(tableEnsureRows).not.toHaveBeenCalled()
    expect(tableDesc).not.toHaveBeenCalled()
    expect(parseSchema).toHaveBeenLastCalledWith(['@A'], context)
    expect(ret.schema).toEqual({ parsed: true })
  })
})
