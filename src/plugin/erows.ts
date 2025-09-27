import { tableRows } from './rows'
import type { Table } from '../types'

/**
 * remove empty rows (only undefined/empty-string are considered empty)
 */
export function tableEnsureRows(table: Table): Table {
  if (!table.rows) {
    table = tableRows(table)
  }
  const { rows = [], cols, getValue } = table

  const erows: number[] = []
  for (const row of rows) {
    for (const col of cols) {
      const value = getValue(table, row, col)
      if (value === undefined || value === '') continue
      erows.push(row)
      break
    }
  }
  table.erows = erows
  return table
}

