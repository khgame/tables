jest.mock('../../src/serializer/core/schemaModel', () => {
  const buildSchemaModel = jest.fn()
  return {
    buildSchemaModel,
    isEmptyArray: (node: any) => node.kind === 'array' && node.empty === true
  }
})

const { buildSchemaModel } = require('../../src/serializer/core/schemaModel') as { buildSchemaModel: jest.Mock }
const { csharpSerializer } = require('../../src/serializer/formats/csharp')

describe('csharp serializer type mapping', () => {
  beforeEach(() => {
    buildSchemaModel.mockReset()
  })

  function generate(typeNode: any, filename = 'test_table'): string {
    buildSchemaModel.mockReturnValueOnce(typeNode)
    return csharpSerializer.file({ schema: {}, descLine: {}, markCols: [] } as any, filename, '', {})
  }

  it('renders optional numeric fields as nullable value types', () => {
    const union = {
      kind: 'union',
      variants: [
        { kind: 'primitive', name: 'number' },
        { kind: 'primitive', name: 'undefined' }
      ]
    }
    const code = generate({
      kind: 'object',
      fields: [{ name: 'score', type: union }]
    })
    expect(code).toContain('public double? Score { get; set; }')
  })

  it('renders optional reference types with nullable annotations', () => {
    const obj = {
      kind: 'object',
      fields: [{ name: 'value', type: { kind: 'primitive', name: 'string' } }],
      style: 'block'
    }
    const union = {
      kind: 'union',
      variants: [obj, { kind: 'primitive', name: 'undefined' }]
    }
    const code = generate({
      kind: 'object',
      fields: [{ name: 'details', type: union }]
    })
    expect(code).toContain('public TestTableDetails? Details { get; set; }')
    expect(code).toContain('public string Value { get; set; }')
  })

  it('uses List for array types', () => {
    const arrayNode = {
      kind: 'array',
      element: { kind: 'primitive', name: 'number' }
    }
    const code = generate({
      kind: 'object',
      fields: [{ name: 'values', type: arrayNode }]
    })
    expect(code).toContain('using System.Collections.Generic;')
    expect(code).toContain('public List<double> Values { get; set; }')
  })

  it('degrades heterogeneous unions to object', () => {
    const union = {
      kind: 'union',
      variants: [
        { kind: 'primitive', name: 'number' },
        { kind: 'primitive', name: 'boolean' }
      ]
    }
    const code = generate({
      kind: 'object',
      fields: [{ name: 'value', type: union }]
    })
    expect(code).toContain('public object Value { get; set; }')
  })

  it('generates fallback class name when filename invalid', () => {
    buildSchemaModel.mockReturnValueOnce({ kind: 'primitive', name: 'string' })
    const code = csharpSerializer.file({ schema: {}, descLine: {}, markCols: [] } as any, '!!!', '', {})
    expect(code).toContain('public class Record')
  })

  it('renders literal booleans and numbers to concrete types', () => {
    const code = generate({ kind: 'object', fields: [
      { name: 'flag', type: { kind: 'literal', value: true } },
      { name: 'count', type: { kind: 'literal', value: 3 } }
    ] })
    expect(code).toContain('public bool Flag { get; set; }')
    expect(code).toContain('public double Count { get; set; }')
  })

  it('emits empty class when object has no fields', () => {
    const code = generate({ kind: 'object', fields: [] })
    expect(code).toContain('public class TestTable')
    expect(code).toContain('namespace Tables')
  })
})
