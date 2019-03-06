const tableDescPlugin = require('./desc')
const tableEnsureRowsPlugin = require('./erows')
const { getTypeName } = require('../utils/schemaConvertor')
const assert = require('assert')
const _ = require('lodash')
const {
  STRUCT_TYPES,
  InfoSym,
  Analyze,
  Machine
} = require('./analyze/index')

module.exports = function tableConvert (table) {
  if (!table.tableMark || !table.markLine || !table.descLine) {
    table = tableEnsureRowsPlugin(table)
    table = tableDescPlugin(table)
  }

  const { getValue, tableMark, markLine, descLine } = table

  // console.log(`scan row ${row}, ${JSON.stringify(table.data[row])}`)
  let machine = new Machine()
  let markCols = Object.keys(markLine)
  for (let colInd in markCols) {
    if (!markCols.hasOwnProperty(colInd)) {
      continue
    }
    let col = markCols[colInd]
    let colType = getValue(table, tableMark.row, col).trim() // colType in mark line will never be empty
    let colTitle = descLine[col]

    let colAnalysis = Analyze(colType)
    switch (colAnalysis.type) {
      case STRUCT_TYPES.OBJ_START:
        machine.enterStackObj(colTitle)[InfoSym].setAnalysisResult(colAnalysis)
        break
      case STRUCT_TYPES.ARR_START:
        machine.enterStackArr(colTitle)[InfoSym].setAnalysisResult(colAnalysis)
        break
      case STRUCT_TYPES.OBJ_END:
      case STRUCT_TYPES.ARR_END:
        machine.exitStack()
        break
      default :
        let typeObj = getTypeName(colType)
        let args = typeObj.args
        let stack = [typeObj.type]
        while (args.length > 0) {
          typeObj = getTypeName(args[0])
          args = typeObj.args
          stack.push(typeObj.type)
        }

        let typeResult = stack.length === 1 ? stack[0] : stack.reverse().reduce((prev, cur) => `${cur}<${prev}>`)
        if (_.isArray(machine.node)) {
          machine.node.push(typeResult)
        } else {
          assert(colTitle, `table schema Error: colTitle must exist [${col}]`)
          machine.node[colTitle] = typeResult
        }
        break
    }
  }

  // console.log(`get desc line : ${JSON.stringify(markLine)}`)
  table.schema = machine.node
  return table
}
