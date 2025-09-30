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

  it('renders empty arrays as []interface{}', () => {
    const code = run({
      kind: 'object',
      fields: [{ name: 'items', type: { kind: 'array', empty: true } }]
    })
    expect(code).toContain('Items []interface{} `json:"items"`')
  })

  it('renders homogeneous tuples as typed slices', () => {
    const tuple = {
      kind: 'tuple',
      elements: [
        { kind: 'primitive', name: 'number' },
        { kind: 'primitive', name: 'number' }
      ]
    }
    const code = run({
      kind: 'object',
      fields: [{ name: 'coords', type: tuple }]
    })
    expect(code).toContain('Coords []float64 `json:"coords"`')
  })

  it('renders heterogeneous tuples as []interface{}', () => {
    const tuple = {
      kind: 'tuple',
      elements: [
        { kind: 'primitive', name: 'number' },
        { kind: 'primitive', name: 'string' }
      ]
    }
    const code = run({
      kind: 'object',
      fields: [{ name: 'values', type: tuple }]
    })
    expect(code).toContain('Values []interface{} `json:"values"`')
  })

  it('maps all-boolean unions to bool', () => {
    const union = {
      kind: 'union',
      variants: [
        { kind: 'primitive', name: 'boolean' },
        { kind: 'literal', value: true }
      ]
    }
    const code = run({
      kind: 'object',
      fields: [{ name: 'active', type: union }]
    })
    expect(code).toContain('Active bool `json:"active"`')
  })

  it('maps all-number unions to float64', () => {
    const union = {
      kind: 'union',
      variants: [
        { kind: 'primitive', name: 'number' },
        { kind: 'literal', value: 1 }
      ]
    }
    const code = run({
      kind: 'object',
      fields: [{ name: 'score', type: union }]
    })
    expect(code).toContain('Score float64 `json:"score"`')
  })

  it('falls back to interface{} for undefined primitives at root', () => {
    const code = run({ kind: 'primitive', name: 'undefined' })
    expect(code).toContain('type TestTable interface{}')
  })

  it('uses fallback type name when source is unusable', () => {
    buildSchemaModel.mockReturnValueOnce({ kind: 'primitive', name: 'string' })
    const code = goSerializer.file({ schema: {}, descLine: {}, markCols: [] } as any, '!!!', '', {})
    expect(code).toContain('type Record string')
  })

  it('renders literal numbers as float64', () => {
    const code = run({ kind: 'literal', value: 42 })
    expect(code).toContain('type TestTable float64')
  })

  it('renders literal booleans as bool', () => {
    const code = run({ kind: 'literal', value: true })
    expect(code).toContain('type TestTable bool')
  })

  it('renders empty structs when object has no fields', () => {
    const code = run({ kind: 'object', fields: [] })
    expect(code).toContain('struct{}')
  })

  it('renders arrays with missing element metadata as interface slices', () => {
    const code = run({ kind: 'object', fields: [{ name: 'items', type: { kind: 'array' } }] })
    expect(code).toContain('Items []interface{} `json:"items"`')
  })
})
