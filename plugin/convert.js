const tableDescPlugin = require('./desc')
const tableEnsureRowsPlugin = require('./erows')
const { getConvertor } = require('../utils/typeNameConvertor')
const {
  STRUCT_TYPES,
  DECORATORS,
  Analysis,
  InfoSym,
  Machine
} = require('./core/analyze')
const assert = require('assert')
const _ = require('lodash')

module.exports = function tableConvert (table) {
  if (!table.tableMark || !table.markLine || !table.descLine) {
    table = tableEnsureRowsPlugin(table)
    table = tableDescPlugin(table)
  }

  const { getValue, erows, tableMark, markLine, descLine } = table
  const convertors = {}
  const idSeg = {}
  Object.keys(markLine).forEach(col => {
    convertors[col] = getConvertor(markLine[col])
    idSeg[col] = markLine[col].trim() === '@'
  })

  const tids = {}
  const Val = (row, col) => {
    let val = getValue(table, row, col)
    if (idSeg[col]) {
      tids[row] = tids[row] ? tids[row] + _.toString(val) : _.toString(val)
    }
    // console.log(`convert ${row},${col}:${val}`)
    try {
      return convertors[col](val)
    } catch (ex) {
      throw new TypeError(`Convert Error for col(${col}) ${descLine[col]}:${markLine[col]} \n ${ex.message}`)
    }
  }

  const isEmpty = (row, col) => {
    let val = getValue(table, row, col)
    return !val
  }

  const startRow = tableMark.row + 2

  const result = {}

  for (let rowInd in erows) {
    let row = parseInt(erows[rowInd])
    // console.log(`enter row ${row}/${erows}`)
    if (row < startRow) {
      continue
    }

    let machine = new Machine()

    // console.log(`scan row ${row}, ${JSON.stringify(table.data[row])}`)
    let markCols = Object.keys(markLine)
    for (let colInd in markCols) {
      if (!markCols.hasOwnProperty(colInd)) {
        continue
      }
      let col = markCols[colInd]
      let colType = getValue(table, tableMark.row, col).trim() // colType in mark line will never be empty
      let colTitle = descLine[col]

      let colAnalysis = Analysis(colType)
      // console.log('colType:', colType, 'colTitle:', colTitle, 'colAnalysis:', colAnalysis)
      switch (colAnalysis.type) {
        case STRUCT_TYPES.OBJ_START:
          machine.enterStackObj(colTitle)[InfoSym]['decorator'] = colAnalysis.decorator
          break
        case STRUCT_TYPES.ARR_START:
          machine.enterStackArr(
            colTitle,
            (parent, parentKey, me) => {
              if (me[InfoSym]['decorator'].indexOf(DECORATORS.ONE_OF) >= 0) {
                if (me.length <= 0) {
                  throw Error(`array with decorator(${DECORATORS.ONE_OF}) must have at least one element.`)
                } else if (me.length > 1) {
                  console.log(`[Warning] detected more than on element of array with decorator(${DECORATORS.ONE_OF}).`)
                }
                parent[parentKey] = me[0]
              }
            })[InfoSym]['decorator'] = colAnalysis.decorator
          break
        case STRUCT_TYPES.OBJ_END:
          machine.exitStack()
          break
        case STRUCT_TYPES.ARR_END:
          machine.exitStack()
          break
        default :
          // console.log(node)
          if (_.isArray(machine.node)) {
            // console.log('catch array ', row, col, isEmpty(row, col), getValue(table, row, col))
            if (!isEmpty(row, col)) {
              // console.log('not empty ', row, col)
              machine.node.push(Val(row, col))
            }
          } else {
            assert(colTitle, `[Error] tableConvert : colTitle must exist [${row}, ${col}]`)
            machine.node[colTitle] = Val(row, col)
          }

          break
      }
    }

    assert(_.isEmpty(machine.stack), `tableConvert Error: parse row(${row}) error ==> object parser not close`)
    let tid = tids[row]
    assert(tid, `tableConvert Error: id of row(${row}) should exist`)
    assert(!result[tid], `tableConvert Error: row(${row}) : result of the id ${tid} is already exist, please check the id table ${tids}`)
    result[tid] = machine.node
  }

  // console.log(`get desc line : ${JSON.stringify(markLine)}`)
  table.convert = { tids, result }
  return table
}
