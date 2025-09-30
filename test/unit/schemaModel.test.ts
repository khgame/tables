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
})
