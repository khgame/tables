import type { Table } from '../types'

/**
 * get all available row indexes of table
 */
export function tableRows(table: Table): Table {
  const { data } = table
  const rows = Object.keys(data).map(ind => parseInt(ind, 10)).sort((a, b) => a - b)
  Object.assign(table, { rows })
  return table
}

