const supportedTypes = {
  String: 'String',
  Float: 'Float',
  UFloat: 'UFloat',
  Int: 'Int',
  UInt: 'UInt',
  Boolean: 'Boolean',
  Undefined: 'Undefined'
}

function getTypeName (typeName) {
  switch (typeName) {
    case 'string':
    case 'str':
      return supportedTypes.String
    case 'double':
    case 'single':
    case 'float':
    case 'num':
    case 'number':
      return supportedTypes.Float
    case 'count':
    case 'ufloat':
      return supportedTypes.UFloat
    case 'int':
    case 'int8':
    case 'int16':
    case 'int32':
    case 'int64':
    case 'long':
      return supportedTypes.Int
    case 'uint':
    case 'uint8':
    case 'uint16':
    case 'uint32':
    case 'uint64':
    case 'ulong':
    case 'tid':
    case '@':
      return supportedTypes.UInt
    case 'bool':
      return supportedTypes.Boolean
    default:
      return supportedTypes.Undefined
  }
}

module.exports = {
  supportedTypes,
  getTypeName
}
