/**
 * rule:
 *
 * Mark => [Decorators] TypeSegment
 * Decorators => Decorator[<'|'>Decorators]
 * TypeSegment => [TypeGroup][<'?'>]
 * TypeGroup => Type[<'|'>TypeGroup]
 * Type => TypeName[<'<'>TypeGroup<'>'>]
 * Decorator => <'$'>Identity
 * Type => Identity
 */

export const supportedTypes = {
  None: 'none',
  String: 'string',
  Float: 'float',
  UFloat: 'uiloat',
  Int: 'int',
  UInt: 'uint',
  Boolean: 'boolean',
  Undefined: 'undefined',
  Any: 'any', // not recommend
  Pair: 'pair', // not recommend
  Array: 'array' // not recommend
}

export class MarkObject {
  constructor (decorators, typeObjects) {
    this.decorators = decorators
    this.typeObjects = typeObjects
  }

  toSchemaStr () {
    return `${this.typeObjects.reduce((prev, tObj) => prev + '|' + tObj.toSchemaStr(), '').substr(1)}`
  }
}

export class TypeObject {
  constructor () {
    this.type = undefined
    this.args = []
  }

  toSchemaStr () {
    if (!this.type) {
      throw new Error('the type dose not exit')
    }
    const templateArgStr = this.args.reduce((prev, tObj) => prev + '|' + tObj.toSchemaStr(), '').substr(1)
    return templateArgStr ? `${this.type}<${templateArgStr}>` : `${this.type}`
  }
}

export function filterDecorators (markStr) {
  return {
    decorators: markStr.match(/\$[a-zA-Z0-9_]+/g),
    strLeft: markStr.replace(/\$[a-zA-Z0-9_]+/g, '').trim()
  }
}

export function parseMark (markStr) {
  const { decorators, strLeft } = filterDecorators(markStr)
  const typeObjects = analyzeTypeSegment(strLeft)
  return new MarkObject(decorators, typeObjects)
}

export function analyzeTypeSegment (typeSegment) {
  const optional = false
  if (typeSegment.endsWith('?')) {
    typeSegment = typeSegment.substring(0, typeSegment.length - 1)
  }
  const typeGroup = typeSegment.trim()
  if (!typeGroup) {
    throw new Error('typeGroup not exist')
  }
  const typeObjs = typeGroup.split('|')
    .map(getTypeObject)
  if (optional) {
    typeObjs.push(new TypeObject({ type: supportedTypes.Undefined }))
  }
  return typeObjs
}

export function catchTemplate (str) {
  str = str.trim()
  let leftAngle = str.indexOf('<')
  let rightAngle = str[str.length - 1] === '>' ? str.length - 1 : -1
  if (leftAngle >= 0 && rightAngle >= 0) {
    return analyzeTypeSegment(str.substr(leftAngle + 1, rightAngle - leftAngle - 1))
  } else if (leftAngle >= 0 || rightAngle >= 0) {
    throw new Error(`getTypeName error : angle not match ${str}`)
  }
  return []
}

export function getTypeObject (typeName) {
  const typeObject = new TypeObject()
  // console.log(typeName)
  typeName = typeName.trim().toLowerCase()
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
        typeObject.args = catchTemplate(typeName) // only support first type right now
        break
      }
      if (typeName.startsWith(supportedTypes.Pair)) {
        typeObject.type = supportedTypes.Pair
        typeObject.args = catchTemplate(typeName)
        break
      }
      typeObject.type = supportedTypes.Undefined
      // typeObject.args = [typeName]
      break
  }
  return typeObject
}
