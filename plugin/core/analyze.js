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

function Analysis (colType) {
  const ret = {
    type: '',
    decorator: []
  }

  if (colType.endsWith('{')) {
    ret.type = STRUCT_TYPES.OBJ_START
  } else if (colType.endsWith('[')) {
    ret.type = STRUCT_TYPES.ARR_START
    ret.decorator = colType.substr(0, colType.length - 1).split('|').filter(s => s).map(s => s.trim())
  } else if (colType.startsWith('}')) {
    ret.type = STRUCT_TYPES.OBJ_END
  } else if (colType.startsWith(']')) {
    ret.type = STRUCT_TYPES.ARR_END
  } else {
    ret.type = STRUCT_TYPES.PLAIN
  }

  return ret
}

const InfoSym = Symbol('InfoSym')

const createObj = () => {
  const ret = { }
  ret[InfoSym] = {}
  return ret
}

const createArr = () => {
  const ret = [ ]
  ret[InfoSym] = {}
  return ret
}

module.exports = {
  STRUCT_TYPES,
  DECORATORS,
  Analysis,
  InfoSym,
  createObj,
  createArr
}
