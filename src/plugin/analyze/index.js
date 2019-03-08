import { filterDecorators } from '../../schema/typeNameConvertor'
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
  ONE_OF: '$oneof'
}

const InfoSym = Symbol('InfoSym')

class AnalysisResult {
  constructor (type, decorators) {
    this.type = type || ''
    this.decorators = decorators || []
  }
}

function Index (mark) {
  const { decorators, strLeft } = filterDecorators(mark)
  const t = (struct) => new AnalysisResult(struct, decorators)
  if (strLeft.endsWith('{')) {
    return t(STRUCT_TYPES.OBJ_START)
  } else if (strLeft.endsWith('[')) {
    return t(STRUCT_TYPES.ARR_START)
  } else if (strLeft.startsWith('}')) {
    return t(STRUCT_TYPES.OBJ_END)
  } else if (strLeft.startsWith(']')) {
    return t(STRUCT_TYPES.ARR_END)
  }
  return t(STRUCT_TYPES.PLAIN)
}

function makeInfo (obj) {
  obj[InfoSym] = {
    inArray: false,
    mirror: JSON.parse(JSON.stringify(obj)),
    setAnalysisResult: (analysisResult) => {
      obj[InfoSym].AnalysisResult = analysisResult
    },
    hasDecorator: (decorator) => {
      return obj[InfoSym].AnalysisResult.decorators.indexOf(decorator) >= 0
    },
    setVal: (key, val) => {
      if (_.isArray(obj)) {
        obj.push(val)
        obj[InfoSym].mirror.push(val)
      } else {
        obj[key] = val
        obj[InfoSym].mirror[key] = val
      }
    },
    delVal: (key) => {
      if (_.isArray(obj)) {
        obj.splice(key, 1)
      } else {
        obj[key] = undefined
      }
    }
  }
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

  get operator () {
    return this.node[InfoSym]
  }

  enterStack (newNode, onFinish = null) {
    this.stack.push(this.node)
    this.node = newNode
    if (onFinish) {
      this.node[InfoSym].onFinish = onFinish
    }
    return this.node
  }

  setChild (title, child) {
    if (_.isArray(this.node)) {
      this.node.push(child)
      child[InfoSym].inArray = true
      child[InfoSym].parentKey = this.node.length - 1
    } else {
      assert(title, `tableConvert Error: colTitle of child ${child} must exist`)
      this.node[title] = child
      child[InfoSym].inArray = false
      child[InfoSym].parentKey = title
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
    if (orgNode[InfoSym].onFinish) {
      orgNode[InfoSym].onFinish(this.node, orgNode[InfoSym].parentKey, orgNode)
    }
    return orgNode
  }
}

module.exports = {
  STRUCT_TYPES,
  DECORATORS,
  InfoSym,
  Analyze: Index,
  Machine
}
