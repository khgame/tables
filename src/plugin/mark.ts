import { tableRows } from './rows'
import type { Table, Marks } from '../types'

/**
 * get start position of the table, marked by '@'
 */
export function tableMark(table: Table): Table {
  if (!table.rows) {
    table = tableRows(table)
  }
  const { rows = [], cols, getValue } = table

  let tableMark: Marks | undefined
  for (const row of rows) {
    for (const col of cols) {
      const value = getValue(table, row, col)
      if (value === '@') {
        tableMark = { row, col }
        break
      }
    }
    if (tableMark) break
  }
  table.marks = tableMark as any
  return table
}

