import { tableConvert } from '../plugin'
import type { Serializer } from '../types'

function sortByKeys<T extends Record<string, any>>(obj: T): T {
  const ret: any = {}
  Object.keys(obj).sort().forEach(k => { ret[k] = obj[k] })
  return ret
}

export const jsSerializer: Serializer = {
  plugins: [tableConvert],
  file: data => {
    const convert = (data as any).convert
    const stable = { ...convert, result: sortByKeys(convert.result || {}) }
    return `module.exports = ${JSON.stringify(stable, null, 2)}`
  }
}
