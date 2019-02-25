const Plugins = require('../plugin')
const _ = require('lodash')

const { supportedTypes } = require('../utils/schemaConvertor')

function getTsTypeName (typeName) {
  switch (typeName) {
    case supportedTypes.String: return 'string'
    case supportedTypes.Float: return 'number'
    case supportedTypes.UFloat: return 'number'
    case supportedTypes.Int: return 'number'
    case supportedTypes.UInt: return 'number'
    case supportedTypes.Boolean: return 'boolean'
    case supportedTypes.Undefined: return 'undefined'
    case supportedTypes.Any: return 'any'
    case supportedTypes.Array: return 'Array'
    case supportedTypes.Map: return 'any'
    default: return '=-='
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
      console.log('itemSql', depth, itemSql)
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
      temp += `${getTsTypeName(schemaType)}${split}`
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
        console.log('typeOr.indexOf(str)', typeOr, str, typeOr.indexOf(str))
        typeOr.push(str)
      }
    })
    let merge = typeOr.reduce((p, c) => p + c)
    console.log('==> typeOr itemSql ', typeOr, itemSql, 'res', result, 'merge', merge)
    result += merge
  }
  return result
}

const tsInterfaceSerializer = {
  plugins: [Plugins.schema, Plugins.convert],
  file: (data, fileName) => {
    console.log(data.schema)
    return `export interface I${fileName.replace('.', '_')}{
${dealSchema(data.schema)}
}`
  }
}

module.exports = {
  tsInterfaceSerializer
}
