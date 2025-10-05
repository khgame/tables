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
    const convert = (data as any).convert || {}
    const { meta, ...rest } = convert
    const stable = { ...rest, result: sortByKeys((rest as any).result || {}) }
    const baseName = interfaceName.startsWith('I') && interfaceName.length > 1 ? interfaceName.slice(1) : interfaceName
    const camel = interfaceName.substr(1, 1).toLowerCase() + interfaceName.substr(2)
    const tidTypeName = `${baseName}TID`
    const tidHelperName = `to${baseName}TID`
    const tidAware = Array.isArray(meta?.idSegments) && (meta!.idSegments as number[]).length > 0

    const tidDefs = tidAware
      ? `export type ${tidTypeName} = TableContext.KHTableID;
export const ${tidHelperName} = (value: string): ${tidTypeName} => value as ${tidTypeName};

`
      : ''

    const tidsExport = tidAware
      ? `export const ${camel}Tids: ${tidTypeName}[] = raw.tids.map(${tidHelperName});`
      : `export const ${camel}Tids = raw.tids;`

    const recordExport = tidAware
      ? `export const ${camel}: Record<${tidTypeName}, ${interfaceName}> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [${tidHelperName}(tid), value as ${interfaceName}])
);`
      : `export const ${camel}: { [tid: string] : ${interfaceName} } = raw.result as any;`

    let schema = dealSchema((data as any).schema, (data as any).descLine, (data as any).markCols, context)
    if (tidAware) {
      schema = injectTidField(schema, `${tidTypeName}`)
    }

    return `/** this file is auto generated */
${imports}
        
export interface ${interfaceName} ${schema}

${tidDefs}const raw = ${JSON.stringify(stable, null, 2)}

${tidsExport}
${recordExport}
`
  },
  contextDealer: dealContext
}

function injectTidField(schema: string, tidType: string): string {
  const lines = schema.split('\n')
  const tidLine = `  _tid: ${tidType};`
  if (lines.length === 1) {
    return `{
${tidLine}
}`
  }
  if (lines[0].trim() !== '{') {
    return schema
  }
  lines.splice(1, 0, tidLine)
  return lines.join('\n')
}
