const STRUCT_TYPES = {
  PLAIN: 'PLAIN',
  OBJ_START: 'OBJ_START',
  OBJ_END: 'OBJ_END',
  ARR_START: 'ARR_START',
  ARR_END: 'ARR_END'
}

function Analysis (colType) {
  const ret = {
    type: '',
    decorator: ''
  }

  if (colType.endsWith('{')) {
    ret.type = STRUCT_TYPES.OBJ_START
  } else if (colType.endsWith('[')) {
    ret.type = STRUCT_TYPES.ARR_START
  } else if (colType.startsWith('}')) {
    ret.type = STRUCT_TYPES.OBJ_END
  } else if (colType.startsWith(']')) {
    ret.type = STRUCT_TYPES.ARR_END
  } else {
    ret.type = STRUCT_TYPES.PLAIN
  }

  return ret
}

module.exports = {
  STRUCT_TYPES,
  Analysis
}
