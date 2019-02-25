const supportedTypes = {
  String: 'String',
  Float: 'Float',
  UFloat: 'UFloat',
  Int: 'Int',
  UInt: 'UInt',
  Boolean: 'Boolean',
  Undefined: 'Undefined',
  Map: 'Map', // not recommend
  Array: 'Array' // not recommend
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
      typeObject.type = supportedTypes.Boolean
      break
    default:
      if (typeName.startsWith(supportedTypes.Array)) {
        typeObject.type = supportedTypes.Array
        let typeArgs = typeName.substr(supportedTypes.Array.length)
        if (!typeArgs) break
        let leftAngle = typeArgs.indexOf('<')
        let rightAngle = typeArgs[typeArgs.length - 1] === '>' ? typeArgs.length - 1 : -1
        if (leftAngle >= 0 && rightAngle >= 0) {
          typeObject.args = typeArgs.substr(leftAngle + 1, rightAngle - leftAngle - 1).split('|')
        } else if (leftAngle >= 0 || rightAngle >= 0) {
          throw new Error(`getTypeName error : angle not match ${typeName}`)
        }
        break
      }
      if (typeName.startsWith(supportedTypes.Map)) {
        typeObject.type = supportedTypes.Map
        let typeArgs = typeName.substr(supportedTypes.Map.length)
        if (!typeArgs) break
        let leftAngle = typeArgs.indexOf('<')
        let rightAngle = typeArgs[typeArgs.length - 1] === '>' ? typeArgs.length - 1 : -1
        if (leftAngle >= 0 && rightAngle >= 0) {
          typeObject.args = typeArgs.substr(leftAngle + 1, rightAngle - leftAngle - 1).split('|')
        } else if (leftAngle >= 0 || rightAngle >= 0) {
          throw new Error(`getTypeName error : angle not match ${typeName}`)
        }
        break
      }
      typeObject.type = supportedTypes.Undefined
      break
  }

  return typeObject
}

module.exports = {
  supportedTypes,
  getTypeName
}
