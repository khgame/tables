jest.mock('../../src/serializer/core/schemaModel', () => {
  const buildSchemaModel = jest.fn()
  return {
    buildSchemaModel,
    isEmptyArray: (node: any) => node.kind === 'array' && node.empty === true,
    isUnion: (node: any) => node.kind === 'union'
  }
})

const { buildSchemaModel } = require('../../src/serializer/core/schemaModel') as { buildSchemaModel: jest.Mock }
const { goSerializer } = require('../../src/serializer/formats/go')

describe('go serializer type mapping', () => {
  beforeEach(() => {
    buildSchemaModel.mockReset()
  })

  function run(typeNode: any) {
    buildSchemaModel.mockReturnValueOnce(typeNode)
    return goSerializer.file({ schema: {}, descLine: {}, markCols: [] } as any, 'test_table', '', {})
  }

  it('renders optional scalars as pointer fields', () => {
    const fieldType = {
      kind: 'union',
      variants: [
        { kind: 'primitive', name: 'boolean' },
        { kind: 'primitive', name: 'undefined' }
      ]
    }
    const code = run({
      kind: 'object',
      fields: [{ name: 'flag', type: fieldType }]
    })
    expect(code).toContain('type TestTable struct')
    expect(code).toContain('Flag *bool `json:"flag,omitempty"`')
  })

  it('keeps interface{} when optional variant already interface{}', () => {
    const fieldType = {
      kind: 'union',
      variants: [
        { kind: 'primitive', name: 'any' },
        { kind: 'primitive', name: 'undefined' }
      ]
    }
    const code = run({
      kind: 'object',
      fields: [{ name: 'data', type: fieldType }]
    })
    expect(code).toContain('Data interface{} `json:"data,omitempty"`')
  })

  it('simplifies homogeneous unions to basic Go types', () => {
    const union = {
      kind: 'union',
      variants: [
        { kind: 'primitive', name: 'string' },
        { kind: 'literal', value: 'hello' }
      ]
    }
    const code = run({
      kind: 'object',
      fields: [{ name: 'name', type: union }]
    })
    expect(code).toContain('Name string `json:"name"`')
  })

  it('degrades heterogeneous unions to interface{}', () => {
    const union = {
      kind: 'union',
      variants: [
        { kind: 'primitive', name: 'number' },
        { kind: 'primitive', name: 'boolean' }
      ]
    }
    const code = run({
      kind: 'object',
      fields: [{ name: 'value', type: union }]
    })
    expect(code).toContain('Value interface{} `json:"value"`')
  })

  it('emits non-object roots directly', () => {
    const arrayNode = { kind: 'array', element: { kind: 'primitive', name: 'number' } }
    const code = run(arrayNode)
    expect(code).toContain('type TestTable []float64')
  })
})
