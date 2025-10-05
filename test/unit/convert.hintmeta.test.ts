jest.mock('@khgame/schema', () => {
  const actual = jest.requireActual('@khgame/schema')
  return {
    ...actual,
    exportJson: jest.fn((_schema: any, descList: string[], convertedRows: any[][]) => {
      return convertedRows.map(row => {
        const payload: Record<string, any> = {}
        descList.forEach((key, idx) => {
          payload[key] = row[idx]
        })
        return payload
      })
    })
  }
})

import { tableConvert } from '../../src/plugin/convert'
import * as schemaModel from '../../src/serializer/core/schemaModel'
import * as khSchema from '@khgame/schema'

describe('convert hint metadata integration', () => {
  const exportJsonMock = khSchema.exportJson as jest.Mock
  const buildSchemaModelSpy = jest.spyOn(schemaModel, 'buildSchemaModel')

  afterEach(() => {
    exportJsonMock.mockClear()
    buildSchemaModelSpy.mockReset()
  })

  afterAll(() => {
    buildSchemaModelSpy.mockRestore()
  })

  function makeTable(rowValue: any, alias: string = 'int64'): any {
    const cells: Record<number, Record<string, any>> = {
      3: { A: 'row-1', B: rowValue }
    }
    return {
      schema: {},
      markCols: ['A', 'B'],
      markLine: { A: '@', B: alias },
      descLine: { A: 'tid', B: 'value' },
      marks: { row: 1, col: 'A' },
      erows: [3],
      markList: ['@', alias],
      aliasColumns: [],
      getValue: (_table: any, row: number, col: string) => cells[row]?.[col],
      data: {
        3: {
          A: { w: 'row-1' },
          B: { v: rowValue }
        }
      }
    }
  }

  it('serializes bigint strategy columns as strings', () => {
    buildSchemaModelSpy.mockReturnValue({
      kind: 'object',
      fields: [
        {
          name: 'value',
          type: {
            kind: 'primitive',
            name: 'number',
            hintMeta: { strategyHint: 'bigint', sourceAlias: 'int64' }
          }
        }
      ]
    } as any)

    const table = makeTable('9223372036854775807')
    const ret = tableConvert(table, { policy: { tidConflict: 'error' } })
    const payload = ret.convert!.result['row-1']
    expect(payload.value).toBe('9223372036854775807')
  })

  it('throws descriptive error when safe-int guard fails', () => {
    buildSchemaModelSpy.mockReturnValue({
      kind: 'object',
      fields: [
        {
          name: 'value',
          type: {
            kind: 'primitive',
            name: 'number',
            hintMeta: { strategyHint: 'int', sourceAlias: 'int32' }
          }
        }
      ]
    } as any)

    const table = makeTable('9007199254740993', 'int32')
    try {
      tableConvert(table, { policy: { tidConflict: 'error' } })
      throw new Error('expected tableConvert to throw for unsafe integer')
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('expected tableConvert')) {
        throw error
      }
      expect((error as Error).message).toMatch(/int32/)
      expect((error as Error).message).toMatch(/exceeds Number\.MAX_SAFE_INTEGER/)
    }
  })
})
