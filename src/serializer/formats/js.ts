import { tableConvert } from '../../plugin'
import type { Serializer } from '../../types'
import { buildStableConvertPayload } from '../core/convertPayload'

export const jsSerializer: Serializer = {
  plugins: [tableConvert],
  file: data => {
    const convert = (data as any).convert
    const stable = buildStableConvertPayload(convert)
    return `module.exports = ${JSON.stringify(stable, null, 2)}`
  }
}
