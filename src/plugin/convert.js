import { tableSchema } from './schema'
import { SchemaConvertor, MarkConvertorResultToErrorStack, MarkType, SDMType } from '@khgame/schema'
import * as _ from 'lodash'

export function tableConvert (table) {
  if (!table.schema) {
    table = tableSchema(table)
  }

  const { schema, markCols, marks, markLine, descLine, getValue, erows } = table

  // console.log('markList:\n', JSON.stringify(markList))
  const convertor = new SchemaConvertor(schema)
  const startRow = marks.row + 2

  const idSeg = []
  markCols.forEach((col, markInd) => {
    if (markLine[col].trim() === '@') {
      idSeg.push(markInd)
    }
  })

  function replaceErrorStack (errStack) {
    const ret = {}
    Object.keys(errStack).forEach(key => {
      ret[markCols[key]] = _.isObject(errStack[key]) ? replaceErrorStack(errStack[key]) : errStack[key]
    })
    return ret
  }

  function createObject (converted, sdm) { // the node is sdm
    let ret = sdm.sdmType === SDMType.Arr ? [] : {}

    function setValue (markInd, value) {
      if (sdm.sdmType === SDMType.Arr) {
        if (value) ret.push(value)
      } else {
        ret[descLine[markCols[markInd]]] = value
      }
    }

    console.log(converted)
    for (const markIndStr in converted) {
      const markInd = Number(markIndStr)
      const child = sdm.marks.find(v => v.markInd === markInd)
      if (!child) {
        throw new Error('DM not found for markInd ' + markInd)
      }
      const value = converted[markInd][1]
      if (child.markType === MarkType.TDM) {
        setValue(markInd, value)
      } else {
        setValue(markInd - 1, createObject(value, child))
      }
    }
    return ret
  }

  const result = {}
  const tids = []
  for (const rowInd in erows) {
    const row = parseInt(erows[rowInd])
    if (row < startRow) {
      continue
    }
    const values = markCols.map(colName => getValue(table, row, colName))
    // console.log('--\n', JSON.stringify(values))
    const validate = convertor.validate(values)
    if (!validate[0]) {
      const errorStack = MarkConvertorResultToErrorStack(validate)
      console.log(`error at row ${row} stack:\n${JSON.stringify(replaceErrorStack(errorStack), null, 2)}`)
      continue
    }
    const id = idSeg.reduce((prev, cur) => prev + values[cur], "");
    let converted = convertor.convert(values)
    console.log('--- converted:\n', JSON.stringify(converted), '\n===')
    let ret = createObject(converted, schema)
    tids.push(id)
    result[id] = ret
    console.log('result', id, ret)
  }
  table.convert = { tids, result }
  return table
}
