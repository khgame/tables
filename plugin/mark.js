const tableRows = require('./rows')

module.exports = function tableMark (table) {
  if (!table.rows) {
    table = tableRows(table)
  }
  const { rows, cols, getValue } = table

  let tableMark
  for (let rowInd in rows) {
    if (tableMark) {
      break
    }
    if (!rows.hasOwnProperty(rowInd)) {
      continue
    }
    let row = rows[rowInd]
    for (let i in cols) {
      let col = cols[i]
      let value = getValue(table, row, col)
      console.log(row, col, value)
      if (value === '@') {
        tableMark = {
          row, col
        }
        break
      }
    }
  }
  Object.assign(table, { rows, tableMark })
  return table
}
