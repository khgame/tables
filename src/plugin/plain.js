export function tablePlain (table) {
  if (table.__plain) {
    console.log('[tableDesc] Warning : its already a plain table')
  }
  const { data, getValue } = table
  let plain = {}
  for (let row in data) {
    if (!data.hasOwnProperty(row)) { continue }
    let rowData = data[row]
    plain[row] = {}
    for (let col in rowData) {
      plain[row][col] = getValue(table, row, col)
    }
  }
  table.__plain = true
  table.data = plain
  table.getValue = (table_, row_, col_) => table_.data[row_][col_]
  return table
}
