import { makeInterfaceName } from '../utils/names'
import { tableSchema, tableConvert } from '../plugin'
import deepEqual from 'deep-equal'

import { MarkType, SDMType, SupportedTypes } from '@khgame/schema'
import { cyan } from 'chalk'

const _ = require('lodash');

function getTsType (tName, innerTypeString) {
  switch (tName) {
    case SupportedTypes.String:
      return 'string'
    case SupportedTypes.Float:
      return 'number'
    case SupportedTypes.UFloat:
      return 'number'
    case SupportedTypes.Int:
      return 'number'
    case SupportedTypes.UInt:
      return 'number'
    case SupportedTypes.Boolean:
      return 'boolean'
    case SupportedTypes.Undefined:
      return 'undefined'
    case SupportedTypes.Any:
      return 'any'
    case SupportedTypes.Array:
      return innerTypeString.length > 9 ? `Array<${innerTypeString || 'any'}>` : `${innerTypeString || 'any'}[]`
    case SupportedTypes.Pair:
      return `{key: string, val: ${innerTypeString || 'any'}}`
    default:
      return 'none'
  }
}

function tNodeToType (node) {
  return getTsType(node.tName, node.innerCount > 0 ? tSegToType(node.tSeg) : undefined)
}

function tSegToType (tSeg) {
  if (tSeg.nodes.length <= 0) { // no template
    return ''
  }
  const types = tSeg.nodes.map(n => tNodeToType(n))
  if (types.length <= 0) {
    throw new Error(`error: tdm ${JSON.stringify(tSeg)} are empty`)
  }
  return types.reduce((prev, cur) => prev + '|' + cur, '').substr(1)
}

function tdmToType (tdm, descs) {
  const types = []
  for (let i = 0; i < tdm.innerCount; i++) {
    types.push(tNodeToType(tdm.inner(i)))
  }
  return [descs[tdm.markInd], types.reduce((prev, cur) => prev + '|' + cur, '').substr(1)]
}

function mergeSdmArr (result, splitor, inNoStrictArray) {
  // console.log('result', result)
  if (inNoStrictArray) {
    result = result.map(s => [s[0], s[1].replace('|undefined', '')]).filter(s => s[1] !== 'undefined')
  }

  result = result.filter((item, index, array) => {
    return index === array.findIndex(v => {
      // console.log('deepEqual', item, v, deepEqual(item[1], v[1]))
      return deepEqual(item[1], v[1])
    })
  })
  let ret = result.reduce((prev, cur) => prev + splitor + cur[1], '').substr(splitor.length)
  // console.log('ret', ret)
  return ret
}

function sdmToType (sdm, descs, depth = 0) {
  let result = []
  sdm.marks.forEach(dm => {
    switch (dm.markType) {
      case MarkType.SDM:
        result.push(sdmToType(dm, descs, depth + 1))
        break
      case MarkType.TDM:
        result.push(tdmToType(dm, descs))
        break
    }
  })

  let ret = ''
  let space = '  '.repeat(depth + 1)
  let spaceOut = '  '.repeat(depth)
  switch (sdm.sdmType) {
    case SDMType.Arr:
      if (sdm.mds.findIndex(str => str === '$strict') >= 0) {
        ret = result.length <= 0
          ? '[]'
          : (result.length > 1
            ? '[\n' + space + mergeSdmArr(result, ',\n' + space) + '\n' + spaceOut + ']'
            : '[' + result[0][1] + ']'
          )
      } else {
        ret = result.length <= 0
          ? '[]'
          : (result.length > 1 || result[0][1].length > 9
            ? 'Array<' + mergeSdmArr(result, '|', true) + '>'
            : result[0][1] + '[]'
          )
      }
      if (sdm.mds.findIndex(str => str === '$ghost') >= 0) {
        ret += '|undefined'
      }
      break
    case SDMType.Obj:
      ret = result.length <= 0
        ? '{}'
        : '{' +
                (result.length > 1
                  ? result.reduce((prev, cur) => prev + '\n' + space + cur[0] + ': ' + cur[1] + ';', '') + '\n' + spaceOut + '}'
                  : result[0][0] + ': ' + result[0][1] + '}'
                )
      if (sdm.mds.findIndex(str => str === '$ghost') >= 0) {
        ret += '|undefined'
      }
      break
  }
  return [descs[sdm.markInd - 1], ret]
  // deal string
}

export function dealSchema (schema, descLine, markCols) {
  const descs = markCols.map(c => descLine[c])
  const ret = sdmToType(schema, descs)
  console.log(cyan('tsInterface serializer dealSchema success'), JSON.stringify(ret[1], null, 2))
  return ret[1]
}

// export function dealSchema(schema, inArray = false, depth = 1) {
//     console.log(schema)
//     let result = ''
//     let space = ' '.repeat(depth * 2)
//     let split = inArray ? ')|' : ';'
//     let itemSql = []
//
//     const rcv = (str) => {
//         if (!inArray) {
//             result += str
//         } else {
//             itemSql.push(str)
//             // console.log('itemSql', depth, itemSql)
//         }
//     }
//
//     for (let key in schema) {
//         let temp = (inArray ? '(' : space + key + ': ')
//         let schemaType = schema[key]
//         if (_.isArray(schemaType)) {
//             temp += '(' + dealSchema(schemaType, true, depth + 1)
//             temp = temp.substr(0, temp.length - 1) + (schemaType[InfoSym].hasDecorator(DECORATORS.ONE_OF) ? ')' : ')[]') + split
//             rcv(temp)
//         } else if (_.isObject(schemaType)) {
//             temp += '{\n'
//             temp += dealSchema(schemaType, false, depth + 1)
//             temp += space + '}' + split
//             rcv(temp)
//         } else {
//             temp += `${getTsType(schemaType)}${split}`
//             rcv(temp)
//         }
//         // if (inArray) break // nest array only accept the first type
//         if (!inArray) {
//             result += '\n'
//         }
//     }
//
//     if (inArray) {
//         let typeOr = []
//         itemSql.forEach(str => {
//             if (typeOr.indexOf(str) < 0) {
//                 // console.log('typeOr.indexOf(str)', typeOr, str, typeOr.indexOf(str))
//                 typeOr.push(str)
//             }
//         })
//         let merge = typeOr.reduce((p, c) => p + c)
//         // console.log('==> typeOr itemSql ', typeOr, itemSql, 'res', result, 'merge', merge)
//         result += merge
//     }
//     return result
// }

export const tsInterfaceSerializer = {
  plugins: [tableSchema, tableConvert],
  file: (data, fileName) => {
    // console.log(data.schema)
    return `export interface ${makeInterfaceName(fileName)} ${dealSchema(data.schema, data.descLine, data.markCols)}
`
  }
}
