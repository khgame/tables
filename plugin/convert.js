const tableDescPlugin = require('./desc')
const tableEnsureRowsPlugin = require('./erows')
const { getConvertor } = require('../utils/typeNameConvertor')
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

  let stack = []
  let node = {}
  const enterStack = (title, child) => {
    stack.push(node)
    if (_.isArray(node)) {
      node.push(child)
    } else {
      assert(title, `tableConvert Error: colTitle of child ${child} must exist`)
      node[title] = child
    }
    node = child
  }
  const exitStack = () => { node = stack.pop() }
  const result = {}

  for (let rowInd in erows) {
    let row = parseInt(erows[rowInd])
    // console.log(`enter row ${row}/${erows}`)
    if (row < startRow) {
      continue
    }

    // console.log(`scan row ${row}, ${JSON.stringify(table.data[row])}`)
    node = {}
    let markCols = Object.keys(markLine)
    for (let colInd in markCols) {
      if (!markCols.hasOwnProperty(colInd)) {
        continue
      }
      let col = markCols[colInd]
      let colType = getValue(table, tableMark.row, col).trim() // colType in mark line will never be empty
      let colTitle = descLine[col]

      switch (colType) {
        case '{':
          enterStack(colTitle, {})
          break
        case '[':
          enterStack(colTitle, [])
          break
        case '}':
        case ']':
          exitStack()
          break
        default :
          if (_.isArray(node)) {
            // console.log('catch array ', row, col, isEmpty(row, col), getValue(table, row, col))
            if (!isEmpty(row, col)) {
              // console.log('not empty ', row, col)
              node.push(Val(row, col))
            }
          } else {
            assert(colTitle, `tableConvert Error: colTitle must exist [${row}, ${col}]`)
            node[colTitle] = Val(row, col)
          }

          break
      }
    }

    assert(_.isEmpty(stack), `tableConvert Error: parse row(${row}) error ==> object parser not close`)
    let tid = tids[row]
    assert(tid, `tableConvert Error: id of row(${row}) should exist`)
    assert(!result[tid], `tableConvert Error: row(${row}) : result of the id ${tid} is already exist, please check the id table ${tids}`)
    result[tid] = node
  }

  // console.log(`get desc line : ${JSON.stringify(markLine)}`)
  table.convert = { tids, result }
  return table
}
