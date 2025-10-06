import Path from 'path'
import { resolveContextEnums } from '../../src/context/enumResolver'

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
})

