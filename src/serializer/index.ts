import { readAndTranslate } from '../utils/read'
import * as Path from 'path'
import * as fs from 'fs-extra'
import { FileWalker } from 'kht'
import type { Context, Serializer } from '../types'

/**
 * serialize files with selected serializers
 */
export function serialize(pathIn: string, dirOut: string, serializers: Record<string, Serializer>, context?: Context) {
  const plugins = Object.values(serializers).reduce((prev: any[], cur) => cur.plugins ? prev.concat(cur.plugins) : prev, [])

  const ret = readAndTranslate(pathIn, { plugins }, context)

  for (const outName in serializers) {
    const fileContent = serializers[outName].file(ret as any, Path.parse(pathIn).name, 'import * as TableContext from "./context";', context)
    fs.outputFileSync(Path.resolve(dirOut, outName), fileContent)
  }
}

export function loadContext(dirIn: string) {
  const context: any = {}
  FileWalker.forEachSync(dirIn, (fileObj: any) => {
    const fileName = fileObj.parsed.base.replace(/^context\./i, '').replace(/\.json$/i, '')
    const metas = fileName.split('.')
    if (metas.length < 0 || !metas[0]) {
      console.error(`load file ${fileName} failed: format error`)
      return
    }

    const blobName = metas[0]
    if (context[blobName]) {
      const appendBlob = fs.readJsonSync(fileObj.path)
      for (const key in appendBlob) {
        if (context[blobName][key]) {
          console.error(`load context ${key} of blob ${blobName} failed: blobs with same name is already exist`)
        }
        context[blobName][key] = appendBlob[key]
      }
    } else {
      context[blobName] = fs.readJsonSync(fileObj.path)
    }
  }, false, (file: string) => /^context\..*\.json/i.test(file) && !file.startsWith('~'))
  if (process.env.TABLES_VERBOSE === '1') {
    console.log('context loaded:', dirIn, Object.keys(context))
  }
  return context
}

export function serializeContext(dirOut: string, serializers: Serializer[], context: any) {
  const contextDealers = Object.values(serializers).reduce(
    (prev: any[], cur: any) => (cur.contextDealer && prev.indexOf(cur.contextDealer) < 0) ? prev.concat(cur.contextDealer) : prev,
    [] as any[]
  )

  let strs = 'export const TABLE_CONTEXT_VERSION = 0; \n'
  for (const i in contextDealers) {
    const contextDealer = (contextDealers as any)[i]
    strs += contextDealer(context) + '\n'
  }
  fs.writeFileSync(Path.resolve(dirOut, 'context.ts'), strs)
}

export * from './jsonSerializer'
export * from './jsSerializer'
export * from './tsSerializer'
export * from './tsInterfaceSerializer'
export * from './jsonxSerializer'
