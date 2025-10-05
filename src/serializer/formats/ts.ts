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
    blocks.push(`${aliasConstLine}\n${aliasTypeLine}`)
  })

  return `${blocks.join('\n\n')}\n`
}

type RepoBlockInput = {
  baseName: string;
  camel: string;
  interfaceName: string;
  tidAware: boolean;
  tidTypeName: string;
  tidHelperName: string;
  indexesMeta: Record<string, { mode: 'unique' | 'multi' } | any>;
  aliasMeta?: { field: string } | null;
}

function buildRepoBlock(input: RepoBlockInput): string {
  const { baseName, camel, interfaceName, tidAware, tidTypeName, tidHelperName, indexesMeta, aliasMeta } = input
  if (!tidAware) return ''

  const repoName = `${baseName}Repo`
  const indexMethods: string[] = []
  const entriesObject = { ...(indexesMeta || {}) }
  if (aliasMeta && aliasMeta.field && !entriesObject[aliasMeta.field]) {
    entriesObject[aliasMeta.field] = { mode: 'unique' }
  }
  const entries = Object.entries(entriesObject)
  entries.forEach(([indexName, meta]) => {
    if (!meta) return
    const mode = typeof meta.mode === 'string' ? meta.mode : 'unique'
    const methodSuffix = toPascalCase(indexName)
    const isAlias = aliasMeta && aliasMeta.field === indexName
    const keyType = isAlias ? `${baseName}Protocol` : 'string'
    const indexLiteral = JSON.stringify(indexName)
    if (mode === 'multi') {
      indexMethods.push(`  getAllBy${methodSuffix}(key: ${keyType}): ${interfaceName}[] {
    const index = this.indexes[${indexLiteral}] || {}
    const bucket = index[key as keyof typeof index]
    if (!bucket) return []
    const tids = Array.isArray(bucket) ? bucket : [bucket as string]
    return tids.map(tid => this.get(${tidHelperName}(tid as string)))
  }`)
    } else {
      indexMethods.push(`  getBy${methodSuffix}(key: ${keyType}): ${interfaceName} {
    const index = this.indexes[${indexLiteral}] || {}
    const bucket = index[key as keyof typeof index]
    if (!bucket) {
      throw new Error(
        \`[${repoName}] no entry for ${indexName} '\${String(key)}'\`
      )
    }
    const tid = Array.isArray(bucket) ? bucket[0] : bucket
    return this.get(${tidHelperName}(tid as string))
  }`)
    }
  })

  const methodsBlock = indexMethods.length > 0 ? `\n${indexMethods.join('\n\n')}\n` : '\n'

  return `export class ${repoName} {
  static fromRaw(data = raw): ${repoName} {
    return new ${repoName}(${camel}, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<${tidTypeName}, ${interfaceName}>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = raw.indexes ?? {}
  ) {}

  get(tid: ${tidTypeName}): ${interfaceName} {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(\`[${repoName}] tid \${tid} not found\`)
    }
    return hit
  }

  values(): ${interfaceName}[] {
    return Object.values(this.records) as ${interfaceName}[]
  }

  entries(): Array<[${tidTypeName}, ${interfaceName}]> {
    return Object.entries(this.records).map(([tid, value]) => [${tidHelperName}(tid as string), value as ${interfaceName}])
  }${methodsBlock}}

`
}

function toPascalCase(source: string): string {
  return source
    .replace(/[_\s]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('')
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

    const repoBlock = buildRepoBlock({
      baseName,
      camel,
      interfaceName,
      tidAware,
      tidTypeName,
      tidHelperName,
      indexesMeta: meta?.indexes || {},
      aliasMeta: meta?.alias
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
${aliasBlocks}${repoBlock}
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
