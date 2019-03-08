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
  UFloat: 'ufloat',
  Int: 'int',
  UInt: 'uint',
  Boolean: 'boolean',
  Undefined: 'undefined',
  Any: 'any', // not recommend
  Pair: 'pair', // not recommend
  Array: 'array' // not recommend
}

export const aliasTable = {
  [supportedTypes.String]: [supportedTypes.String, 'str'],
  [supportedTypes.Float]: [supportedTypes.Float, 'double', 'single', 'num', 'number'],
  [supportedTypes.UFloat]: [supportedTypes.UFloat, 'count'],
  [supportedTypes.Int]: [supportedTypes.Int, 'int', 'int8', 'int16', 'int32', 'int64', 'long'],
  [supportedTypes.UInt]: [supportedTypes.UInt, 'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'ulong', 'tid', '@'],
  [supportedTypes.Boolean]: [supportedTypes.Boolean, 'bool', 'onoff'],
  [supportedTypes.Undefined]: [supportedTypes.Undefined],
  [supportedTypes.Any]: [supportedTypes.Any, 'dynamic', 'object', 'obj', 'any'],
  [supportedTypes.Pair]: [supportedTypes.Pair],
  [supportedTypes.Array]: [supportedTypes.Array]
}

function reverseAlias () {
  let ret = {}
  for (const key in aliasTable) {
    aliasTable[key].forEach((a) => {
      ret[a] = key
    })
  }
  return ret
}

export const reverseAliasTable = reverseAlias()

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
  constructor (typeName, templateTypes) {
    this.type = typeName
    this.args = templateTypes
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
    return {
      typeStr: str.substr(0, leftAngle).trim(),
      templateTypes: analyzeTypeSegment(str.substr(leftAngle + 1, rightAngle - leftAngle - 1))
    }
  } else if (leftAngle >= 0 || rightAngle >= 0) {
    throw new Error(`getTypeName error : angle not match ${str}`)
  }
  return {
    typeStr: str.trim(),
    templateTypes: []
  }
}

export function getTypeObject (typeName) {
  const template = catchTemplate(typeName.toLowerCase())
  return new TypeObject(
    reverseAliasTable[template.typeStr] || supportedTypes.None,
    template.templateTypes
  )
}
