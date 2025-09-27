import { tableColMap } from './colMap'
import type { Table } from '../types'

export function tableExpand(table: Table): Table {
  if (table.__expand) {
    if (process.env.TABLES_VERBOSE === '1') {
      console.warn('[tableExpand] Warning: already expanded')
    }
  }
  if (!table.colMap) {
    table = tableColMap(table)
  }

  const { data, cols, getValue } = table
  const expand: Record<string, any[]> = {}

  for (const row in data as any) {
    if (!Object.prototype.hasOwnProperty.call(data, row)) continue
    expand[row] = []
    for (const col of cols) {
      expand[row].push(getValue(table, row as any, col))
    }
  }

  table.data = expand
  table.getValue = (table_, row_, col_) => (table_ as any).data[row_][(table_ as any).colMap[col_]]
  table.__plain = true
  table.__expand = true
  return table
}

