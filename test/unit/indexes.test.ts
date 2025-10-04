import { buildIndexes } from '../../src/plugin/indexes'

describe('plugin indexes buildIndexes', () => {
  const baseContext = {
    __table: {
      fileName: 'Example',
      camelName: 'Example',
      interfaceName: 'IExample'
    }
  }

  it('returns null when no index configuration provided', () => {
    const result = buildIndexes([], [], {}, [])
    expect(result).toBeNull()
  })

  it('builds unique and multi indexes with meta info', () => {
    const exportRows = [
      { Label: 'Sword', rule: { skillId: 'SKILL_A', rarity: 'common' }, type: 'WEAPON' },
      { Label: 'Bow', rule: { skillId: 'SKILL_B', rarity: '' }, type: 'weapon' },
      { Label: 'Sword', rule: { skillId: 'SKILL_A', rarity: 'rare' }, type: 'Armor' }
    ]
    const tids = ['001', '002', '003']

    const context = {
      ...baseContext,
      indexes: {
        Example: [
          'Label',
          { name: 'skill', path: 'rule.skillId', mode: 'multi' },
          { name: 'rarity', path: 'rule.rarity', allowEmpty: true }
        ]
      },
      meta: {
        indexes: {
          '*': {
            byType: { path: 'type', mode: 'multi', caseInsensitive: true }
          }
        }
      }
    }

    const descList = ['Label', 'rule', 'type']
    const result = buildIndexes(exportRows, tids, context, descList)
    expect(result).not.toBeNull()
    if (!result) return

    const { maps, meta } = result

    expect(maps.Label).toEqual({
      Sword: '001',
      Bow: '002'
    })
    expect(meta.Label?.collisions?.[0]).toEqual({ key: 'Sword', tids: ['001', '003'] })

    expect(maps.skill).toEqual({
      SKILL_A: ['001', '003'],
      SKILL_B: ['002']
    })
    expect(meta.skill?.mode).toBe('multi')

    expect(maps.byType).toEqual({
      weapon: ['001', '002'],
      armor: ['003']
    })

    expect(maps.rarity).toEqual({
      common: '001',
      '': '002',
      rare: '003'
    })
    expect(meta.rarity?.path).toEqual(['rule', 'rarity'])
  })
})
