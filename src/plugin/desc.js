const assert = require('assert')
const tableMarkPlugin = require('./mark')

export function tableDesc (table) {
  if (!table.tableMark) {
    table = tableMarkPlugin(table)
  }
  const { data, tableMark, getValue, cols } = table
  const markRow = tableMark.row
  const markCol = tableMark.col
  const markLineData = data[markRow]
  assert(markLineData, 'markLine not exist')
  assert(getValue(table, markRow, markCol) === '@', `mark info error ${markLineData[markCol]}`)

  let markLine = {}
  let markCols = []
  let descLine = {}
  for (let i in cols) {
    let col = cols[i]

    let markSlot = getValue(table, tableMark.row, col)
    let descSlot = getValue(table, tableMark.row + 1, col)
    if (markSlot) {
      markCols.push(col)
      markLine[col] = markSlot.trim()
    }
    if (descSlot) descLine[col] = descSlot.trim()
  }

  Object.assign(table,
    {
      markCols, // 用到的列
      markLine, // 类型
      descLine // 名称
    }
  )
  return table
}
