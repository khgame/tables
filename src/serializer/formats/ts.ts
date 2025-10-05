import { tableConvert, tableSchema } from '../../plugin'
import { dealSchema, dealContext } from './tsInterface'
import { makeInterfaceName } from '../../utils/names'
import type { Serializer } from '../../types'

function sortByKeys<T extends Record<string, any>>(obj: T): T {
  const ret: any = {}
  Object.keys(obj).sort().forEach(k => { ret[k] = obj[k] })
  return ret
}

type AliasBlocksInput = {
  aliases: Record<string, { field: string; map: Record<string, string> }>;
  baseName: string;
  camel: string;
  interfaceName: string;
  tidAware: boolean;
  tidTypeName: string;
  tidHelperName: string;
}

function buildAliasBlocks(input: AliasBlocksInput): string {
  const { aliases, baseName, camel, interfaceName, tidAware, tidTypeName, tidHelperName } = input
  if (!tidAware) return ''
  const entries = Object.entries(aliases || {})
  if (entries.length === 0) return ''

  const blocks: string[] = []

  entries.forEach(([indexKey, aliasData]) => {
    const map = aliasData?.map || {}
    const values = Object.keys(map).sort()
    const aliasConstName = `${baseName}Protocol`
    const aliasListLiteral = `[${values.map(v => JSON.stringify(v)).join(', ')}] as const`
    const aliasConstLine = `export const ${aliasConstName} = ${aliasListLiteral};`
    const aliasTypeLine = `export type ${aliasConstName} = typeof ${aliasConstName}[number];`
    const recordConstName = `${camel}ByProtocol`
    const getterName = `get${baseName}ByProtocol`
    const indexAccessor = `raw.indexes?.[${JSON.stringify(indexKey)}] ?? {}`
    const recordConstLine = `const ${recordConstName} = Object.fromEntries(
  Object.entries(${indexAccessor}).map(([alias, tid]) => [alias as ${aliasConstName}, ${camel}[${tidHelperName}(tid as string)]])
) as Record<${aliasConstName}, ${interfaceName}>;`
    const getterLine = `export const ${getterName} = (alias: ${aliasConstName}): ${interfaceName} => {
  return ${recordConstName}[alias];
};`
    blocks.push(`${aliasConstLine}\n${aliasTypeLine}\n${recordConstLine}\n${getterLine}`)
  })

  return `${blocks.join('\n\n')}\n`
}

export const tsSerializer: Serializer = {
  plugins: [tableSchema, tableConvert],
  file: (data, fileName, imports, context) => {
    const interfaceName = makeInterfaceName(fileName)
    const convert = (data as any).convert || {}
    const { meta, aliases = {}, ...rest } = convert
    const stable = { ...rest, result: sortByKeys((rest as any).result || {}) }
    if (aliases && Object.keys(aliases).length > 0) {
      (stable as any).aliases = aliases
    }
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

    const aliasBlocks = buildAliasBlocks({
      aliases,
      baseName,
      camel,
      interfaceName,
      tidAware,
      tidTypeName,
      tidHelperName
    })

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
${aliasBlocks}
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
