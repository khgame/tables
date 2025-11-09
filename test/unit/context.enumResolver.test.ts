import Path from 'path'
import {
  collectContextEnumReferences,
  resolveContextEnums,
  validateContextEnumReferences
} from '../../src/context/enumResolver'

const PROJECT_ROOT = Path.resolve(__dirname, '..', '..')

describe('context enum resolver', () => {
  it('merges literal entries with alias references from tables', () => {
    const context: any = {
      enums: {
        SkillTag: [
          'None',
          { name: 'ManualEntry', value: 'manual' },
          { ref: { table: 'test/excel/alias.csv', field: 'nameAlias' } }
        ]
      }
    }

    resolveContextEnums(context, PROJECT_ROOT)

    const actual = context.enums.SkillTag
    expect(actual).toBeDefined()
    expect(actual.None).toBe('None')
    expect(actual.ManualEntry).toBe('manual')
    expect(actual.School).toBe('school')
    expect(actual.Hospital).toBe('hospital')
    expect(actual).not.toHaveProperty('')
    expect(Object.keys(actual)).toEqual(['None', 'ManualEntry', 'School', 'Hospital'])
  })

  it('supports object style enums with __refs and filters/prefix', () => {
    const context: any = {
      enums: {
        Filtered: {
          Base: 'base',
          __refs: [
            {
              ref: { table: 'test/excel/alias.csv', field: 'nameAlias', filter: { sequence: 2 } },
              prefix: 'Skill'
            }
          ]
        }
      }
    }

    resolveContextEnums(context, PROJECT_ROOT)

    const actual = context.enums.Filtered
    expect(actual.Base).toBe('base')
    expect(actual.SkillHospital).toBe('hospital')
    expect(Object.keys(actual)).toEqual(['Base', 'SkillHospital'])
  })

  it('allows overriding name/value/description fields for alias refs', () => {
    const context: any = {
      enums: {
        AliasWithMetadata: [
          {
            ref: {
              table: 'test/excel/alias_desc.csv',
              field: 'aliasName',
              valueField: 'aliasName',
              nameField: 'displayName',
              descriptionField: 'displayName',
              transform: 'upper'
            }
          }
        ]
      }
    }

    resolveContextEnums(context, PROJECT_ROOT)

    const actual = context.enums.AliasWithMetadata
    expect(actual.ALPHA_DISPLAY).toEqual(['labelAlpha', 'Alpha Display'])
    expect(actual.BETA_DISPLAY).toEqual(['labelBeta', 'Beta Display'])
  })

  it('rejects references to non-alias fields', () => {
    const context: any = {
      enums: {
        Invalid: [
          { ref: { table: 'test/excel/alias.csv', field: 'category' } }
        ]
      }
    }

    expect(() => resolveContextEnums(context, PROJECT_ROOT)).toThrow(/不是 alias 列/)
  })

  it('collects enum references without resolving tables', () => {
    const context: any = {
      enums: {
        SkillTag: [
          'None',
          { ref: { table: 'test/excel/alias.csv', field: 'nameAlias', filter: { sequence: 1 } } }
        ],
        ExtraTag: {
          __refs: [
            { ref: 'test/excel/alias_desc.csv#aliasName', prefix: 'Meta' }
          ]
        }
      }
    }

    expect(collectContextEnumReferences(context)).toEqual([
      {
        enumName: 'SkillTag',
        diagnosticPath: 'context.enums.SkillTag[1]',
        table: 'test/excel/alias.csv',
        field: 'nameAlias',
        filter: { sequence: 1 }
      },
      {
        enumName: 'ExtraTag',
        diagnosticPath: 'context.enums.ExtraTag.__refs[0]',
        table: 'test/excel/alias_desc.csv',
        field: 'aliasName',
        prefix: 'Meta'
      }
    ])
  })

  it('validates enum references as structured messages', () => {
    const missingTableContext: any = {
      enums: {
        Broken: [
          { ref: { table: 'test/excel/missing.csv', field: 'alias' } }
        ]
      }
    }

    const missingTable = validateContextEnumReferences(missingTableContext, PROJECT_ROOT)
    expect(missingTable).toMatchObject({
      success: false,
      references: [{
        enumName: 'Broken',
        diagnosticPath: 'context.enums.Broken[0]',
        table: 'test/excel/missing.csv',
        field: 'alias'
      }],
      errors: [{
        severity: 'error',
        code: 'context_ref_error',
        diagnosticPath: 'context.enums.Broken[0]',
        details: {
          enumName: 'Broken',
          table: 'test/excel/missing.csv',
          field: 'alias'
        }
      }]
    })

    const nonAliasContext: any = {
      enums: {
        Invalid: [
          { ref: { table: 'test/excel/alias.csv', field: 'category' } }
        ]
      }
    }

    const nonAlias = validateContextEnumReferences(nonAliasContext, PROJECT_ROOT)
    expect(nonAlias).toMatchObject({
      success: false,
      references: [{
        enumName: 'Invalid',
        diagnosticPath: 'context.enums.Invalid[0]',
        table: 'test/excel/alias.csv',
        field: 'category'
      }],
      errors: [{
        severity: 'error',
        code: 'context_ref_error',
        diagnosticPath: 'context.enums.Invalid[0]',
        details: {
          enumName: 'Invalid',
          table: 'test/excel/alias.csv',
          field: 'category',
          expected: 'alias_column'
        }
      }]
    })
  })
})
