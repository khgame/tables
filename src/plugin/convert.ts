import { tableSchema } from './schema'
import { exportJson } from '@khgame/schema'
import * as _ from 'lodash'
import type { Table } from '../types'

export function tableConvert(table: Table, context?: any): Table {
  if (!table.schema) {
    table = tableSchema(table, context)
  }

  const {
    schema,
    markCols = [],
    marks,
    markLine,
    descLine,
    getValue,
    erows = [],
    markList = []
  } = table as any

  const startRow: number = (marks as any).row + 2
  const descList = markCols.map((colName: string) => (descLine as any)[colName])

  const stringLikeColumns = markCols.map((_: string, columnIndex: number) => {
    const markToken = String((markList as any)[columnIndex] || '').toLowerCase()
    return markToken.includes('string')
  })

  const convertedRows = erows
    .filter((row: number) => row >= startRow)
    .map((row: number) => markCols.map((colName: string, colIndex: number) => {
      const cellValue = getValue(table, row, colName)
      if (!stringLikeColumns[colIndex]) return cellValue
      if (cellValue === undefined || cellValue === null) return ''
      return typeof cellValue === 'string' ? cellValue : String(cellValue)
    }))

  const markDescriptor = {
    row: erows,
    col: markCols
  }
  const exportResult = exportJson(schema, descList, convertedRows, markDescriptor)

  const idSeg: number[] = []
  markCols.forEach((col: string, markInd: number) => {
    if ((markLine as any)[col].trim() === '@') {
      idSeg.push(markInd)
    }
  })
  const tids = convertedRows.map((values: any[]) => idSeg.reduce((prev: string, cur: number) => prev + (values as any)[cur], ''))

  const result: Record<string, any> = {}
  const policy = (((context || {}).policy || {}).tidConflict) || 'error' // error|overwrite|ignore|merge
  const collisions: Array<{ id: string; first: any; incoming: any }> = []
  tids.forEach((id: string, i: number) => {
    const incoming = (exportResult as any)[i]
    if (result[id] === undefined) {
      result[id] = incoming
      return
    }
    collisions.push({ id, first: result[id], incoming })
    switch (policy) {
      case 'overwrite':
        if (process.env.TABLES_VERBOSE === '1') {
          console.warn(`[tables] TID collision (overwrite): ${id}`)
        }
        result[id] = incoming
        break
      case 'ignore':
        if (process.env.TABLES_VERBOSE === '1') {
          console.warn(`[tables] TID collision (ignore): ${id}`)
        }
        break
      case 'merge':
        if (process.env.TABLES_VERBOSE === '1') {
          console.warn(`[tables] TID collision (merge): ${id}`)
        }
        result[id] = _.merge({}, result[id], incoming)
        break
      case 'error':
      default:
        throw new Error(`[tables] TID collision detected for id ${id}. Configure context.policy.tidConflict to 'overwrite'|'ignore'|'merge'.`)
    }
  })

  ;(table as any).convert = {
    tids,
    result,
    collisions,
    meta: {
      idSegments: idSeg,
      markCols
    }
  }
  return table
}
