import * as Path from 'path'
import * as fs from 'fs-extra'
import * as os from 'os'

jest.mock('../../src/utils/read', () => ({
  readAndTranslate: jest.fn(() => ({
    cols: [],
    data: {},
    getValue: () => undefined
  }))
}))

import { buildStableConvertPayload, serialize, inspectTableFile, validateTableFile, loadContext, loadContextPath, serializeContext, parseValidationErrorContext, validateContextReferences } from '../../src/serializer'
import { createConvertError } from '../../src/plugin/validationError'
import type { Serializer } from '../../src/types'

const { readAndTranslate } = require('../../src/utils/read') as { readAndTranslate: jest.Mock }

function makeTempDir(): string {
  return fs.mkdtempSync(Path.join(os.tmpdir(), 'tables-serializer-'))
}

describe('serializer core helpers', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = makeTempDir()
    readAndTranslate.mockClear()
  })

  afterEach(() => {
    fs.removeSync(tmpDir)
  })

  it('serialize delegates to readAndTranslate and writes files', () => {
    const tableStub = { cols: [], data: {}, getValue: () => undefined }
    readAndTranslate.mockReturnValueOnce(tableStub)

    const plugin = jest.fn((table: any) => table)
    const fileWriter = jest.fn(() => 'serialized-content')
    const serializer: Serializer = {
      plugins: [plugin],
      file: fileWriter
    }

    const output = Path.join(tmpDir, 'out')
    serialize(Path.join(tmpDir, 'dummy.xlsx'), output, { 'result.json': serializer }, { ctx: true } as any)

    expect(readAndTranslate).toHaveBeenCalledTimes(1)
    const [, optionsArg, contextArg] = readAndTranslate.mock.calls[0]
    expect(Array.isArray(optionsArg.plugins)).toBe(true)
    expect(optionsArg.plugins).toHaveLength(1)
    expect(optionsArg.plugins[0]).toBe(plugin)
    expect(contextArg).toEqual({ ctx: true })
    expect(fileWriter).toHaveBeenCalledWith(tableStub, 'dummy', expect.any(String), { ctx: true })

    const written = fs.readFileSync(Path.join(output, 'result.json'), 'utf8')
    expect(written).toBe('serialized-content')
  })

  it('loadContext merges blobs from context json files', () => {
    const ctxDir = Path.join(tmpDir, 'ctx')
    fs.ensureDirSync(ctxDir)
    fs.writeJsonSync(Path.join(ctxDir, 'context.enums.json'), { Colors: { Red: 1 } })
    fs.writeJsonSync(Path.join(ctxDir, 'context.enums.roles.json'), { Roles: { Tank: 2 } })

    const context = loadContext(ctxDir)
    expect(context.enums).toBeDefined()
    expect(context.enums.Colors).toEqual({ Red: 1 })
    expect(context.enums.Roles).toEqual({ Tank: 2 })
  })

  it('loadContextPath loads directories and context json files', () => {
    const ctxDir = Path.join(tmpDir, 'ctx-path')
    fs.ensureDirSync(ctxDir)
    fs.writeJsonSync(Path.join(ctxDir, 'context.enums.json'), { Colors: { Red: 1 } })
    fs.writeJsonSync(Path.join(ctxDir, 'context.policy.json'), { tidConflict: 'ignore' })

    expect(loadContextPath(ctxDir)).toMatchObject({
      enums: { Colors: { Red: 1 } },
      policy: { tidConflict: 'ignore' }
    })
    expect(loadContextPath(Path.join(ctxDir, 'context.enums.json'))).toEqual({
      enums: { Colors: { Red: 1 } }
    })
  })

  it('loadContextPath preserves plain json context files', () => {
    const contextFile = Path.join(tmpDir, 'custom-context.json')
    fs.writeJsonSync(contextFile, {
      enums: {
        Colors: {
          Red: 1
        }
      },
      policy: {
        tidConflict: 'ignore'
      }
    })

    expect(loadContextPath(contextFile)).toEqual({
      enums: {
        Colors: {
          Red: 1
        }
      },
      policy: {
        tidConflict: 'ignore'
      }
    })
  })

  it('validateContextReferences loads context paths without mutating enum refs', () => {
    const ctxDir = Path.join(tmpDir, 'ctx-refs')
    fs.ensureDirSync(ctxDir)
    fs.writeJsonSync(Path.join(ctxDir, 'context.enums.json'), {
      Broken: [
        { ref: { table: 'missing.csv', field: 'alias' } }
      ]
    })

    const result = validateContextReferences(ctxDir)

    expect(result).toMatchObject({
      success: false,
      references: [{
        enumName: 'Broken',
        diagnosticPath: 'context.enums.Broken[0]',
        table: 'missing.csv',
        field: 'alias'
      }],
      errors: [{
        severity: 'error',
        code: 'context_ref_error',
        diagnosticPath: 'context.enums.Broken[0]',
        details: {
          enumName: 'Broken',
          table: 'missing.csv',
          field: 'alias'
        }
      }],
      warnings: []
    })
  })

  it('validateContextReferences returns structured errors for unreadable context files', () => {
    const contextFile = Path.join(tmpDir, 'broken-context.json')
    fs.outputFileSync(contextFile, '{bad json')

    const result = validateContextReferences(contextFile)

    expect(result).toEqual({
      success: false,
      references: [],
      errors: [{
        severity: 'error',
        code: 'context_ref_error',
        message: 'context path could not be loaded: broken-context.json',
        diagnosticPath: 'context',
        details: {
          path: 'broken-context.json'
        }
      }],
      warnings: []
    })
  })

  it('serializeContext writes combined context dealers', () => {
    const ctxOut = Path.join(tmpDir, 'ctx-out')
    fs.ensureDirSync(ctxOut)
    const dealer = jest.fn(() => 'export const stub = 42;')
    const serializerWithContext: Serializer = {
      file: jest.fn(() => ''),
      contextDealer: dealer
    }

    serializeContext(ctxOut, [serializerWithContext], { any: 'thing' })
    expect(dealer).toHaveBeenCalledWith({ any: 'thing' })
    const contextTs = fs.readFileSync(Path.join(ctxOut, 'context.ts'), 'utf8')
    expect(contextTs).toContain('TABLE_CONTEXT_VERSION')
    expect(contextTs).toContain('export const stub = 42;')
  })

  it('serializeContext deduplicates shared context dealers', () => {
    const ctxOut = Path.join(tmpDir, 'ctx-out-dedup')
    fs.ensureDirSync(ctxOut)
    const dealer = jest.fn(() => 'export const onlyOnce = true;')
    const serializers: Serializer[] = [
      { file: jest.fn(() => ''), contextDealer: dealer },
      { file: jest.fn(() => ''), contextDealer: dealer }
    ]

    serializeContext(ctxOut, serializers, { flag: 1 })
    expect(dealer).toHaveBeenCalledTimes(1)
  })

  it('serialize deduplicates shared serializer plugins', () => {
    const tableStub = { cols: [], data: {}, getValue: () => undefined }
    readAndTranslate.mockReturnValueOnce(tableStub)
    const plugin = jest.fn((table: any) => table)
    const firstSerializer: Serializer = {
      plugins: [plugin],
      file: jest.fn(() => 'first')
    }
    const secondSerializer: Serializer = {
      plugins: [plugin],
      file: jest.fn(() => 'second')
    }

    serialize(Path.join(tmpDir, 'dummy.xlsx'), Path.join(tmpDir, 'out'), {
      'first.json': firstSerializer,
      'second.json': secondSerializer
    })

    const [, optionsArg] = readAndTranslate.mock.calls[0]
    expect(optionsArg.plugins).toEqual([plugin])
  })

  it('serialize restores table metadata on serializer failure', () => {
    const tableStub = { cols: [], data: {}, getValue: () => undefined }
    readAndTranslate.mockReturnValueOnce(tableStub)
    const context: any = {
      __table: {
        fileName: 'previous',
        camelName: 'Previous',
        interfaceName: 'IPrevious'
      }
    }
    const serializer: Serializer = {
      file: jest.fn(() => {
        throw new Error('writer failed')
      })
    }

    expect(() => {
      serialize(Path.join(tmpDir, 'dummy.xlsx'), Path.join(tmpDir, 'out'), { 'broken.json': serializer }, context)
    }).toThrow('writer failed')
    expect(context.__table).toEqual({
      fileName: 'previous',
      camelName: 'Previous',
      interfaceName: 'IPrevious'
    })
  })

  it('inspectTableFile summarizes parse and convert diagnostics', () => {
    const tableStub = {
      cols: ['A', 'B'],
      data: {},
      sheetName: '__data',
      marks: { row: 1, col: 'A' },
      markCols: ['A', 'B'],
      descLine: { A: 'id', B: 'name' },
      schema: {},
      convert: {
        tids: ['hero'],
        result: { hero: { _tid: 'hero', name: 'Hero' } },
        collisions: [],
        indexes: { byName: { Hero: 'hero' } },
        aliases: { nameAlias: { field: 'name', map: { Hero: 'hero' } } },
        meta: { idSegments: [0], markCols: ['A', 'B'] }
      },
      getValue: () => undefined
    }
    readAndTranslate.mockReturnValueOnce(tableStub)

    const diagnostics = inspectTableFile(Path.join(tmpDir, 'dummy.xlsx'), { sheetName: '__data' }, { ctx: true } as any)

    expect(readAndTranslate).toHaveBeenCalledTimes(1)
    const [, optionsArg] = readAndTranslate.mock.calls[0]
    expect(optionsArg.sheetName).toBe('__data')
    expect(optionsArg.plugins).toHaveLength(1)
    expect(diagnostics).toMatchObject({
      fileName: 'dummy',
      sheetName: '__data',
      marks: { row: 1, col: 'A' },
      markCols: ['A', 'B'],
      descLine: { A: 'id', B: 'name' },
      schema: { present: true },
      convert: {
        present: true,
        tidCount: 1,
        resultCount: 1,
        collisionCount: 0,
        indexCount: 1,
        aliasCount: 1,
        meta: { idSegments: [0], markCols: ['A', 'B'] }
      }
    })
    expect(diagnostics.schema.model).toBeDefined()
  })

  it('inspectTableFile returns schema diagnostics when convert fails', () => {
    const tableStub = {
      cols: ['A'],
      data: {},
      sheetName: '__data',
      marks: { row: 1, col: 'A' },
      markCols: ['A'],
      descLine: { A: 'id' },
      schema: {},
      getValue: () => undefined
    }
    readAndTranslate.mockReturnValueOnce(tableStub)

    const diagnostics = inspectTableFile(Path.join(tmpDir, 'broken.xlsx'))

    expect(diagnostics.schema.present).toBe(true)
    expect(diagnostics.convert).toMatchObject({
      present: false,
      tidCount: 0,
      resultCount: 0,
      error: expect.any(String)
    })
  })

  it('inspectTableFile carries structured convert error metadata', () => {
    const tableStub = {
      cols: ['A', 'B'],
      data: {
        3: {
          B: { v: 'Potion', w: 'Potion' }
        }
      },
      sheetName: '__data',
      marks: { row: 1, col: 'A' },
      markCols: ['A', 'B'],
      descLine: { A: 'id', B: 'name' },
      markLine: { A: '@', B: 'string' },
      erows: [1, 2, 3],
      markList: ['@', 'string'],
      aliasColumns: [],
      schema: {},
      getValue: (table: any, row: number, col: string) => table.data[row]?.[col]?.v
    }
    readAndTranslate.mockReturnValueOnce(tableStub)

    const diagnostics = inspectTableFile(Path.join(tmpDir, 'blank_tid.xlsx'))

    expect(diagnostics.convert.errorMeta).toEqual({
      code: 'missing_tid_segment',
      location: {
        row: 3,
        column: 'A'
      },
      details: {
        tableName: 'blank_tid'
      }
    })
  })

  it('validateTableFile returns success with inspect diagnostics', () => {
    const tableStub = {
      cols: ['A'],
      data: {
        3: {
          A: { v: 'hero', w: 'hero' }
        }
      },
      sheetName: '__data',
      marks: { row: 1, col: 'A' },
      markCols: ['A'],
      descLine: { A: 'id' },
      markLine: { A: '@' },
      erows: [1, 2, 3],
      markList: ['@'],
      aliasColumns: [],
      schema: {},
      convert: {
        tids: ['hero'],
        result: { hero: { _tid: 'hero' } },
        collisions: [],
        indexes: {},
        aliases: {}
      },
      getValue: (table: any, row: number, col: string) => table.data[row]?.[col]?.v
    }
    readAndTranslate.mockReturnValueOnce(tableStub)

    const result = validateTableFile(Path.join(tmpDir, 'valid.xlsx'))

    expect(result).toMatchObject({
      success: true,
      fileName: 'valid',
      sheetName: '__data',
      errors: [],
      warnings: [],
      diagnostics: {
        convert: {
          present: true,
          tidCount: 1,
          collisionCount: 0
        }
      }
    })
  })

  it('validateTableFile maps TID collision convert errors to tid_collision', () => {
    const tableStub = {
      cols: ['A'],
      data: {
        3: {
          A: { v: 'hero', w: 'hero' }
        },
        4: {
          A: { v: 'hero', w: 'hero' }
        }
      },
      sheetName: '__data',
      marks: { row: 1, col: 'A' },
      markCols: ['A'],
      descLine: { A: 'id' },
      markLine: { A: '@' },
      erows: [1, 2, 3, 4],
      markList: ['@'],
      aliasColumns: [],
      schema: {},
      getValue: (table: any, row: number, col: string) => table.data[row]?.[col]?.v
    }
    readAndTranslate.mockReturnValueOnce(tableStub)

    const result = validateTableFile(Path.join(tmpDir, 'dupe.xlsx'))

    expect(result.success).toBe(false)
    expect(result.errors).toEqual([expect.objectContaining({
      severity: 'error',
      code: 'tid_collision',
      diagnosticPath: 'convert.error',
      location: { sheetName: '__data' },
      details: expect.objectContaining({
        tid: 'hero',
        policyPath: 'context.policy.tidConflict',
        allowedPolicies: ['overwrite', 'ignore', 'merge']
      })
    })])
  })

  it('validateTableFile adds row and column context for missing TID segments', () => {
    const tableStub = {
      cols: ['A', 'B'],
      data: {
        3: {
          B: { v: 'Potion', w: 'Potion' }
        }
      },
      sheetName: '__data',
      marks: { row: 1, col: 'A' },
      markCols: ['A', 'B'],
      descLine: { A: 'id', B: 'name' },
      markLine: { A: '@', B: 'string' },
      erows: [1, 2, 3],
      markList: ['@', 'string'],
      aliasColumns: [],
      schema: {},
      getValue: (table: any, row: number, col: string) => table.data[row]?.[col]?.v
    }
    readAndTranslate.mockReturnValueOnce(tableStub)

    const result = validateTableFile(Path.join(tmpDir, 'blank_tid.xlsx'))

    expect(result.success).toBe(false)
    expect(result.errors).toEqual([expect.objectContaining({
      severity: 'error',
      code: 'convert_error',
      diagnosticPath: 'convert.error',
      location: {
        sheetName: '__data',
        row: 3,
        column: 'A'
      },
      details: {
        tableName: 'blank_tid'
      }
    })])
  })

  it('parseValidationErrorContext keeps dotted TIDs intact', () => {
    expect(parseValidationErrorContext(
      "[tables] TID collision detected for id item.001. Configure context.policy.tidConflict to 'overwrite'|'ignore'|'merge'.",
      { sheetName: '__data' }
    )).toEqual({
      location: {
        sheetName: '__data'
      },
      details: {
        tid: 'item.001',
        policyPath: 'context.policy.tidConflict',
        allowedPolicies: ['overwrite', 'ignore', 'merge']
      }
    })
  })

  it('parseValidationErrorContext extracts structured numeric and alias details', () => {
    expect(parseValidationErrorContext(
      '[tables] numeric value 9007199254740993 at Game[row 7].stats[0].power (alias: int64) exceeds Number.MAX_SAFE_INTEGER(9007199254740991). Consider using BigNum.',
      { sheetName: '__data', descLine: { A: 'id', B: 'stats' } }
    )).toEqual({
      location: {
        sheetName: '__data',
        row: 7,
        column: 'B',
        fieldPath: 'stats[0].power'
      },
      details: {
        rawValue: '9007199254740993',
        convertPath: 'Game[row 7].stats[0].power',
        maxSafeInteger: 9007199254740991,
        suggestedType: 'BigNum',
        sourceAlias: 'int64',
        tableName: 'Game'
      }
    })

    expect(parseValidationErrorContext(
      '[tables] expected Game[row 8].payload.value (alias: int64) to be a numeric string for BigInt preservation, received object',
      { sheetName: '__data', descLine: { C: 'payload' } }
    )).toEqual({
      location: {
        sheetName: '__data',
        row: 8,
        column: 'C',
        fieldPath: 'payload.value'
      },
      details: {
        convertPath: 'Game[row 8].payload.value',
        expected: 'numeric_string',
        receivedType: 'object',
        sourceAlias: 'int64',
        tableName: 'Game'
      }
    })

    expect(parseValidationErrorContext(
      'alias 列对应的描述行为空，请为列 B 设置字段名',
      { sheetName: '__data' }
    )).toEqual({
      location: {
        sheetName: '__data',
        column: 'B'
      }
    })

    expect(parseValidationErrorContext(
      "[tables] 表 Game 的 alias 列 'name' 存在重复别名：Foo, Bar",
      { sheetName: '__data', descLine: { B: 'name' } }
    )).toEqual({
      location: {
        sheetName: '__data',
        column: 'B',
        fieldPath: 'name'
      },
      details: {
        tableName: 'Game',
        duplicateAliases: ['Foo', 'Bar']
      }
    })
  })

  it('parseValidationErrorContext prefers metadata over message parsing', () => {
    const error = createConvertError('[tables] custom non-parseable failure', {
      code: 'numeric_overflow',
      location: {
        row: 11,
        fieldPath: 'stats.power'
      },
      details: {
        convertPath: 'Game[row 11].stats.power',
        rawValue: '9007199254740993',
        maxSafeInteger: Number.MAX_SAFE_INTEGER,
        suggestedType: 'BigNum'
      }
    })

    expect(parseValidationErrorContext(
      error.message,
      { sheetName: '__data', descLine: { A: 'id', B: 'stats' } },
      error.convertErrorMeta
    )).toEqual({
      location: {
        sheetName: '__data',
        row: 11,
        column: 'B',
        fieldPath: 'stats.power'
      },
      details: {
        convertPath: 'Game[row 11].stats.power',
        rawValue: '9007199254740993',
        maxSafeInteger: Number.MAX_SAFE_INTEGER,
        suggestedType: 'BigNum',
        tableName: 'Game'
      }
    })
  })

  it('validateTableFile converts inspect failures into errors', () => {
    readAndTranslate.mockImplementationOnce(() => {
      throw new Error('cannot read workbook')
    })

    const result = validateTableFile(Path.join(tmpDir, 'broken.xlsx'))

    expect(result).toEqual({
      success: false,
      fileName: 'broken',
      errors: [{
        severity: 'error',
        code: 'inspect_error',
        message: 'cannot read workbook'
      }],
      warnings: []
    })
  })

  it('buildStableConvertPayload sorts result keys and preserves convert metadata by default', () => {
    const stable = buildStableConvertPayload({
      tids: ['b', 'a'],
      result: { b: { id: 2 }, a: { id: 1 } },
      meta: { idSegments: [0] },
      aliases: {},
      indexes: {}
    })

    expect(Object.keys(stable.result)).toEqual(['a', 'b'])
    expect(stable.meta).toEqual({ idSegments: [0] })
    expect(stable.aliases).toEqual({})
    expect(stable.indexes).toEqual({})
  })

  it('buildStableConvertPayload supports ts raw payload policy', () => {
    const stable = buildStableConvertPayload({
      tids: ['b', 'a'],
      result: { b: { id: 2 }, a: { id: 1 } },
      meta: { idSegments: [0] },
      aliases: {},
      indexes: { byGroup: { alpha: ['a'] } }
    }, {
      includeMeta: false,
      omitEmptyAliases: true,
      omitEmptyIndexes: true
    })

    expect(stable.meta).toBeUndefined()
    expect(stable.aliases).toBeUndefined()
    expect(stable.indexes).toEqual({ byGroup: { alpha: ['a'] } })
    expect(Object.keys(stable.result)).toEqual(['a', 'b'])
  })

  it('buildStableConvertPayload omits empty ts aliases and indexes from original payload', () => {
    const stable = buildStableConvertPayload({
      tids: ['a'],
      result: { a: { id: 1 } },
      meta: { idSegments: [0] },
      aliases: {},
      indexes: {}
    }, {
      includeMeta: false,
      omitEmptyAliases: true,
      omitEmptyIndexes: true
    })

    expect(stable).not.toHaveProperty('meta')
    expect(stable).not.toHaveProperty('aliases')
    expect(stable).not.toHaveProperty('indexes')
    expect(stable).toMatchObject({
      tids: ['a'],
      result: { a: { id: 1 } }
    })
  })

  it('loadContext reports malformed names, duplicate keys, and verbose summary', () => {
    const originalVerbose = process.env.TABLES_VERBOSE
    process.env.TABLES_VERBOSE = '1'
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

    try {
      const ctxDir = Path.join(tmpDir, 'ctx-verbose')
      fs.ensureDirSync(ctxDir)
      fs.writeJsonSync(Path.join(ctxDir, 'context..json'), { skip: true })
      fs.writeJsonSync(Path.join(ctxDir, 'context.enums.json'), { Colors: { Red: 1 } })
      fs.writeJsonSync(Path.join(ctxDir, 'context.enums.duplicate.json'), { Colors: { Blue: 2 } })

      const context = loadContext(ctxDir)
      expect(context.enums.Colors).toBeDefined()
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('format error'))
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('same name is already exist'))
      expect(logSpy).toHaveBeenCalledWith('context loaded:', ctxDir, expect.arrayContaining(['enums']))
    } finally {
      errorSpy.mockRestore()
      logSpy.mockRestore()
      if (originalVerbose === undefined) {
        delete process.env.TABLES_VERBOSE
      } else {
        process.env.TABLES_VERBOSE = originalVerbose
      }
    }
  })
})
