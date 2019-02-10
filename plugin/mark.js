const tableRows = require('./rows')

module.exports = function markRows (table) {
  if (!table.rows) {
    table = tableRows(table)
  }
  const { data, rows } = table

  let tableMark
  for (let rowInd in rows) {
    if (tableMark) {
      break
    }
    let row = rows[rowInd]
    let rowData = data[row]
    for (let col in rowData) {
      if (!rowData.hasOwnProperty(col)) {
        continue
      }
      let value = rowData[col]
      console.log(row, col, value)
      if (value.v === '@') {
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
