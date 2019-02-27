const Plugins = require('../plugin')
const _ = require('lodash')

const { getTypeName, supportedTypes } = require('../utils/schemaConvertor')

function getTsType (typeName) {
  switch (typeName) {
    case supportedTypes.String: return 'string'
    case supportedTypes.Float: return 'number'
    case supportedTypes.UFloat: return 'number'
    case supportedTypes.Int: return 'number'
    case supportedTypes.UInt: return 'number'
    case supportedTypes.Boolean: return 'boolean'
    case supportedTypes.Undefined: return 'undefined'
    case supportedTypes.Any: return 'any'
    default:
      if (typeName.startsWith(supportedTypes.Array)) {
        let typeInnerAll = getTypeName(typeName).args
        let typeInner = typeInnerAll.length > 0 ? typeInnerAll[0] : 'any'
        // console.log('typeInnerAll', 'array', typeName, typeInnerAll)
        return `${getTsType(typeInner)}[]`
      } else if (typeName.startsWith(supportedTypes.Pair)) {
        let typeInnerAll = getTypeName(typeName).args
        let typeInner = typeInnerAll.length > 0 ? typeInnerAll[0] : 'any'
        // console.log('typeInnerAll', 'Map', typeInnerAll)
        return `{key: string, val: ${getTsType(typeInner)}}`
      }
      return 'any'
  }
}

function dealSchema (schema, inArray = false, depth = 1) {
  let result = ''
  let space = ' '.repeat(depth * 2)
  let split = inArray ? ')|' : ';'
  let itemSql = []
  const rcv = (str) => {
    if (!inArray) {
      result += str
    } else {
      itemSql.push(str)
      // console.log('itemSql', depth, itemSql)
    }
  }

  for (let key in schema) {
    let temp = (inArray ? '(' : space + key + ': ')
    let schemaType = schema[key]
    if (_.isArray(schemaType)) {
      temp += dealSchema(schemaType, true, depth + 1)
      temp = temp.substr(0, temp.length - 1) + '[]' + split
      rcv(temp)
    } else if (_.isObject(schemaType)) {
      temp += '{\n'
      temp += dealSchema(schemaType, false, depth + 1)
      temp += space + '}' + split
      rcv(temp)
    } else {
      temp += `${getTsType(schemaType)}${split}`
      rcv(temp)
    }
    // if (inArray) break // nest array only accept the first type
    if (!inArray) {
      result += '\n'
    }
  }

  if (inArray) {
    let typeOr = []
    itemSql.forEach(str => {
      if (typeOr.indexOf(str) < 0) {
        // console.log('typeOr.indexOf(str)', typeOr, str, typeOr.indexOf(str))
        typeOr.push(str)
      }
    })
    let merge = typeOr.reduce((p, c) => p + c)
    // console.log('==> typeOr itemSql ', typeOr, itemSql, 'res', result, 'merge', merge)
    result += merge
  }
  return result
}

function culturelize (s) {
  s = s.toLowerCase()
  if (s.length <= 0) return ''
  let ret = s.substr(0, 1).toUpperCase() + s.substr(1)
  // console.log(ret)
  return ret
}

function makeInterfaceName (fileName) {
  return fileName.split(/[\s._-]/).reduce((p, c) => p + culturelize(c), 'I')
}

const tsInterfaceSerializer = {
  plugins: [Plugins.schema, Plugins.convert],
  file: (data, fileName) => {
    // console.log(data.schema)
    return `export interface ${makeInterfaceName(fileName)}{
${dealSchema(data.schema)}
}`
  }
}

module.exports = {
  dealSchema,
  makeInterfaceName,
  tsInterfaceSerializer
}
