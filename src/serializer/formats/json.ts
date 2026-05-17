import { tableConvert } from '../../plugin'
import type { Serializer } from '../../types'
import { buildStableConvertPayload } from '../core/convertPayload'

export const jsonSerializer: Serializer = {
  plugins: [tableConvert],
  file: data => {
    const convert = (data as any).convert
    const stable = buildStableConvertPayload(convert)
    return `${JSON.stringify(stable, null, 2)}`
  }
}
