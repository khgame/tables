import type { Table } from '../types'

export function tablePlain(table: Table): Table {
  if (table.__plain) {
    if (process.env.TABLES_VERBOSE === '1') {
      console.warn('[tablePlain] Warning: already plain')
    }
  }
  const { data, getValue } = table
  const plain: Record<string, Record<string, any>> = {}
  for (const row in data as any) {
    if (!Object.prototype.hasOwnProperty.call(data, row)) continue
    const rowData = (data as any)[row]
    plain[row] = {}
    for (const col in rowData) {
      plain[row][col] = getValue(table, row as any, col)
    }
  }
  table.__plain = true
  table.data = plain
  table.getValue = (table_, row_, col_) => (table_ as any).data[row_][col_]
  return table
}

