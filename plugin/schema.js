const tableDescPlugin = require('./desc')
const tableEnsureRowsPlugin = require('./erows')
const { getTypeName } = require('../utils/schemaConvertor')
const assert = require('assert')
const _ = require('lodash')
const {
  STRUCT_TYPES,
  DECORATORS,
  Analysis,
  InfoSym,
  createObj,
  createArr
} = require('./core/analyze')

module.exports = function tableConvert (table) {
  if (!table.tableMark || !table.markLine || !table.descLine) {
    table = tableEnsureRowsPlugin(table)
    table = tableDescPlugin(table)
  }

  const { getValue, tableMark, markLine, descLine } = table

  let stack = []
  let node = {}
  const enterStack = (title, child) => {
    stack.push(node)
    if (_.isArray(node)) {
      if (title) console.log(`[WARNING] got redundant title ${title}`)
      node.push(child)
      child[InfoSym]['parentKey'] = node.length - 1
    } else {
      assert(title, `tableConvert Error: colTitle of child ${child} must exist`)
      node[title] = child
      child[InfoSym]['parentKey'] = title
    }
    node = child
  }
  const exitStack = () => {
    const orgNode = node
    node = stack.pop()
    return orgNode
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

    let colAnalysis = Analysis(colType)
    switch (colAnalysis.type) {
      case STRUCT_TYPES.OBJ_START:
        enterStack(colTitle, createObj())
        node[InfoSym]['decorator'] = colAnalysis.decorator
        break
      case STRUCT_TYPES.ARR_START:
        enterStack(colTitle, createArr())
        node[InfoSym]['decorator'] = colAnalysis.decorator
        break
      case STRUCT_TYPES.OBJ_END:
      case STRUCT_TYPES.ARR_END:
        exitStack()
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
        if (_.isArray(node)) {
          node.push(typeResult)
        } else {
          assert(colTitle, `table schema Error: colTitle must exist [${col}]`)
          node[colTitle] = typeResult
        }
        break
    }
  }

  // console.log(`get desc line : ${JSON.stringify(markLine)}`)
  table.schema = node
  return table
}
