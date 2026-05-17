import { tableConvert } from '../../plugin'
import type { Serializer } from '../../types'
import { TABLES_PROTOCOL_NAME, TABLES_PROTOCOL_VERSION } from '../../core/protocol'
import { buildStableConvertPayload } from '../core/convertPayload'

/**
 * Experimental: JSON with protocol header and source meta.
 * Does not replace jsonSerializer; use via CLI format 'jsonx'.
 */
export const jsonxSerializer: Serializer = {
  plugins: [tableConvert],
  file: (data, fileName, _imports, _context) => {
    const convert = (data as any).convert
    const stable = buildStableConvertPayload(convert)
    const artifact = {
      protocol: { name: TABLES_PROTOCOL_NAME, version: TABLES_PROTOCOL_VERSION },
      source: { fileName, sheetName: '__data' },
      convert: stable
    }
    return `${JSON.stringify(artifact, null, 2)}`
  }
}
