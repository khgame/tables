const tableRows = require('./rows')

module.exports = function tableEnsureRows (table) {
  if (!table.rows) {
    table = tableRows(table)
  }
  const { rows, cols, getValue } = table

  let erows = []
  for (let rowInd in rows) {
    if (!rows.hasOwnProperty(rowInd)) {
      continue
    }
    let row = rows[rowInd]
    for (let i in cols) {
      let col = cols[i]
      let value = getValue(table, row, col)
      if (!value) continue
      erows.push(row)
      break
    }
  }
  table.erows = erows
  return table
}
