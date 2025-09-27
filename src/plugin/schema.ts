import { parseSchema } from '@khgame/schema'
import { tableDesc } from './desc'
import { tableEnsureRows } from './erows'
import type { Table } from '../types'

export function tableSchema(table: Table, context?: any): Table {
  if (!table.marks || !table.markLine || !table.descLine) {
    table = tableEnsureRows(table)
    table = tableDesc(table)
  }

  const { markCols = [], markLine } = table
  const markList = markCols.map(colName => (markLine as any)[colName])

  ;(table as any).schema = parseSchema(markList, context)
  ;(table as any).markList = markList
  return table
}

