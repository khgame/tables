import { parseSchema } from '@khgame/schema'

const tableDescPlugin = require('./desc')
const tableEnsureRowsPlugin = require('./erows')

export function tableSchema (table) {
  if (!table.tableMark || !table.markLine || !table.descLine) {
    table = tableEnsureRowsPlugin(table)
    table = tableDescPlugin(table)
  }

  const { markCols, markLine } = table

  const markList = markCols.map(colName => markLine[colName])
  const schema = parseSchema(markList)
  table.markList = markList
  table.schema = schema
  return table
}
