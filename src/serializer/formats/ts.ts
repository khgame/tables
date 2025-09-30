import { tableConvert, tableSchema } from '../../plugin'
import { dealSchema, dealContext } from './tsInterface'
import { makeInterfaceName } from '../../utils/names'
import type { Serializer } from '../../types'

function sortByKeys<T extends Record<string, any>>(obj: T): T {
  const ret: any = {}
  Object.keys(obj).sort().forEach(k => { ret[k] = obj[k] })
  return ret
}

export const tsSerializer: Serializer = {
  plugins: [tableSchema, tableConvert],
  file: (data, fileName, imports, context) => {
    const interfaceName = makeInterfaceName(fileName)
    const convert = (data as any).convert
    const stable = { ...convert, result: sortByKeys(convert.result || {}) }
    return `/** this file is auto generated */
${imports}
        
export interface ${interfaceName} ${dealSchema((data as any).schema, (data as any).descLine, (data as any).markCols, context)}

const data = ${JSON.stringify(stable, null, 2)}

export const ${interfaceName.substr(1, 1).toLowerCase() + interfaceName.substr(2)}: { [tid: string] : ${interfaceName} } = data.result as any ;
`
  },
  contextDealer: dealContext
}
