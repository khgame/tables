import { tableConvert } from '../../src/plugin/convert'

jest.mock('@khgame/schema', () => ({
  exportJson: (_schema: any, _desc: any, convertedRows: any[]) => {
    // Return one object per row for simplicity
    return convertedRows.map((_, i) => ({ v: i }))
  }
}))

function makeCollisionTable(): any {
  const values: Record<number, Record<string, any>> = {
    3: { A: 'id', B: '001' },
    4: { A: 'id', B: '001' } // same id -> collision
  }
  const table: any = {
    schema: {},
    markCols: ['A', 'B'],
    markLine: { A: '@', B: '@' },
    descLine: { A: 'a', B: 'b' },
    marks: { row: 1, col: 'A' }, // startRow = 3
    erows: [3, 4],
    getValue: (_: any, row: number, col: string) => (values[row] || {})[col]
  }
  return table
}

describe('convert TID collision policy', () => {
  it('error policy throws', () => {
    const table = makeCollisionTable()
    expect(() => tableConvert(table, { policy: { tidConflict: 'error' } })).toThrow(/collision/i)
  })

  it('ignore policy keeps first', () => {
    const table = makeCollisionTable()
    const ret = tableConvert(table, { policy: { tidConflict: 'ignore' } })
    const ids = Object.keys(ret.convert!.result)
    expect(ids).toEqual(['id001'])
    expect(ret.convert!.collisions!.length).toBe(1)
  })

  it('overwrite policy keeps last', () => {
    const table = makeCollisionTable()
    const ret = tableConvert(table, { policy: { tidConflict: 'overwrite' } })
    expect(ret.convert!.result['id001']).toEqual({ v: 1 })
  })

  it('merge policy merges objects', () => {
    const table = makeCollisionTable()
    const ret = tableConvert(table, { policy: { tidConflict: 'merge' } })
    expect(ret.convert!.result['id001']).toEqual({ v: 1 }) // merge({}, {v:0}, {v:1}) -> {v:1}
  })
})

