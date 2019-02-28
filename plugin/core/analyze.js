const assert = require('assert')
const _ = require('lodash')

const STRUCT_TYPES = {
  PLAIN: 'PLAIN',
  OBJ_START: 'OBJ_START',
  OBJ_END: 'OBJ_END',
  ARR_START: 'ARR_START',
  ARR_END: 'ARR_END'
}

const DECORATORS = {
  ONE_OF: 'oneof'
}

const InfoSym = Symbol('InfoSym')

class AnalysisResult {
  constructor (type, decorators) {
    this.type = type || ''
    this.decorators = decorators || []
  }
}

function Analyze (colType) {
  if (colType.endsWith('{')) {
    return new AnalysisResult(STRUCT_TYPES.OBJ_START)
  } else if (colType.endsWith('[')) {
    return new AnalysisResult(
      STRUCT_TYPES.ARR_START,
      colType.substr(0, colType.length - 1).split('|').filter(s => s).map(s => s.trim())
    )
  } else if (colType.startsWith('}')) {
    return new AnalysisResult(STRUCT_TYPES.OBJ_END)
  } else if (colType.startsWith(']')) {
    return new AnalysisResult(STRUCT_TYPES.ARR_END)
  }
  return new AnalysisResult(STRUCT_TYPES.PLAIN)
}

function makeInfo (obj) {
  obj[InfoSym] = {}
  obj[InfoSym].setAnalysisResult = (analysisResult) => { obj[InfoSym]['AnalysisResult'] = analysisResult }
  obj[InfoSym].hasDecorator = (decorator) => obj[InfoSym]['AnalysisResult'].decorators.indexOf(decorator) >= 0
  return obj
}

function createObj () {
  return makeInfo({})
}

function createArr () {
  return makeInfo([])
}

class Machine {
  constructor () {
    this.node = createObj()
    this.root = this.node
    this.stack = []
  }

  enterStack (newNode, onFinish = null) {
    this.stack.push(this.node)
    this.node = newNode
    if (onFinish) {
      this.node[InfoSym]['onFinish'] = onFinish
    }
    return this.node
  }

  setChild (title, child) {
    if (_.isArray(this.node)) {
      this.node.push(child)
      child[InfoSym]['parentKey'] = this.node.length - 1
    } else {
      assert(title, `tableConvert Error: colTitle of child ${child} must exist`)
      this.node[title] = child
      child[InfoSym]['parentKey'] = title
    }
    return child
  }

  enterStackObj (title, onFinish = null) {
    return this.enterStack(this.setChild(title, createObj()), onFinish)
  }

  enterStackArr (title, onFinish = null) {
    return this.enterStack(this.setChild(title, createArr()), onFinish)
  }

  exitStack () {
    assert(this.node !== this.root, 'reached the bottom of the stack')
    const orgNode = this.node
    this.node = this.stack.pop()
    if (orgNode[InfoSym]['onFinish']) {
      orgNode[InfoSym]['onFinish'](this.node, orgNode[InfoSym]['parentKey'], orgNode)
    }
    return orgNode
  }
}

module.exports = {
  STRUCT_TYPES,
  DECORATORS,
  InfoSym,
  Analyze,
  Machine
}
