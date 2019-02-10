
module.exports = function tableExpand (table) {
  if (table.__expand) {
    console.log('[tableExpand] Warning : its already a expanded table')
  }

  const { data, cols, getValue } = table
  let expand = {}

  let colMap = {}
  for (let i in cols) {
    colMap[cols[i]] = i
  }

  for (let row in data) {
    if (!data.hasOwnProperty(row)) {
      continue
    }
    expand[row] = []
    for (let i in cols) {
      expand[row].push(getValue(table, row, cols[i]))
    }
  }

  table.colMap = colMap
  table.data = expand
  table.getValue = (table_, row_, col_) => table_.data[row_][table_.colMap[col_]]
  table.__plain = true
  table.__expand = true
  return table
}
