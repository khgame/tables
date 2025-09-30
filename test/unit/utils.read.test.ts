jest.mock('xlsx', () => ({
  readFile: jest.fn()
}))

import * as Read from '../../src/utils/read'

describe('translateWorkBook', () => {
  it('builds table data and sorts columns', () => {
    const workbook = {
      SheetNames: ['foo', 'bar'],
      Sheets: {
        foo: {},
        bar: {
          A1: { t: 's', v: 'id', w: 'id' },
          B1: { t: 's', v: '@', w: '@' },
          A2: { t: 's', v: '001', w: '001' },
          B2: { t: 's', v: 'Alpha', w: 'Alpha' },
          AA3: { t: 's', v: 'extra', w: 'extra' },
          '!ref': {},
          A: { t: 's', v: 'ignored', w: 'ignored' }
        }
      }
    }

    const table = Read.translateWorkBook(workbook, 'bar')
    expect(table.cols).toEqual(['A', 'B', 'AA'])
    expect(table.getValue(table, '2', 'B')).toBe('Alpha')
    expect(table.getValue(table, '3', 'AA')).toBe('extra')
    expect(table.getValue(table, '99', 'A')).toBeUndefined()
  })
})

describe('readAndTranslate', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    const { readFile } = require('xlsx') as { readFile: jest.Mock }
    readFile.mockReset()
  })

  it('applies plugins sequentially with context', () => {
    const { readFile } = require('xlsx') as { readFile: jest.Mock }
    const workbookStub = {
      SheetNames: ['__data'],
      Sheets: {
        __data: {
          A1: { t: 's', v: '@', w: '@' },
          B1: { t: 's', v: 'name', w: 'name' },
          A2: { t: 's', v: 'id', w: 'id' },
          B2: { t: 's', v: 'alpha', w: 'alpha' }
        }
      }
    }
    readFile.mockReturnValue(workbookStub)

    const plugin = jest.fn((table: any, context: any) => ({ ...table, context }))

    const result = Read.readAndTranslate('path.xlsx', { plugins: [plugin] }, { foo: 'bar' })
    expect(readFile).toHaveBeenCalledWith('path.xlsx')
    expect(plugin).toHaveBeenCalledWith(expect.objectContaining({ cols: ['A', 'B'] }), { foo: 'bar' })
    expect(result.context).toEqual({ foo: 'bar' })
  })

  it('returns translated table when no plugins provided', () => {
    const { readFile } = require('xlsx') as { readFile: jest.Mock }
    const workbookStub = {
      SheetNames: ['foo'],
      Sheets: {
        foo: {
          A1: { t: 's', v: '@', w: '@' },
          B1: { t: 's', v: 'value', w: 'value' },
          A2: { t: 's', v: 'row1', w: 'row1' },
          B2: { t: 'n', v: 1, w: '1' }
        }
      }
    }
    readFile.mockReturnValue(workbookStub)

    const result = Read.readAndTranslate('path.xlsx')
    expect(result.getValue(result, '2', 'B')).toBe(1)
  })
})
