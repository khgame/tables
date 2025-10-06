import { buildIndexes } from '../../src/plugin/indexes'

describe('buildIndexes comprehensive coverage', () => {
  const descList = ['id', 'alias', 'title', 'unionField']

  it('returns null when no index configuration resolved', () => {
    expect(buildIndexes([], [], {}, descList)).toBeNull()
  })

  it('builds unique and multi indexes with metadata and collisions', () => {
    const records = [
      { id: 'hero', alias: 'Alpha', title: 'Mage', unionField: 'U1' },
      { id: 'hero', alias: 'Alpha', title: 'mage', unionField: 'U2' },
      { id: 'bot', alias: '', title: 'Support', unionField: 'U2' }
    ]
    const tids = ['H1', 'H2', 'B1']
    const context = {
      indexes: {
        TestTable: [
          'id',
          { name: 'alias', column: ['alias'], unique: false },
          { name: 'byTitle', column: 'title', caseInsensitive: true },
          { name: 'unionIndex', column: 'unionField', mode: 'multi' }
        ]
      },
      meta: {
        indexes: {
          '*': {
            fallback: { column: 'alias', unique: false },
            ignored: { column: '', mode: 'unique' }
          }
        }
      },
      __table: { fileName: 'TestTable' }
    }

    const result = buildIndexes(records, tids, context, descList)
    expect(result).not.toBeNull()
    expect(result!.meta.id.mode).toBe('unique')
    expect(result!.meta.alias.mode).toBe('multi')
    expect(result!.meta.unionIndex.mode).toBe('multi')
    expect(result!.meta.fallback.mode).toBe('multi')
    expect(result!.meta.id.collisions?.[0].tids).toEqual(expect.arrayContaining(['H1', 'H2']))
    expect(result!.maps.unionIndex['U2']).toEqual(expect.arrayContaining(['H2', 'B1']))
    expect(result!.maps.fallback.Alpha).toEqual(expect.arrayContaining(['H1', 'H2']))
  })
})
