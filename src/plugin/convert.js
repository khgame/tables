import { tableSchema } from './schema'
import { SchemaConvertor, MarkConvertorResultToErrorStack, MarkType, SDMType, exportJson } from '@khgame/schema'
import * as _ from 'lodash'

export function tableConvert (table) {
  if (!table.schema) {
    table = tableSchema(table)
  }

  const { schema, markCols, marks, markLine, descLine, getValue, erows } = table

  const startRow = marks.row + 2

  const descList = markCols.map(colName => descLine[colName])
  const convertedRows = erows
    .filter(row => row >= startRow)
    .map(row => markCols.map(colName => getValue(table, row, colName)))
  const markDescriptor = {
    row: erows,
    col: markCols
  }
  let exportResult = exportJson(schema, descList, convertedRows, markDescriptor)

  const idSeg = []
  markCols.forEach((col, markInd) => {
    if (markLine[col].trim() === '@') {
      idSeg.push(markInd)
    }
  })
  const tids = convertedRows.map(values => idSeg.reduce((prev, cur) => prev + values[cur], ''))

  const result = {}
  tids.forEach((id, i) => { result[id] = exportResult[i] })

  table.convert = { tids, result }
  // console.log('result', table.convert)
  return table
}
