import { tableSchema } from './schema'
import { SchemaConvertor, MarkConvertorResultToErrorStack, MarkType, SDMType } from '@khgame/schema'
import * as _ from 'lodash'
// const tableDescPlugin = require('./desc')
// const tableEnsureRowsPlugin = require('./erows')
// const {
//   STRUCT_TYPES,
//   DECORATORS,
//   InfoSym,
//   Analyze,
//   Machine
// } = require('./analyze/index')
// const assert = require('assert')
// const _ = require('lodash')

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

  function createObject (converted, sdm, fnAppendID) { // the node is sdm
    let ret = sdm.sdmType === SDMType.Arr ? [] : {}

    function setValue (markInd, value) {
      if (sdm.sdmType === SDMType.Arr) {
        if (value) ret.push(value)
      } else {
        ret[descLine[markCols[markInd]]] = value
        console.log('setvalue', markInd, descLine[markCols[markInd]], value)
      }
      if (fnAppendID && idSeg.indexOf(markInd) >= 0) {
        fnAppendID(value)
      }
    }

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
        setValue(markInd - 1, createObject(value, child)) // fnAppendID 只允许出现在第一层
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
    console.log('---\n', JSON.stringify(), '\n===')
    let converted = convertor.convert(values)
    let id = ''
    let ret = createObject(converted, schema, (v) => {
      id = id + v
    })
    tids.push(id)
    result[id] = ret
    console.log('result', id, ret)
  }
  table.convert = { tids, result }
  return table
}

//
// export function tableConvert2 (table) {
//   if (!table.marks || !table.markLine || !table.descLine || !table.schema) {
//     table = tableEnsureRowsPlugin(table)
//     table = tableDescPlugin(table)
//     table = tableSchema(table)
//   }
//
//   const { getValue, erows, markCols, marks, markLine, descLine } = table
//   const convertors = {}
//   const idSeg = {}
//   Object.keys(markLine).forEach(col => {
//     convertors[col] = getConvertor(markLine[col])
//     idSeg[col] = markLine[col].trim() === '@'
//   })
//
//   const tids = {}
//   const Val = (row, col) => {
//     let val = getValue(table, row, col)
//     if (idSeg[col]) {
//       tids[row] = tids[row] ? tids[row] + _.toString(val) : _.toString(val)
//     }
//     // console.log(`convert ${row},${col}:${val}`)
//     try {
//       return convertors[col](val)
//     } catch (ex) {
//       throw new TypeError(`Convert Error for col(${col}) ${descLine[col]}:${markLine[col]} \n ${ex.message}`)
//     }
//   }
//
//   const isEmpty = (row, col) => {
//     let val = getValue(table, row, col)
//     return !val
//   }
//
//   const startRow = marks.row + 2
//
//   const result = {}
//
//   for (let rowInd in erows) {
//     let row = parseInt(erows[rowInd])
//     // console.log(`enter row ${row}/${erows}`)
//     if (row < startRow) {
//       continue
//     }
//
//     let machine = new Machine()
//
//     // console.log(`scan row ${row}, ${JSON.stringify(table.data[row])}`)
//     for (let colInd in markCols) {
//       if (!markCols.hasOwnProperty(colInd)) {
//         continue
//       }
//       let col = markCols[colInd]
//       let colType = getValue(table, marks.row, col).trim() // colType in mark line will never be empty
//       let colTitle = descLine[col]
//
//       let colAnalysis = Analyze(colType)
//       // console.log('colType:', colType, 'colTitle:', colTitle, 'colAnalysis:', colAnalysis)
//       switch (colAnalysis.type) {
//         case STRUCT_TYPES.OBJ_START:
//           machine.enterStackObj(
//             colTitle,
//             (parent, parentKey, me) => {
//               let isEmptyObject = Object.keys(JSON.parse(JSON.stringify(me))).length === 0
//               // console.log('isEmptyObject', colTitle, '-', Object.keys(me), me['data'], '-', parentKey, isEmptyObject)
//               if (isEmptyObject) {
//                 parent[InfoSym].delVal(parentKey)
//               }
//             }
//           )[InfoSym].setAnalysisResult(colAnalysis)
//           break
//         case STRUCT_TYPES.ARR_START:
//           machine.enterStackArr(
//             colTitle,
//             (parent, parentKey, me) => {
//               let isEmptyObject = Object.keys(JSON.parse(JSON.stringify(me))).length === 0
//               if (isEmptyObject) {
//                 parent[InfoSym].delVal(parentKey)
//                 return
//               }
//
//               // console.log('me[InfoSym])', me[InfoSym], me[InfoSym].hasDecorator(DECORATORS.ONE_OF))
//               if (me[InfoSym].hasDecorator(DECORATORS.ONE_OF)) {
//                 if (me.length <= 0) {
//                   throw Error(`array with decorator(${DECORATORS.ONE_OF}) must have at least one element.`)
//                 } else if (me.length > 1) {
//                   console.log(`[Warning] detected more than on element of array with decorator(${DECORATORS.ONE_OF}).`)
//                 }
//                 parent[parentKey] = me[0]
//               }
//             })[InfoSym].setAnalysisResult(colAnalysis)
//           break
//         case STRUCT_TYPES.OBJ_END:
//           machine.exitStack()
//           break
//         case STRUCT_TYPES.ARR_END:
//           machine.exitStack()
//           break
//         default :
//           // console.log(node)
//           if (_.isArray(machine.node)) {
//             // console.log('catch array ', row, col, isEmpty(row, col), getValue(table, row, col))
//             if (!isEmpty(row, col)) {
//               // console.log('not empty ', row, col)
//               machine.node[InfoSym].setVal(null, Val(row, col))
//             }
//           } else {
//             assert(colTitle, `[Error] tableConvert : colTitle must exist [${row}, ${col}]`)
//             // if (!isEmpty(row, col)) {
//             machine.node[InfoSym].setVal(colTitle, Val(row, col))
//             // }
//           }
//
//           break
//       }
//     }
//
//     assert(_.isEmpty(machine.stack), `tableConvert Error: parse row(${row}) error ==> object parser not close`)
//     let tid = tids[row]
//     assert(tid, `tableConvert Error: id of row(${row}) should exist`)
//     assert(!result[tid], `tableConvert Error: row(${row}) : result of the id ${tid} is already exist, please check the id table ${tids}`)
//     result[tid] = machine.node
//   }
//
//   // console.log(`get desc line : ${JSON.stringify(markLine)}`)
//   table.convert = { tids, result }
//   return table
// }
