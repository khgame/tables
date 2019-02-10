const assert = require('assert')
const tableMarkPlugin = require('./mark')

module.exports = function tableDesc (table) {
  if (!table.tableMark) {
    table = tableMarkPlugin(table)
  }
  const { data, tableMark, getValue } = table
  const markRow = tableMark.row
  const markCol = tableMark.col
  const markLine = data[markRow]
  assert(markLine, 'markLine not exist')
  assert(getValue(table, markRow, markCol) === '@', `mark info error ${markLine[markCol]}`)

  // console.log(`get desc line : ${JSON.stringify(markLine)}`)

  return table
}
