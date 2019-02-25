const tableDescPlugin = require('./desc')
const tableEnsureRowsPlugin = require('./erows')
const { getTypeName } = require('../utils/schemaConvertor')
const assert = require('assert')
const _ = require('lodash')

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
    } else {
      assert(title, `tableConvert Error: colTitle of child ${child} must exist`)
      node[title] = child
    }
    node = child
  }
  const exitStack = () => {
    node = stack.pop()
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
