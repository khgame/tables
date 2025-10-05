// Switched to typed 'xlsx' engine.
import * as XLSX from 'xlsx'
import * as Path from 'path'
import type { Table } from '../types'

export function readWorkBook(path: string): any {
  const ext = Path.extname(path || '').toLowerCase()
  const options = ext === '.csv' ? { codepage: 65001 } : undefined
  const workbook = options ? XLSX.readFile(path, options) : XLSX.readFile(path)
  if (ext === '.csv') {
    const csvRows: Record<string, string[][]> = {}
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
        header: 1,
        raw: false,
        defval: ''
      })
      csvRows[sheetName] = rows
    }
    ;(workbook as any).__csvRows = csvRows
  }
  return workbook
}

function columnLetterToIndex(column: string): number {
  let index = 0
  for (let i = 0; i < column.length; i++) {
    const code = column.charCodeAt(i)
    if (code >= 65 && code <= 90) {
      index = index * 26 + (code - 64)
    } else if (code >= 97 && code <= 122) {
      index = index * 26 + (code - 96)
    }
  }
  return index - 1
}

export function translateWorkBook(workbook: any, sheetName?: string): Table {
  const targetSheetInd = workbook.SheetNames.findIndex((n: string) => n === (sheetName || '__data'))
  const targetSheetName = workbook.SheetNames[targetSheetInd > 0 ? targetSheetInd : 0]
  const sheet = workbook.Sheets[targetSheetName]
  const csvRows: string[][] | undefined = (workbook.__csvRows && workbook.__csvRows[targetSheetName]) || undefined

  const data: Record<string, Record<string, any>> = {}
  const colKeys: Record<string, 1> = {}

  for (const key in sheet) {
    if (!Object.prototype.hasOwnProperty.call(sheet, key)) continue
    let splitInd = -1
    for (let i = key.length - 1; i >= 0; i--) {
      if (key[i] >= '0' && key[i] <= '9') continue
      splitInd = i
      break
    }
    const col = key.slice(0, splitInd + 1)
    const row = key.slice(splitInd + 1)
    if (!row) continue
    if (!data[row]) data[row] = {}
    const { t, v, w } = sheet[key]
    let adjustedW = w
    if (csvRows) {
      const rowIndex = parseInt(row) - 1
      if (!Number.isNaN(rowIndex) && rowIndex >= 0 && rowIndex < csvRows.length) {
        const colIndex = columnLetterToIndex(col)
        if (colIndex >= 0) {
          const csvRow = csvRows[rowIndex]
          if (csvRow && colIndex < csvRow.length) {
            adjustedW = csvRow[colIndex]
          }
        }
      }
    }
    data[row][col] = { t, v, w: adjustedW }
    colKeys[col] = 1
  }

  const cols = Object.keys(colKeys).sort((a, b) => a.length - b.length || a.localeCompare(b))
  const table: Table = {
    cols,
    data,
    getValue: (table_, row_, col_) => (!table_.data[row_]) || (!table_.data[row_][col_]) ? undefined : table_.data[row_][col_].v
  }
  return table
}

export function readAndTranslate(path: string, options: { sheetName?: string; plugins?: any[] } = {}, context?: any): Table {
  let table = translateWorkBook(readWorkBook(path), options.sheetName)
  if (options.plugins) {
    table = options.plugins.reduce((accumulate, plugin) => plugin(accumulate, context), table)
  }
  return table
}
