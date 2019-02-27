const supportedTypes = {
  String: 'String',
  Float: 'Float',
  UFloat: 'UFloat',
  Int: 'Int',
  UInt: 'UInt',
  Boolean: 'Boolean',
  Undefined: 'Undefined',
  Any: 'Any', // not recommend
  Pair: 'Pair', // not recommend
  Array: 'Array' // not recommend
}

function catchTemplate (str, splitor) {
  str = str.trim()
  let leftAngle = str.indexOf('<')
  let rightAngle = str[str.length - 1] === '>' ? str.length - 1 : -1
  if (leftAngle >= 0 && rightAngle >= 0) {
    return str.substr(leftAngle + 1, rightAngle - leftAngle - 1).split(splitor)
  } else if (leftAngle >= 0 || rightAngle >= 0) {
    throw new Error(`getTypeName error : angle not match ${str}`)
  }
  return []
}

function getTypeName (typeName) {
  let typeObject = {
    type: undefined,
    args: []
  }
  typeName = typeName.trim()
  switch (typeName) {
    case 'string':
    case 'str':
      typeObject.type = supportedTypes.String
      break
    case 'double':
    case 'single':
    case 'float':
    case 'num':
    case 'number':
      typeObject.type = supportedTypes.Float
      break
    case 'count':
    case 'ufloat':
      typeObject.type = supportedTypes.UFloat
      break
    case 'int':
    case 'int8':
    case 'int16':
    case 'int32':
    case 'int64':
    case 'long':
      typeObject.type = supportedTypes.Int
      break
    case 'uint':
    case 'uint8':
    case 'uint16':
    case 'uint32':
    case 'uint64':
    case 'ulong':
    case 'tid':
    case '@':
      typeObject.type = supportedTypes.UInt
      break
    case 'bool':
    case 'onoff':
      typeObject.type = supportedTypes.Boolean
      break
    case 'dynamic':
    case 'object':
    case 'obj':
    case 'any':
      typeObject.type = supportedTypes.Any
      break
    default:
      if (typeName.startsWith(supportedTypes.Array)) {
        typeObject.type = supportedTypes.Array
        typeObject.args = catchTemplate(typeName, '|')
        break
      }
      if (typeName.startsWith(supportedTypes.Pair)) {
        typeObject.type = supportedTypes.Pair
        typeObject.args = catchTemplate(typeName, '-')
        break
      }
      typeObject.type = supportedTypes.Undefined
      break
  }

  return typeObject
}

module.exports = {
  supportedTypes,
  getTypeName,
  catchTemplate
}
