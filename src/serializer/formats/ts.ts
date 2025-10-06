import { tableConvert, tableSchema } from '../../plugin'
import { dealSchema, dealContext } from './tsInterface'
import { makeInterfaceName } from '../../utils/names'
import type { Serializer } from '../../types'

function sortByKeys<T extends Record<string, any>>(obj: T): T {
  const ret: any = {}
  Object.keys(obj).sort().forEach(k => { ret[k] = obj[k] })
  return ret
}

type AliasReexportInput = {
  baseName: string;
  modulePath: string;
  aliasMeta?: { field: string } | null;
}

function buildAliasReexport(input: AliasReexportInput): string {
  const { baseName, modulePath, aliasMeta } = input
  if (!aliasMeta) return ''
  const aliasConstName = `${baseName}Protocol`
  return `export { ${aliasConstName} } from "./${modulePath}";\n`
}


export const tsSerializer: Serializer = {
  plugins: [tableSchema, tableConvert],
  file: (data, fileName, imports, context) => {
    const interfaceName = makeInterfaceName(fileName)
    const convert = (data as any).convert || {}
    const { meta, aliases = {}, indexes = {}, ...rest } = convert
    const stable = { ...rest, result: sortByKeys((rest as any).result || {}) }
    if (aliases && Object.keys(aliases).length > 0) {
      (stable as any).aliases = aliases
    }
    if (indexes && Object.keys(indexes).length > 0) {
      (stable as any).indexes = indexes
    }
    const baseName = interfaceName.startsWith('I') && interfaceName.length > 1 ? interfaceName.slice(1) : interfaceName
    const camel = interfaceName.substr(1, 1).toLowerCase() + interfaceName.substr(2)
    const tidTypeName = `${baseName}TID`
    const tidHelperName = `to${baseName}TID`
    const tidAware = Array.isArray(meta?.idSegments) && (meta!.idSegments as number[]).length > 0

    const tidsExport = tidAware
      ? `export const ${camel}Tids: ${tidTypeName}[] = raw.tids.map(${tidHelperName});`
      : `export const ${camel}Tids = raw.tids;`

    const recordExport = tidAware
      ? `export const ${camel}: Record<${tidTypeName}, ${interfaceName}> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [${tidHelperName}(tid), value as ${interfaceName}])
);`
      : `export const ${camel}: { [tid: string] : ${interfaceName} } = raw.result as any;`

    const typeModule = `./${fileName}`
    const aliasReexport = buildAliasReexport({
      baseName,
      modulePath: fileName,
      aliasMeta: meta?.alias
    })

    const typeImports: string[] = [interfaceName]
    if (tidAware) {
      typeImports.push(tidTypeName, tidHelperName)
    }
    if (meta?.alias) {
      typeImports.push(`${baseName}Protocol`)
    }
    typeImports.push(`${baseName}Repo`)
    const importLine = `import { ${typeImports.join(', ')} } from "${typeModule}";`
    const importsIncludingTypes = imports ? `${imports}\n${importLine}` : importLine

    const rawLiteral = JSON.stringify(stable, null, 2)

    const recordsName = `${camel}Records`
    const repoInstanceName = `${camel}Repo`
    const rawExportName = `${camel}Raw`

    return `/** this file is auto generated */
${importsIncludingTypes}
        
const raw = ${rawLiteral}

export const ${rawExportName} = raw;
${tidsExport}
${recordExport.replace(`export const ${camel}`, `export const ${recordsName}`)}
export const ${camel} = ${recordsName};
${aliasReexport}export const ${repoInstanceName} = ${baseName}Repo.fromRaw(raw);
`
  },
  contextDealer: dealContext
}
