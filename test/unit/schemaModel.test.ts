import { buildSchemaModel } from '../../src/serializer/core/schemaModel'
import { MarkType, SDMType, SupportedTypes } from '@khgame/schema'

describe('schemaModel buildSchemaModel', () => {
  function makeTdm(kind: SupportedTypes, options: { rawName?: string; enumName?: string } = {}) {
    const node: any = { tName: kind, rawName: options.rawName ?? kind }
    if (kind === SupportedTypes.Enum) {
      node.tSeg = { nodes: [{ rawName: options.enumName || 'EnumName' }] }
    }
    if (kind === SupportedTypes.Array || kind === SupportedTypes.Pair) {
      node.tSeg = { nodes: [{ tName: SupportedTypes.String, rawName: 'string' }] }
      if (kind === SupportedTypes.Array) {
        node.innerCount = 1
      }
    }
    return {
      markType: MarkType.TDM,
      markInd: 0,
      innerCount: 1,
      inner: () => node
    }
  }

  it('marks non-strict arrays with origin metadata', () => {
    const schema = {
      sdmType: SDMType.Arr,
      marks: [makeTdm(SupportedTypes.String)],
      mds: [],
      markInd: 1
    }
    const model = buildSchemaModel(schema as any, { A: 'value' }, ['A'], {})
    expect(model.kind).toBe('array')
    if (model.kind === 'array') {
      expect(model.origin).toBe('sdm')
      expect(model.childCount).toBe(1)
    }
  })

  it('converts strict arrays into tuple nodes', () => {
    const tdmA = makeTdm(SupportedTypes.String)
    const tdmB = makeTdm(SupportedTypes.Int)
    const schema = {
      sdmType: SDMType.Arr,
      marks: [tdmA, tdmB],
      mds: ['$strict'],
      markInd: 1
    }
    const model = buildSchemaModel(schema as any, { A: 'value' }, ['A'], {})
    expect(model.kind).toBe('tuple')
  })

  it('produces empty arrays when no child survives undefined stripping', () => {
    const schema = {
      sdmType: SDMType.Arr,
      marks: [makeTdm(SupportedTypes.Undefined)],
      mds: [],
      markInd: 1
    }
    const model = buildSchemaModel(schema as any, { A: 'flag' }, ['A'], {})
    expect(model.kind).toBe('array')
    if (model.kind === 'array') {
      expect(model.empty).toBe(true)
      expect(model.childCount).toBe(0)
    }
  })

  it('retains union metadata for non-strict arrays with mixed children', () => {
    const stringTdm = {
      markType: MarkType.TDM,
      markInd: 0,
      innerCount: 1,
      inner: () => ({ tName: SupportedTypes.String, rawName: 'string' })
    }
    const numberTdm = {
      markType: MarkType.TDM,
      markInd: 1,
      innerCount: 1,
      inner: () => ({ tName: SupportedTypes.Int, rawName: 'int' })
    }
    const schema = {
      sdmType: SDMType.Arr,
      marks: [stringTdm, numberTdm],
      mds: [],
      markInd: 2
    }
    const model = buildSchemaModel(schema as any, { A: 'name', B: 'count' }, ['A', 'B'], {})
    expect(model.kind).toBe('array')
    if (model.kind === 'array') {
      expect(model.childCount).toBe(2)
      expect(model.element?.kind).toBe('union')
    }
  })

  it('wraps ghost objects with undefined for optional semantics', () => {
    const tdm = makeTdm(SupportedTypes.Boolean)
    const schema = {
      sdmType: SDMType.Obj,
      marks: [tdm],
      mds: ['$ghost'],
      markInd: 1
    }
    const model = buildSchemaModel(schema as any, { A: 'flag' }, ['A'], {})
    expect(model.kind).toBe('union')
    if (model.kind === 'union') {
      expect(model.variants.some(v => (v as any).name === 'undefined' || (v.kind === 'primitive' && v.name === 'undefined'))).toBe(true)
    }
  })

  it('emits enum references when context provides mapping', () => {
    const enumTdm = {
      markType: MarkType.TDM,
      markInd: 0,
      innerCount: 1,
      inner: () => ({
        tName: SupportedTypes.Enum,
        rawName: 'Color',
        tSeg: { nodes: [{ rawName: 'Color' }] }
      })
    }
    const schema = {
      sdmType: SDMType.Obj,
      marks: [enumTdm],
      mds: [],
      markInd: 1
    }
    const context = { enums: { Color: { Red: 1, Blue: 2 } } }
    const model = buildSchemaModel(schema as any, { A: 'color' }, ['A'], context)
    expect(model.kind).toBe('object')
    if (model.kind === 'object') {
      expect(model.fields[0].type.kind).toBe('enum')
    }
  })

  it('falls back to literal enum name when context blob missing', () => {
    const enumTdm = {
      markType: MarkType.TDM,
      markInd: 0,
      innerCount: 1,
      inner: () => ({
        tName: SupportedTypes.Enum,
        rawName: 'Color',
        tSeg: { nodes: [{ rawName: 'Color' }] }
      })
    }
    const schema = {
      sdmType: SDMType.Obj,
      marks: [enumTdm],
      mds: [],
      markInd: 1
    }
    const model = buildSchemaModel(schema as any, { A: 'color' }, ['A'], {})
    expect(model.kind).toBe('object')
    if (model.kind === 'object') {
      expect(model.fields[0].type.kind).toBe('literal')
    }
  })

  it('retains enum value descriptions when provided', () => {
    const enumTdm = {
      markType: MarkType.TDM,
      markInd: 0,
      innerCount: 1,
      inner: () => ({
        tName: SupportedTypes.Enum,
        rawName: 'State',
        tSeg: { nodes: [{ rawName: 'State' }] }
      })
    }
    const schema = {
      sdmType: SDMType.Obj,
      marks: [enumTdm],
      mds: [],
      markInd: 1
    }
    const context = { enums: { State: { Idle: [0, 'rest'], Run: 1 } } }
    const model = buildSchemaModel(schema as any, { A: 'state' }, ['A'], context)
    expect(model.kind).toBe('object')
    if (model.kind === 'object') {
      const enumType = model.fields[0].type
      expect(enumType.kind).toBe('enum')
      if (enumType.kind === 'enum') {
        const idle = enumType.values.find(v => v.name === 'Idle')
        expect(idle?.description).toBe('rest')
      }
    }
  })

  it('annotates primitive nodes with hint metadata for numeric aliases', () => {
    const int64Tdm = makeTdm(SupportedTypes.Int, { rawName: 'int64' })
    const uint32Tdm = makeTdm(SupportedTypes.UInt, { rawName: 'uint32' })
    const schema = {
      sdmType: SDMType.Obj,
      marks: [int64Tdm, uint32Tdm],
      mds: [],
      markInd: 1
    }
    const model = buildSchemaModel(schema as any, { A: 'damage', B: 'count' }, ['A', 'B'], {})
    expect(model.kind).toBe('object')
    if (model.kind === 'object') {
      const bigIntField = model.fields[0].type
      const safeIntField = model.fields[1].type
      expect(bigIntField.kind).toBe('primitive')
      expect((bigIntField as any).hintMeta?.strategyHint).toBe('bigint')
      expect((bigIntField as any).hintMeta?.sourceAlias).toBe('int64')
      expect(safeIntField.kind).toBe('primitive')
      expect((safeIntField as any).hintMeta?.strategyHint).toBe('int')
      expect((safeIntField as any).hintMeta?.sourceAlias).toBe('uint32')
    }
  })

  it('converts pair nodes into inline objects', () => {
    const pairTdm = {
      markType: MarkType.TDM,
      markInd: 0,
      innerCount: 1,
      inner: () => ({
        tName: SupportedTypes.Pair,
        rawName: 'pair',
        tSeg: { nodes: [{ tName: SupportedTypes.String, rawName: 'string' }] }
      })
    }
    const schema = {
      sdmType: SDMType.Obj,
      marks: [pairTdm],
      mds: [],
      markInd: 1
    }
    const model = buildSchemaModel(schema as any, { A: 'entry' }, ['A'], {})
    expect(model.kind).toBe('object')
    if (model.kind === 'object') {
      const fieldType = model.fields[0].type
      expect(fieldType.kind).toBe('object')
      if (fieldType.kind === 'object') {
        expect(fieldType.style).toBe('inline')
        expect(fieldType.fields.map(f => f.name)).toEqual(['key', 'val'])
      }
    }
  })

  it('defaults to primitive any for unsupported SDM types', () => {
    const schema = {
      sdmType: 999,
      marks: [],
      mds: [],
      markInd: 1
    }
    const model = buildSchemaModel(schema as any, {}, [], {})
    expect(model.kind).toBe('primitive')
    if (model.kind === 'primitive') {
      expect(model.name).toBe('any')
    }
  })

  it('defaults unknown mark nodes to primitive any', () => {
    const schema = {
      sdmType: SDMType.Arr,
      marks: [{ markType: 999, markInd: 0 }],
      mds: [],
      markInd: 1
    }
    const model = buildSchemaModel(schema as any, { A: 'misc' }, ['A'], {})
    expect(model.kind).toBe('array')
    if (model.kind === 'array') {
      expect(model.element?.kind).toBe('primitive')
      if (model.element?.kind === 'primitive') {
        expect(model.element.name).toBe('any')
      }
    }
  })

  it('marks strict ghost arrays as tuple | undefined', () => {
    const stringTdm = makeTdm(SupportedTypes.String)
    const schema = {
      sdmType: SDMType.Arr,
      marks: [stringTdm],
      mds: ['$strict', '$ghost'],
      markInd: 1
    }
    const model = buildSchemaModel(schema as any, { A: 'names' }, ['A'], {})
    expect(model.kind).toBe('union')
    if (model.kind === 'union') {
      expect(model.variants.some(v => v.kind === 'tuple')).toBe(true)
      expect(model.variants.some(v => v.kind === 'primitive' && v.name === 'undefined')).toBe(true)
    }
  })

  it('maps SupportedTypes.Any to primitive any', () => {
    const schema = {
      sdmType: SDMType.Obj,
      marks: [makeTdm(SupportedTypes.Any)],
      mds: [],
      markInd: 1
    }
    const model = buildSchemaModel(schema as any, { A: 'payload' }, ['A'], {})
    expect(model.kind).toBe('object')
    if (model.kind === 'object') {
      expect(model.fields[0].type.kind).toBe('primitive')
      if (model.fields[0].type.kind === 'primitive') {
        expect(model.fields[0].type.name).toBe('any')
      }
    }
  })

  it('falls back to literal when tName is unrecognised but rawName provided', () => {
    const customTdm = {
      markType: MarkType.TDM,
      markInd: 0,
      innerCount: 1,
      inner: () => ({ tName: 'Custom', rawName: 'raw_literal' })
    }
    const schema = {
      sdmType: SDMType.Obj,
      marks: [customTdm],
      mds: [],
      markInd: 1
    }
    const model = buildSchemaModel(schema as any, { A: 'value' }, ['A'], {})
    expect(model.kind).toBe('object')
    if (model.kind === 'object') {
      expect(model.fields[0].type.kind).toBe('literal')
      if (model.fields[0].type.kind === 'literal') {
        expect(model.fields[0].type.value).toBe('raw_literal')
      }
    }
  })

  it('returns primitive any when enum variant lacks rawName', () => {
    const enumTdm = {
      markType: MarkType.TDM,
      markInd: 0,
      innerCount: 1,
      inner: () => ({ tName: SupportedTypes.Enum, rawName: undefined, tSeg: { nodes: [{}] } })
    }
    const schema = {
      sdmType: SDMType.Obj,
      marks: [enumTdm],
      mds: [],
      markInd: 1
    }
    const model = buildSchemaModel(schema as any, { A: 'state' }, ['A'], {})
    expect(model.kind).toBe('object')
    if (model.kind === 'object') {
      expect(model.fields[0].type.kind).toBe('primitive')
      if (model.fields[0].type.kind === 'primitive') {
        expect(model.fields[0].type.name).toBe('any')
      }
    }
  })
})
