import { tableEnsureRows } from '../../src/plugin/erows'
import type { Table } from '../../src/types'

function makeTable(rows: Array<Record<string, any>>): Table {
  const cols = ['A', 'B']
  const data: any = {}
  rows.forEach((r, i) => {
    const rowInd = String(i + 1)
    data[rowInd] = {}
    for (const c of cols) {
      if (r[c] !== undefined) data[rowInd][c] = { t: 'n', v: r[c], w: String(r[c]) }
    }
  })
  const table: Table = {
    cols,
    data,
    getValue: (t, row, col) => (t.data as any)[String(row)] && (t.data as any)[String(row)][col] ? (t.data as any)[String(row)][col].v : undefined
  }
  // add rows
  ;(table as any).rows = rows.map((_, i) => i + 1)
  return table
}

describe('tableEnsureRows', () => {
  it('keeps rows with 0/false and drops empty/undefined/empty-string', () => {
    const t = makeTable([
      { A: 0, B: '' },          // keep (0 is valid)
      { A: false },             // keep (false is valid)
      { A: undefined, B: '' },  // drop
      { },                      // drop
      { A: 'x' }                // keep
    ])
    const ret = tableEnsureRows(t)
    expect(ret.erows).toEqual([1, 2, 5])
  })
})

