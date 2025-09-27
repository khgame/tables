import type { Table } from '../types'

export function tableColMap(table: Table): Table {
  const { cols } = table
  const colMap: Record<string, number> = {}
  for (let i = 0; i < cols.length; i++) {
    colMap[cols[i]] = i
  }
  table.colMap = colMap
  return table
}

