const tableColMap = require('./colMap')

export function tableExpand (table) {
  if (table.__expand) {
    console.log('[tableExpand] Warning : its already a expanded table')
  }
  if (!table.colMap) {
    table = tableColMap(table)
  }

  const { data, cols, getValue } = table
  let expand = {}

  for (let row in data) {
    if (!data.hasOwnProperty(row)) {
      continue
    }
    expand[row] = []
    for (let i in cols) {
      expand[row].push(getValue(table, row, cols[i]))
    }
  }

  table.data = expand
  table.getValue = (table_, row_, col_) => table_.data[row_][table_.colMap[col_]]
  table.__plain = true
  table.__expand = true
  return table
}
