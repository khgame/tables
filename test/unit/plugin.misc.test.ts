import { tableColMap } from '../../src/plugin/colMap'
import { tablePlain } from '../../src/plugin/plain'
import { tableExpand } from '../../src/plugin/expand'
import { tableMark } from '../../src/plugin/mark'
import { tableDesc } from '../../src/plugin/desc'
import type { Table } from '../../src/types'

function makeTable(rows: Array<Record<string, any>>, cols?: string[]): Table {
  // Collect cols if not provided
  const allCols = cols || Array.from(
    rows.reduce((set, r) => { Object.keys(r).forEach(k => set.add(k)); return set; }, new Set<string>())
  )
  const data: any = {}
  rows.forEach((r, i) => {
    const rowInd = String(i + 1)
    data[rowInd] = {}
    for (const c of allCols) {
      if (r[c] !== undefined) {
        data[rowInd][c] = { t: typeof r[c] === 'number' ? 'n' : 's', v: r[c], w: String(r[c]) }
      }
    }
  })
  const table: Table = {
    cols: allCols,
    data,
    getValue: (t, row, col) => (t.data as any)[String(row)] && (t.data as any)[String(row)][col] ? (t.data as any)[String(row)][col].v : undefined
  }
  // Attach sequential rows helper
  ;(table as any).rows = rows.map((_, i) => i + 1)
  return table
}

describe('tableColMap', () => {
  it('maps column letters to indices', () => {
    const t = makeTable([{ A: 1, B: 2 }, { A: 3, B: 4 }], ['A', 'B'])
    const ret = tableColMap(t)
    expect(ret.colMap).toEqual({ A: 0, B: 1 })
  })
})

describe('tablePlain', () => {
  it('flattens cell objects to raw values and adjusts getValue', () => {
    const t = makeTable([{ A: 1, B: 'x' }], ['A', 'B'])
    const before = t.getValue(t, 1, 'A')
    const ret = tablePlain(t)
    expect(before).toBe(1)
    expect((ret.data as any)['1']).toEqual({ A: 1, B: 'x' })
    expect(ret.getValue(ret, 1, 'B')).toBe('x')
    // idempotent-ish: calling twice should not throw and keep shape
    const again = tablePlain(ret)
    expect((again.data as any)['1']).toEqual({ A: 1, B: 'x' })
  })
})

describe('tableExpand', () => {
  it('expands rows to arrays using colMap and preserves getValue', () => {
    const t = makeTable([{ A: 1, B: 'x' }], ['A', 'B'])
    const ret = tableExpand(t)
    expect((ret.data as any)['1']).toEqual([1, 'x'])
    expect(ret.getValue(ret, '1' as any, 'A')).toBe(1)
    expect(ret.getValue(ret, '1' as any, 'B')).toBe('x')
    // calling expand again should not break
    const again = tableExpand(ret)
    expect((again.data as any)['1']).toEqual([1, 'x'])
  })
})

describe('tableMark/tableDesc', () => {
  it('finds @ mark and builds desc/mark lines', () => {
    // Row1: mark line with @ in B; Row2: desc line
    const t = makeTable([
      { A: '', B: '@', C: '' },
      { A: 'id', B: 'name', C: '' },
      { A: 'x', B: 'foo', C: '' }
    ], ['A', 'B', 'C'])
    const marked = tableMark(t)
    expect(marked.marks).toEqual({ row: 1, col: 'B' })
    const descd = tableDesc(marked)
    // markCols only include cols with truthy markSlot (only B here)
    expect(descd.markCols).toEqual(['B'])
    // descLine keeps defined values (including empty string)
    expect(descd.descLine).toMatchObject({ A: 'id', B: 'name', C: '' })
    expect(descd.markLine && (descd.markLine as any).B).toBe('@')
  })
})
