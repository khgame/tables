import { makeInterfaceName } from '../utils/names'
import { tableSchema, tableConvert } from '../plugin'
import deepEqual from 'deep-equal'
import { MarkType, SDMType, SupportedTypes } from '@khgame/schema'
import chalk from 'chalk'
import type { Serializer } from '../types'
import * as _ from 'lodash'

function tNodeToType(node: any, context: any): string {
  switch (node.tName) {
    case SupportedTypes.String:
      return 'string'
    case SupportedTypes.Float:
    case SupportedTypes.UFloat:
    case SupportedTypes.Int:
    case SupportedTypes.UInt:
      return 'number'
    case SupportedTypes.Boolean:
      return 'boolean'
    case SupportedTypes.Undefined:
      return 'undefined'
    case SupportedTypes.Any:
      return 'any'
    case SupportedTypes.Array:
      return node.innerCount > 1 ? `Array<${tSegToType(node.tSeg, context) || 'any'}>` : `${tSegToType(node.tSeg, context) || 'any'}[]`
    case SupportedTypes.Pair:
      return `{key: string, val: ${tSegToType(node.tSeg, context) || 'any'}}`
    case SupportedTypes.Enum:
      return `${enumTSegToType(node.tSeg, context)}`
    default:
      return `"${node.rawName}"`
  }
}

function enumTSegToType(tSeg: any, context: any): string {
  if (tSeg.nodes.length <= 0) return ''
  return tSeg.nodes.reduce((prev: string, cur: any) => prev + '|' + ((context.enums || {})[cur.rawName] ? 'TableContext.' + cur.rawName : `${tNodeToType(cur, context)}`), '').substr(1)
}

function tSegToType(tSeg: any, context: any): string {
  if (tSeg.nodes.length <= 0) return ''
  const types = tSeg.nodes.map((n: any) => tNodeToType(n, context))
  if (types.length <= 0) {
    throw new Error(`error: tdm ${JSON.stringify(tSeg)} are empty`)
  }
  return types.reduce((prev: string, cur: string) => prev + '|' + cur, '').substr(1)
}

function tdmToType(tdm: any, descs: any[], context: any): [string, string] {
  const types: string[] = []
  for (let i = 0; i < tdm.innerCount; i++) {
    types.push(tNodeToType(tdm.inner(i), context))
  }
  return [descs[tdm.markInd], types.reduce((prev, cur) => prev + '|' + cur, '').substr(1)]
}

function mergeSdmArr(result: Array<[string, string]>, splitor: string, inNoStrictArray?: boolean): string {
  if (inNoStrictArray) {
    result = result.map(s => [s[0], s[1].replace(/\|undefined$/, '')]).filter(s => s[1] !== 'undefined') as any
  }
  result = result.filter((item, index, array) => index === array.findIndex(v => deepEqual(item[1], v[1])))
  const ret = result.reduce((prev, cur) => prev + splitor + cur[1], '').substr(splitor.length)
  return ret
}

function sdmToType(sdm: any, descs: any[], depth = 0, context: any = {}): [string, string] {
  const result: Array<[string, string]> = []
  sdm.marks.forEach((dm: any) => {
    switch (dm.markType) {
      case MarkType.SDM:
        result.push(sdmToType(dm, descs, depth + 1, context))
        break
      case MarkType.TDM:
        result.push(tdmToType(dm, descs, context))
        break
    }
  })

  let ret = ''
  const space = '  '.repeat(depth + 1)
  const spaceOut = '  '.repeat(depth)
  switch (sdm.sdmType) {
    case SDMType.Arr:
      if (sdm.mds.findIndex((str: string) => str === '$strict') >= 0) {
        ret = result.length <= 0
          ? '[]'
          : (result.length > 1
            ? '[\n' + space + mergeSdmArr(result, ',\n' + space) + '\n' + spaceOut + ']'
            : '[' + result[0][1] + ']')
      } else {
        ret = result.length <= 0
          ? '[]'
          : (result.length > 1 || result[0][1].length > 9
            ? 'Array<' + mergeSdmArr(result, '|', true) + '>'
            : result[0][1] + '[]')
      }
      if (sdm.mds.findIndex((str: string) => str === '$ghost') >= 0) {
        ret += '|undefined'
      }
      break
    case SDMType.Obj:
      ret = result.length <= 0
        ? '{}'
        : '{' + (result.length > 1
          ? result.reduce((prev, cur) => prev + '\n' + space + cur[0] + ': ' + cur[1] + ';', '') + '\n' + spaceOut + '}'
          : result[0][0] + ': ' + result[0][1] + '}')
      if (sdm.mds.findIndex((str: string) => str === '$ghost') >= 0) {
        ret += '|undefined'
      }
      break
  }
  return [descs[sdm.markInd - 1], ret]
}

export function dealSchema(schema: any, descLine: any, markCols: any[], context: any): string {
  const descs = markCols.map(c => (descLine as any)[c])
  const ret = sdmToType(schema, descs, 0, context)
  if (process.env.TABLES_VERBOSE === '1') {
    console.log(chalk.cyan('tsInterface serializer dealSchema success'), JSON.stringify(ret[1], null, 2))
  }
  return ret[1]
}

export function dealContext(context: any): string {
  let enumExportsNames: string[] = []
  if (context.meta && context.meta.exports && context.meta.exports.enum) {
    enumExportsNames = context.meta.exports.enum
  }
  let str = ''
  for (const i in enumExportsNames) {
    const contextKeyName = (enumExportsNames as any)[i]
    const contextBlob = context[contextKeyName]
    if (!contextBlob) {
      throw new Error(`export enum failed: check if ${contextKeyName} are existed in your context`)
    }
    for (const enumName in contextBlob) {
      str += `/** These codes are auto generated :context.${contextKeyName}.${enumName} */\nexport enum ${enumName} {\n`
      for (const keyName in contextBlob[enumName]) {
        let v = contextBlob[enumName][keyName]
        if (_.isArray(v)) {
          if (v.length >= 2) {
            str += `    /** ${String(v[1]).replace(/\n/g, '; ')} */\n`
          }
          v = v[0]
        }
        str += '    ' + keyName + ' = ' + (typeof v === 'number' ? v : `"${v}"`) + ',\n'
      }
      str += '}\n\n'
    }
  }
  return str
}

export const tsInterfaceSerializer: Serializer = {
  plugins: [tableSchema, tableConvert],
  file: (data, fileName, imports, context) => `/** this file is auto generated */\n${imports}\n        \nexport interface ${makeInterfaceName(fileName)} ${dealSchema((data as any).schema, (data as any).descLine, (data as any).markCols, context)}\n`,
  contextDealer: dealContext
}
