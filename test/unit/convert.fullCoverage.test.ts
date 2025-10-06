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
        payload.tupleField = [Number(row[0]?.length || 0), String(payload.title ?? '')]
        payload.unionField = payload.unionField ?? '21'
        payload.maybeUndefined = payload.maybeUndefined ?? null
        return payload
      })
    })
  }
})

import { tableConvert } from '../../src/plugin/convert'
import * as schemaModel from '../../src/serializer/core/schemaModel'
import * as khSchema from '@khgame/schema'

describe('tableConvert edge cases', () => {
  const exportJsonMock = khSchema.exportJson as jest.Mock
  const buildSchemaModelSpy = jest.spyOn(schemaModel, 'buildSchemaModel')

  afterEach(() => {
    exportJsonMock.mockClear()
    buildSchemaModelSpy.mockReset()
    delete process.env.TABLES_VERBOSE
  })

  afterAll(() => {
    buildSchemaModelSpy.mockRestore()
  })

  function makeBaseModel(): schemaModel.SchemaModel {
    const unionField: schemaModel.UnionType = {
      kind: 'union',
      variants: [
        { kind: 'primitive', name: 'number', hintMeta: { strategyHint: 'int', sourceAlias: 'int32' } },
        { kind: 'primitive', name: 'string' }
      ]
    }
    const optionalField: schemaModel.UnionType = {
      kind: 'union',
      variants: [
        { kind: 'primitive', name: 'undefined' },
        { kind: 'primitive', name: 'string' }
      ]
    }
    return {
      kind: 'union',
      variants: [
        {
          kind: 'object',
          fields: [
            { name: 'id', type: { kind: 'primitive', name: 'string' } },
            { name: 'alias', type: { kind: 'primitive', name: 'string' } },
            { name: 'title', type: { kind: 'primitive', name: 'string' } },
            {
              name: 'scores',
              type: {
                kind: 'array',
                element: { kind: 'primitive', name: 'number' },
                origin: 'tnode',
                representation: 'generic'
              }
            },
            {
              name: 'tupleField',
              type: { kind: 'tuple', elements: [{ kind: 'primitive', name: 'number' }, { kind: 'primitive', name: 'string' }] }
            },
            { name: 'unionField', type: unionField },
            { name: 'maybeUndefined', type: optionalField }
          ]
        },
        { kind: 'primitive', name: 'any' }
      ]
    }
  }

  function makeTable(overrides: Partial<any> = {}): any {
    const base = {
      schema: {},
      markCols: ['A', 'B', 'C', 'D', 'E'],
      markLine: { A: '@', B: '', C: 'string', D: '', E: '' },
      descLine: { A: 'id', B: 'alias', C: 'title', D: 'scores', E: 'unionField' },
      marks: { row: 1, col: 'A' },
      markList: ['@', '', 'string', '', 'int'],
      erows: [3, 4, 5],
      aliasColumns: [1],
      getValue: (_: any, row: number, col: string) => {
        const rowValues: Record<string, any> = {
          3: { A: ' hero ', B: 'Alpha', C: 789, D: [1, 2], E: '21' },
          4: { A: 'hero', B: 'Beta', C: 'Hero', D: [3], E: '900' },
          5: { A: 'bot', B: '', C: null, D: undefined, E: 2 }
        }
        const record = rowValues[row] || {}
        return record[col]
      },
      data: {
        3: { A: { w: ' hero ' } },
        4: { A: { v: 'hero' } },
        5: { A: { v: 'bot' } }
      }
    }
    return Object.assign({}, base, overrides)
  }

  it('throws when no tid marker column is present', () => {
    buildSchemaModelSpy.mockReturnValue(makeBaseModel())
    const table = makeTable({ markLine: { A: '', B: '', C: 'string', D: '', E: '' } })
    expect(() => tableConvert(table, {})).toThrow(/缺少 '@' 标记列/)
  })

  it('fails fast when tid segments are blank', () => {
    buildSchemaModelSpy.mockReturnValue(makeBaseModel())
    const rows: Record<number, Record<string, any>> = {
      3: { A: '', B: 'Alpha', C: 789, D: [1, 2], E: '21' },
      4: { A: 'hero', B: 'Beta', C: 'Hero', D: [3], E: '21' }
    }
    const table = makeTable({
      getValue: (_: any, row: number, col: string) => rows[row]?.[col],
      data: {
        3: { A: { w: ' ' } },
        4: { A: { v: 'hero' } }
      }
    })
    expect(() => tableConvert(table, {})).toThrow(/缺少 TID 数据/)
  })

  it('covers collision policies, alias/index meta, and normalization branches', () => {
    process.env.TABLES_VERBOSE = '1'
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    buildSchemaModelSpy.mockReturnValue(makeBaseModel())

    const dataContext = {
      policy: { tidConflict: 'merge' },
      indexes: {
        TestTable: [
          'id',
          { name: 'aliasIndex', column: 'alias', mode: 'multi', allowEmpty: true },
          { name: 'byTitle', column: 'title', caseInsensitive: true },
          { name: 'unionIndex', column: 'unionField', mode: 'multi' }
        ]
      },
      meta: {
        indexes: {
          '*': {
            passive: { column: 'alias', unique: false },
            emptySkip: { column: '', mode: 'unique' }
          }
        }
      },
      __table: { fileName: 'TestTable' }
    }

    exportJsonMock.mockImplementation((_schema: any, descList: string[], convertedRows: any[][]) => {
      return convertedRows.map((row, idx) => {
        const payload: Record<string, any> = {}
        descList.forEach((key, colIdx) => {
          payload[key] = row[colIdx]
        })
        payload.scores = Array.isArray(payload.scores) ? payload.scores : String(payload.scores ?? '').split('|').filter(Boolean).map(Number)
        payload.tupleField = [idx + 1, `${payload.title ?? ''}`]
        payload.unionField = idx === 1 ? '123' : (payload.unionField ?? '21')
        payload.maybeUndefined = idx === 2 ? undefined : 'present'
        if (idx === 1) {
          payload._tid = 'hero'
        }
        return payload
      })
    })

    const table = makeTable()
    const contextWithVerbose = { ...dataContext }
    const converted = tableConvert(table, contextWithVerbose)

    expect(converted.convert?.tids).toEqual(['hero', 'hero', 'bot'])
    expect(converted.convert?.collisions?.length).toBe(1)
    expect(converted.convert?.meta?.alias?.values).toContain('Alpha')
    expect(converted.convert?.indexes?.unionIndex).toBeDefined()
    expect(converted.convert?.result.hero.title).toBe('Hero')
    expect(Array.isArray(converted.convert?.result.bot)).toBe(false)

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('merge'))

    // overwrite branch
    buildSchemaModelSpy.mockReturnValue(makeBaseModel())
    const overwriteContext = { policy: { tidConflict: 'overwrite' } }
    tableConvert(makeTable(), overwriteContext)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('overwrite'))

    // ignore branch
    buildSchemaModelSpy.mockReturnValue(makeBaseModel())
    const ignoreContext = { policy: { tidConflict: 'ignore' } }
    tableConvert(makeTable(), ignoreContext)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('ignore'))

    // error branch
    buildSchemaModelSpy.mockReturnValue(makeBaseModel())
    expect(() => tableConvert(makeTable(), { policy: { tidConflict: 'error' } })).toThrow(/collision/i)

    warnSpy.mockRestore()
  })

  it('throws when alias column contains duplicates across tids', () => {
    buildSchemaModelSpy.mockReturnValue(makeBaseModel())
    exportJsonMock.mockImplementation((_schema: any, descList: string[], convertedRows: any[][]) => {
      return convertedRows.map(row => {
        const payload: Record<string, any> = {}
        descList.forEach((key, idx) => {
          payload[key] = row[idx]
        })
        return payload
      })
    })

    const table = makeTable({
      erows: [3, 4],
      getValue: (_: any, row: number, col: string) => {
        const map: Record<number, Record<string, any>> = {
          3: { A: 'hero', B: 'AliasDup', C: 'foo' },
          4: { A: 'villain', B: 'AliasDup', C: 'bar' }
        }
        return map[row]?.[col]
      },
      data: {
        3: { A: { v: 'hero' } },
        4: { A: { v: 'villain' } }
      }
    })

    expect(() => tableConvert(table, {})).toThrow(/重复别名/)
  })

  it('rethrows overflow errors encountered inside union normalization', () => {
    const overflowModel: schemaModel.SchemaModel = {
      kind: 'union',
      variants: [
        {
          kind: 'object',
          fields: [
            {
              name: 'value',
              type: {
                kind: 'union',
                variants: [
                  { kind: 'primitive', name: 'number', hintMeta: { strategyHint: 'int', sourceAlias: 'int32' } },
                  { kind: 'primitive', name: 'string' }
                ]
              }
            }
          ]
        }
      ]
    }

    buildSchemaModelSpy.mockReturnValue(overflowModel)
    exportJsonMock.mockImplementation((_schema: any, descList: string[], convertedRows: any[][]) => {
      return convertedRows.map(row => {
        const payload: Record<string, any> = {}
        descList.forEach((key, idx) => {
          payload[key] = row[idx]
        })
        return payload
      })
    })

    const table = makeTable({
      markCols: ['A', 'B'],
      markLine: { A: '@', B: '' },
      descLine: { A: 'id', B: 'value' },
      markList: ['@', 'int'],
      erows: [3],
      getValue: (_: any, row: number, col: string) => {
        if (row === 3 && col === 'A') return 'tid'
        if (row === 3 && col === 'B') return '9007199254740993'
        return undefined
      },
      data: { 3: { A: { v: 'tid' } } }
    })

    expect(() => tableConvert(table, {})).toThrow(/exceeds Number.MAX_SAFE_INTEGER/)
  })
})
