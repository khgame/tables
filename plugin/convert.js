const tableDescPlugin = require('./desc')
const { getConvertor } = require('../utils/typeNameConvertor')
const _ = require('lodash')

module.exports = function tableConvert (table) {
  if (!table.tableMark || !table.markLine || !table.descLine) {
    table = tableDescPlugin(table)
  }

  const { getValue, cols, rows, tableMark, markLine, descLine } = table
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
    console.log(`convert ${row},${col}:${val}`)
    return convertors[col](val)
  }

  const startRow = tableMark.row + 2

  let stack = []
  let node = {}
  const enterStack = (title, child) => {
    stack.push(node)
    if (_.isArray(node)) {
      node.push(child)
    } else {
      node[title] = child
    }
    node = child
  }
  const exitStack = () => { node = stack.pop() }
  const result = {}
  for (let row in rows) {
    row = parseInt(row)
    if (row < startRow) {
      continue
    }
    node = {}
    for (let colInd in cols) {
      if (!cols.hasOwnProperty(colInd)) {
        continue
      }
      let col = cols[colInd]
      let colType = getValue(table, tableMark.row, col).trim()
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
          let val = Val(row, col)
          node[colTitle] = val
          break
      }
    }

    if (!_.isEmpty(stack)) {
      throw new Error(`tableConvert Error: parse row(${row}) error ==> object parser not close`)
    }
    if (!tids[row]) {
      throw new Error(`tableConvert Error: id of row(${row}) not exist`)
    }
    if (result[tids[row]]) {
      throw new Error(`tableConvert Error: row(${row}) : result of the id ${tids[row]} is already exist, please check the id table ${tids}`)
    }
    result[tids[row]] = node
  }

  console.log(`get desc line : ${JSON.stringify(markLine)}`)
  table.convert = { tids, result }
  return table
}
