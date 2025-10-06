import * as tsInterfaceModule from '../../src/serializer/formats/tsInterface'
import { goSerializer } from '../../src/serializer/formats/go'
import { csharpSerializer } from '../../src/serializer/formats/csharp'
import * as schemaModel from '../../src/serializer/core/schemaModel'

const { tsInterfaceSerializer, dealContext } = tsInterfaceModule

describe('serializer format rendering coverage', () => {
  const buildSchemaModelSpy = jest.spyOn(schemaModel, 'buildSchemaModel')

  afterEach(() => {
    buildSchemaModelSpy.mockReset()
    delete process.env.TABLES_VERBOSE
  })

  afterAll(() => {
    buildSchemaModelSpy.mockRestore()
  })

  function makeComplexModel(): schemaModel.SchemaModel {
    const stringEnum: schemaModel.EnumReferenceType = {
      kind: 'enum',
      name: 'Role',
      ref: 'TableContext.Role',
      values: []
    }
    const stringUnion: schemaModel.UnionType = {
      kind: 'union',
      variants: [
        { kind: 'primitive', name: 'string' },
        { kind: 'literal', value: 'A' },
        stringEnum
      ]
    }
    const numberUnion: schemaModel.UnionType = {
      kind: 'union',
      variants: [
        { kind: 'primitive', name: 'number' },
        { kind: 'literal', value: 42 }
      ]
    }
    const boolUnion: schemaModel.UnionType = {
      kind: 'union',
      variants: [
        { kind: 'primitive', name: 'boolean' },
        { kind: 'literal', value: true }
      ]
    }
    const mixedUnion: schemaModel.UnionType = {
      kind: 'union',
      variants: [
        { kind: 'primitive', name: 'string' },
        { kind: 'primitive', name: 'number' }
      ]
    }
    const emptyUnion: schemaModel.UnionType = {
      kind: 'union',
      variants: [{ kind: 'primitive', name: 'undefined' }]
    }
    const optionalUnion: schemaModel.UnionType = {
      kind: 'union',
      variants: [
        { kind: 'primitive', name: 'undefined' },
        { kind: 'primitive', name: 'number' }
      ]
    }
    return {
      kind: 'object',
      fields: [
        { name: 'id', type: { kind: 'primitive', name: 'string' } },
        { name: 'bigintField', type: { kind: 'primitive', name: 'number', hintMeta: { strategyHint: 'bigint', sourceAlias: 'int64' } } },
        { name: 'stringUnion', type: stringUnion },
        { name: 'numberUnion', type: numberUnion },
        { name: 'boolUnion', type: boolUnion },
        { name: 'mixedUnion', type: mixedUnion },
        { name: 'emptyUnion', type: emptyUnion },
        { name: 'optionalValue', type: optionalUnion },
        {
          name: 'arrayFromTnode',
          type: {
            kind: 'array',
            element: { kind: 'primitive', name: 'string' },
            origin: 'tnode',
            representation: 'generic'
          }
        },
        {
          name: 'arrayFromSdm',
          type: {
            kind: 'array',
            element: mixedUnion,
            origin: 'sdm',
            childCount: 2
          }
        },
        { name: 'emptyArray', type: { kind: 'array', empty: true } },
        { name: 'singleTuple', type: { kind: 'tuple', elements: [{ kind: 'primitive', name: 'string' }] } },
        { name: 'emptyTuple', type: { kind: 'tuple', elements: [] } },
        {
          name: 'multiTuple',
          type: {
            kind: 'tuple',
            elements: [
              { kind: 'primitive', name: 'string' },
              { kind: 'primitive', name: 'number' }
            ]
          }
        },
        { name: 'literalWeird', type: { kind: 'literal', value: null as any } },
        {
          name: 'inlineObject',
          type: {
            kind: 'object',
            style: 'inline',
            fields: [
              { name: 'x', type: { kind: 'primitive', name: 'number' } },
              { name: 'y', type: { kind: 'primitive', name: 'number' } }
            ]
          }
        },
        {
          name: 'singleFieldObject',
          type: {
            kind: 'object',
            fields: [{ name: 'value', type: { kind: 'primitive', name: 'boolean' } }]
          }
        },
        { name: 'emptyObject', type: { kind: 'object', fields: [] } },
        { name: 'literalField', type: { kind: 'literal', value: true } },
        { name: 'enumField', type: stringEnum },
        { name: 'unknownKind', type: { kind: 'mystery' } as any },
        {
          name: 'numericClass',
          type: {
            kind: 'object',
            fields: [
              { name: '1invalid', type: { kind: 'primitive', name: 'string' } },
              { name: '!!!', type: { kind: 'primitive', name: 'string' } }
            ]
          } as any
        }
      ]
    }
  }

  it('renders ts interface serializer with repo helpers and alias meta', () => {
    process.env.TABLES_VERBOSE = '1'
    const dealSchemaSpy = jest.spyOn(tsInterfaceModule, 'dealSchema')
    buildSchemaModelSpy.mockReturnValue(makeComplexModel())
    const data = {
      schema: {},
      descLine: {},
      markCols: [],
      convert: {
        meta: {
          idSegments: [0],
          indexes: {
            aliasField: { mode: 'unique' },
            tag: { mode: 'multi' }
          },
          alias: {
            field: 'aliasField',
            values: ['Alpha', 'Beta']
          }
        }
      }
    }
    const output = tsInterfaceSerializer.file(data as any, 'HeroTable', 'import { TableContext } from "./ctx";', {})
    expect(output).toContain('export interface IHerotable')
    expect(output).toContain('export class HerotableRepo')
    expect(output).toContain('getAllByTag')
    expect(output).toContain('HerotableProtocol')

    const contextDoc = dealContext({
      meta: { exports: { enum: ['enums'] } },
      enums: {
        RoleEnum: {
          Admin: [1, 'super user'],
          Guest: 0
        }
      }
    })
    expect(contextDoc).toContain('enum RoleEnum')

    buildSchemaModelSpy.mockReturnValueOnce({ kind: 'primitive', name: 'string' } as schemaModel.PrimitiveType)
    dealSchemaSpy.mockImplementationOnce(() => 'string')
    tsInterfaceSerializer.file(data as any, 'HeroTable', 'import {}', {})

    buildSchemaModelSpy.mockReturnValueOnce({ kind: 'primitive', name: 'string' } as schemaModel.PrimitiveType)
    dealSchemaSpy.mockImplementationOnce(() => 'type Alias = string\nexport {}')
    tsInterfaceSerializer.file(data as any, 'HeroTable', 'import {}', {})
    dealSchemaSpy.mockRestore()
  })

  it('renders go serializer with tid helpers', () => {
    buildSchemaModelSpy.mockReturnValue(makeComplexModel())
    const data = {
      schema: {},
      descLine: {},
      markCols: [],
      convert: {
        meta: {
          idSegments: [0]
        }
      }
    }
    const goOutput = goSerializer.file(data as any, 'hero_table', '', {})
    expect(goOutput).toContain('type HeroTable struct')
    expect(goOutput).toContain('func NewHeroTableTID')
  })

  it('renders csharp serializer covering numeric strategies', () => {
    buildSchemaModelSpy.mockReturnValue(makeComplexModel())
    const data = {
      schema: {},
      descLine: {},
      markCols: [],
      convert: {
        meta: {
          idSegments: [0]
        }
      }
    }
    const csOutput = csharpSerializer.file(data as any, 'HeroTable', '', {})
    expect(csOutput).toContain('public class HeroTable')
    expect(csOutput).toContain('public string BigintField')
  })
})
