import { jsonSerializer, jsSerializer, tsSerializer } from '../../src/serializer'
// Mock dealSchema/dealContext before importing tsSerializer to avoid deep schema dependency
jest.mock('../../src/serializer/formats/tsInterface', () => ({
  dealSchema: () => '{ foo: string }',
  dealContext: () => ''
}))
// Import real helpers for focused tests (use requireActual)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const real = (jest as any).requireActual('../../src/serializer/formats/tsInterface')
const dealSchema = real.dealSchema as typeof import('../../src/serializer/formats/tsInterface').dealSchema
const dealContext = real.dealContext as typeof import('../../src/serializer/formats/tsInterface').dealContext
import { MarkType, SDMType, SupportedTypes } from '@khgame/schema'

describe('basic serializers', () => {
  const sample = { convert: { tids: ['id1'], result: { id1: { a: 1 } }, collisions: [] } } as any

  it('jsonSerializer returns pretty JSON', () => {
    const s = jsonSerializer.file(sample as any, 'x', '')
    expect(s.trim()).toBe(JSON.stringify(sample.convert, null, 2))
  })

  it('jsSerializer wraps module.exports =', () => {
    const s = jsSerializer.file(sample as any, 'x', '')
    expect(s.startsWith('module.exports = ')).toBe(true)
    expect(s.replace(/^module\.exports = /, '').trim()).toBe(JSON.stringify(sample.convert, null, 2))
  })
})

describe('tsSerializer formatting', () => {
  it('embeds interface name and data JSON', () => {
    // Stub data with minimal schema/lines (dealSchema is tested separately)
    const data: any = { schema: {}, descLine: {}, markCols: [], convert: { result: { id1: { a: 1 } } } }
    const out = tsSerializer.file(data, 'example', '//imports')
    expect(out).toContain('export interface IExample')
    expect(out).toContain('const raw = ') // includes JSON content
    expect(out).toContain('export const exampleTids = raw.tids;')
    expect(out).toContain('export const example: { [tid: string] : IExample }')
  })

  it('brands tids when metadata is available', () => {
    const data: any = {
      schema: {},
      descLine: {},
      markCols: [],
      convert: {
        result: { id1: { a: 1 } },
        tids: ['id1'],
        meta: { idSegments: [0], markCols: ['A'] }
      }
    }
    const out = tsSerializer.file(data, 'example', '//imports')
    expect(out).toContain('type ExampleTID = string')
    expect(out).toContain('const toExampleTID =')
    expect(out).toContain('export const example: Record<ExampleTID, IExample>')
  })
})

describe('tsInterfaceSerializer helpers', () => {
  it('dealSchema renders a simple object type', () => {
    // Craft a minimal schema AST: { name: string }
    const tdm = {
      markType: MarkType.TDM,
      markInd: 0,
      innerCount: 1,
      inner: (_i: number) => ({ tName: SupportedTypes.String, rawName: 'string' })
    }
    const schema = {
      sdmType: SDMType.Obj,
      marks: [tdm],
      mds: [],
      markInd: 1
    }
    const markCols = ['A']
    const descLine = { A: 'name' }
    const res = dealSchema(schema as any, descLine, markCols, {})
    expect(res.replace(/\s/g, '')).toBe('{name:string}'.replace(/\s/g, ''))
  })

  it('dealSchema emits verbose log when TABLES_VERBOSE=1', () => {
    const originalVerbose = process.env.TABLES_VERBOSE
    process.env.TABLES_VERBOSE = '1'
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    try {
      const schema = {
        sdmType: SDMType.Arr,
        marks: [],
        mds: [],
        markInd: 1
      }
      const markCols = ['A']
      const descLine = { A: 'value' }
      const result = dealSchema(schema as any, descLine, markCols, {})
      expect(result).toBe('[]')
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('tsInterface serializer dealSchema success'), expect.any(String))
    } finally {
      logSpy.mockRestore()
      if (originalVerbose === undefined) {
        delete process.env.TABLES_VERBOSE
      } else {
        process.env.TABLES_VERBOSE = originalVerbose
      }
    }
  })

  it('dealContext emits enums from context', () => {
    const ctx: any = { meta: { exports: { enum: ['enums'] } }, enums: { Colors: { Red: 1, Blue: 2 } } }
    const code = dealContext(ctx)
    expect(code).toContain('export enum Colors')
    expect(code).toContain('Red = 1')
    expect(code).toContain('Blue = 2')
  })

  it('dealContext throws when context blob missing', () => {
    const ctx: any = { meta: { exports: { enum: ['missing'] } }, enums: {} }
    expect(() => dealContext(ctx)).toThrow(/missing/i)
  })

  it('dealContext renders enum docs from tuple values', () => {
    const ctx: any = {
      meta: { exports: { enum: ['enums'] } },
      enums: {
        States: {
          Idle: [0, 'default state'],
          Run: [1]
        }
      }
    }
    const code = dealContext(ctx)
    expect(code).toContain('/** default state */')
    expect(code).toContain('Idle = 0')
    expect(code).toContain('Run = 1')
  })
})
