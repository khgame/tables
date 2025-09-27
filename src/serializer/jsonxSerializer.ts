import { tableConvert } from '../plugin'
import type { Serializer } from '../types'
import { TABLES_PROTOCOL_NAME, TABLES_PROTOCOL_VERSION } from '../core/protocol'

function sortByKeys<T extends Record<string, any>>(obj: T): T {
  const ret: any = {}
  Object.keys(obj).sort().forEach(k => { ret[k] = (obj as any)[k] })
  return ret
}

/**
 * Experimental: JSON with protocol header and source meta.
 * Does not replace jsonSerializer; use via CLI format 'jsonx'.
 */
export const jsonxSerializer: Serializer = {
  plugins: [tableConvert],
  file: (data, fileName, _imports, _context) => {
    const convert = (data as any).convert
    const stable = { ...convert, result: sortByKeys(convert.result || {}) }
    const artifact = {
      protocol: { name: TABLES_PROTOCOL_NAME, version: TABLES_PROTOCOL_VERSION },
      source: { fileName, sheetName: '__data' },
      convert: stable
    }
    return `${JSON.stringify(artifact, null, 2)}`
  }
}

