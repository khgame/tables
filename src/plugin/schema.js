import { parseSchema } from '@khgame/schema'
import { tableDesc } from './desc'
import { tableEnsureRows } from './erows'

export function tableSchema (table) {
  if (!table.tableMark || !table.markLine || !table.descLine) {
    table = tableEnsureRows(table)
    table = tableDesc(table)
  }

  const { markCols, markLine } = table

  const markList = markCols.map(colName => markLine[colName])
  const schema = parseSchema(markList)
  // table.markList = markList
  table.schema = schema
  table.markList = markList
  return table
}
