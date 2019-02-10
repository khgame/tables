const XLSX = require('js-xlsx')

function readWorkBook (path) {
  // read the raw file
  return XLSX.readFile(path)
}

function translateWorkBook (workbook, sheetName) {
  // read the sheet with the given name or the first sheet
  const targetSheetInd = workbook.SheetNames.findIndex(n => n === (sheetName || '__data'))
  const targetSheetName = workbook.SheetNames[targetSheetInd > 0 ? targetSheetInd : 0]
  const sheet = workbook.Sheets[targetSheetName]

  // create return table
  let data = {}
  let colKeys = []

  // convert data types
  for (let key in sheet) {
    if (!sheet.hasOwnProperty(key)) continue
    let splitInd = -1
    for (let i = key.length - 1; i >= 0; i--) {
      if (key[i] >= '0' && key[i] <= '9') {
        continue
      }
      splitInd = i
      break
    }
    let col = key.slice(0, splitInd + 1)
    let row = key.slice(splitInd + 1)
    if (!row) { continue }
    if (!data[row]) data[row] = {}
    let { t, v, w } = sheet[key]
    data[row][col] = { t, v, w }
    colKeys[col] = 1
  }

  let cols = Object.keys(colKeys).sort((a, b) => a.length - b.length || a.localeCompare(b)) // 1. length 2. locale
  return {
    cols,
    data,
    getValue: (table_, row_, col_) => (!table_.data[row_]) || (!table_.data[row_][col_]) ? undefined : table_.data[row_][col_].v
  }
}

function readAndTranslate (path, options) {
  let table = translateWorkBook(readWorkBook(path), options.sheetName)
  if (options.plugins) {
    table = options.plugins.reduce((accumulate, plugin) => plugin(accumulate), table)
  }
  return table
}

module.exports = {
  readWorkBook,
  translateWorkBook,
  readAndTranslate
}
