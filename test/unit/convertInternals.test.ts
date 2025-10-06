import {
  computeAliasInfo,
  type AliasComputationInput,
  normalizePrimitive,
  normalizeValue
} from '../../src/plugin/convertInternals'

describe('convert internals', () => {
  describe('normalizePrimitive', () => {
    const bigintNode = {
      kind: 'primitive',
      name: 'number',
      hintMeta: { strategyHint: 'bigint', sourceAlias: 'int64' }
    } as const

    const intNode = {
      kind: 'primitive',
      name: 'number',
      hintMeta: { strategyHint: 'int', sourceAlias: 'int32' }
    } as const

    it('handles bigint strategy for different primitives', () => {
      expect(normalizePrimitive(undefined, bigintNode as any, 'value')).toBeUndefined()
      expect(normalizePrimitive('123', bigintNode as any, 'value')).toBe('123')
      expect(normalizePrimitive(123n, bigintNode as any, 'value')).toBe('123')
    })

    it('throws when bigint receives non-primitive', () => {
      expect(() => normalizePrimitive({ raw: 1 }, bigintNode as any, 'value')).toThrow(/BigInt preservation/)
    })

    it('coerces int strategy for numbers and numeric strings', () => {
      expect(normalizePrimitive(42, intNode as any, 'path')).toBe(42)
      expect(normalizePrimitive(' 7 ', intNode as any, 'path')).toBe(7)
      expect(normalizePrimitive('', intNode as any, 'path')).toBe('')
    })

    it('rejects overflow for int strategy', () => {
      expect(() => normalizePrimitive(Number.MAX_SAFE_INTEGER + 1, intNode as any, 'path')).toThrow(/Number.MAX_SAFE_INTEGER/)
      expect(() => normalizePrimitive('9007199254740993', intNode as any, 'path')).toThrow(/Number.MAX_SAFE_INTEGER/)
    })

    it('default strategy returns original value', () => {
      const noHint = { kind: 'primitive', name: 'string' } as any
      expect(normalizePrimitive('text', noHint, 'path')).toBe('text')
    })
  })

  describe('normalizeValue', () => {
    it('delegates primitive and literal/enum branches', () => {
      const primitiveNode = { kind: 'primitive', name: 'number', hintMeta: { strategyHint: 'int', sourceAlias: 'int' } } as any
      expect(normalizeValue(10, primitiveNode, 'value')).toBe(10)
      const literalNode = { kind: 'literal', value: true } as any
      expect(normalizeValue(false, literalNode, 'flag')).toBe(false)
      const enumNode = { kind: 'enum', name: 'Role', ref: 'Role', values: [] } as any
      expect(normalizeValue('Mage', enumNode, 'role')).toBe('Mage')
    })

    it('normalizes objects and arrays recursively', () => {
      const schema = {
        kind: 'object',
        fields: [
          { name: 'nested', type: { kind: 'primitive', name: 'string' } },
          {
            name: 'list',
            type: { kind: 'array', element: { kind: 'primitive', name: 'number', hintMeta: { strategyHint: 'int', sourceAlias: 'int' } } }
          }
        ]
      } as any
      const value = { nested: 'ok', list: ['1', '2'] }
      const normalized = normalizeValue(value, schema, 'root')
      expect(normalized.list).toEqual([1, 2])
    })

    it('returns original value when object or array guards fail', () => {
      const objectNode = { kind: 'object', fields: [{ name: 'x', type: { kind: 'primitive', name: 'string' } }] } as any
      expect(normalizeValue('plain', objectNode, 'root')).toBe('plain')

      const arrayNode = { kind: 'array', element: { kind: 'primitive', name: 'string' } } as any
      expect(normalizeValue('not-array', arrayNode, 'arr')).toBe('not-array')

      const tupleNode = { kind: 'tuple', elements: [{ kind: 'primitive', name: 'string' }] } as any
      expect(normalizeValue('not-tuple', tupleNode, 'tuple')).toBe('not-tuple')
    })

    it('skips missing object fields when normalizing', () => {
      const objectNode = {
        kind: 'object',
        fields: [{ name: 'exists', type: { kind: 'primitive', name: 'string' } }]
      } as any
      const value = { other: 'noop' }
      const normalized = normalizeValue(value, objectNode, 'root')
      expect(normalized.other).toBe('noop')
      expect('exists' in normalized).toBe(false)
    })

    it('handles arrays without element definition and tuples', () => {
      const arrayNode = { kind: 'array', empty: false } as any
      const tupleNode = { kind: 'tuple', elements: [{ kind: 'primitive', name: 'string' }] } as any
      const bare = [1, 2]
      expect(normalizeValue(bare, arrayNode, 'path')).toEqual(bare)
      expect(normalizeValue(['x'], tupleNode, 'tuple')).toEqual(['x'])
    })

    it('uses last tuple element as fallback', () => {
      const tupleNode = {
        kind: 'tuple',
        elements: [
          { kind: 'primitive', name: 'string' },
          { kind: 'primitive', name: 'number', hintMeta: { strategyHint: 'int', sourceAlias: 'int' } }
        ]
      } as any
      expect(normalizeValue(['v', '1', '2'], tupleNode, 'tuple')).toEqual(['v', 1, 2])
    })

    it('falls back to matching union variant and propagates numeric errors', () => {
      const unionNode = {
        kind: 'union',
        variants: [
          { kind: 'primitive', name: 'number', hintMeta: { strategyHint: 'int', sourceAlias: 'int' } },
          { kind: 'primitive', name: 'string' }
        ]
      } as any
      expect(normalizeValue('12', unionNode, 'union')).toBe(12)
      expect(() => normalizeValue(Number.MAX_SAFE_INTEGER + 1, unionNode, 'union')).toThrow(/Number.MAX_SAFE_INTEGER/)
    })

    it('returns original value when union variants are exhausted', () => {
      const unionEmpty = { kind: 'union', variants: [] } as any
      expect(normalizeValue('raw', unionEmpty, 'union')).toBe('raw')
    })

    it('continues union evaluation when non-numeric errors occur', () => {
      const unionMixed = {
        kind: 'union',
        variants: [
          { kind: 'primitive', name: 'number', hintMeta: { strategyHint: 'bigint', sourceAlias: 'int64' } },
          { kind: 'primitive', name: 'string' }
        ]
      } as any
      expect(normalizeValue({ value: 1 }, unionMixed, 'union')).toEqual({ value: 1 })
    })

    it('returns value when node kind is unknown', () => {
      const mystery = { kind: 'mystery' } as any
      const obj = { foo: 'bar' }
      expect(normalizeValue(obj, mystery, 'path')).toBe(obj)
    })
  })

  describe('computeAliasInfo', () => {
    function baseInput(overrides: Partial<AliasComputationInput>): AliasComputationInput {
      return {
        aliasColumns: [1],
        descList: ['id', 'alias'],
        markCols: ['A', 'B'],
        convertedRows: [['hero', 'Alpha']],
        tids: ['hero'],
        tableName: 'Heroes',
        ...overrides
      }
    }

    it('returns null when alias columns absent', () => {
      expect(computeAliasInfo(baseInput({ aliasColumns: [] }))).toBeNull()
      expect(computeAliasInfo(baseInput({ aliasColumns: undefined as any }))).toBeNull()
    })

    it('throws for multiple aliases and missing descriptors', () => {
      expect(() => computeAliasInfo(baseInput({ aliasColumns: [1, 2] }))).toThrow(/暂不支持多个 alias 列/)
      expect(() => computeAliasInfo(baseInput({ descList: ['id', ''] }))).toThrow(/描述行为空/)
    })

    it('throws when alias values collide across tids', () => {
      const rows = [
        ['hero', 'Alpha'],
        ['villain', 'Alpha']
      ]
      expect(() => computeAliasInfo(baseInput({ convertedRows: rows, tids: ['hero', 'villain'] }))).toThrow(/重复别名/)
    })

    it('builds alias maps when values are unique', () => {
      const result = computeAliasInfo(baseInput({}))
      expect(result).not.toBeNull()
      expect(result?.aliases.alias.field).toBe('alias')
      expect(result?.indexes.alias.Alpha).toBe('hero')
      expect(result?.meta.values).toEqual(['Alpha'])
    })

    it('ignores empty rows and null aliases while scanning', () => {
      const input = baseInput({
        convertedRows: [null as any, ['hero', null], ['hero', '']],
        tids: ['hero', 'hero', 'hero']
      })
      const result = computeAliasInfo(input)
      expect(result?.meta.values).toEqual([])
    })
  })
})
    it('passes through object nodes without explicit fields', () => {
      const node = { kind: 'object' } as any
      const payload = { untouched: true }
      expect(normalizeValue(payload, node, 'root')).toEqual(payload)
    })
