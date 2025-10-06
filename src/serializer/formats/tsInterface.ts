import { makeInterfaceName } from '../../utils/names'
import { tableSchema, tableConvert } from '../../plugin'
import chalk from 'chalk'
import type { Serializer } from '../../types'
import * as _ from 'lodash'
import {
  buildSchemaModel,
  isEmptyArray,
  isUnion,
  type ArrayType,
  type LiteralType,
  type ObjectField,
  type ObjectType,
  type PrimitiveType,
  type SchemaModel,
  type TupleType,
  type TypeNode,
  type UnionType,
  type EnumReferenceType
} from '../core/schemaModel'

export interface DealSchemaResult {
  schema: string
  usesBigIntStr: boolean
}

export function dealSchemaWithMetadata(schema: any, descLine: any, markCols: any[], context: any): DealSchemaResult {
  const model: SchemaModel = buildSchemaModel(schema, descLine, markCols, context)
  const rendered = renderTypeNode(model, 0)
  const usesBigIntStr = detectBigIntStrategy(model)
  if (process.env.TABLES_VERBOSE === '1') {
    console.log(chalk.cyan('tsInterface serializer dealSchema success'), JSON.stringify(rendered, null, 2))
  }
  return { schema: rendered, usesBigIntStr }
}

export function dealSchema(schema: any, descLine: any, markCols: any[], context: any): string {
  return dealSchemaWithMetadata(schema, descLine, markCols, context).schema
}

function renderTypeNode(node: TypeNode, depth: number): string {
  switch (node.kind) {
    case 'primitive':
      return renderPrimitive(node)
    case 'literal':
      return renderLiteral(node)
    case 'enum':
      return renderEnum(node)
    case 'object':
      return renderObject(node, depth)
    case 'array':
      return renderArray(node, depth)
    case 'tuple':
      return renderTuple(node, depth)
    case 'union':
      return renderUnion(node, depth)
    default:
      return 'any'
  }
}

function renderPrimitive(node: PrimitiveType): string {
  const strategy = node.hintMeta?.strategyHint ?? (node as any).hint
  if (strategy === 'bigint') {
    return 'BigIntStr'
  }
  return node.name
}

function renderLiteral(node: LiteralType): string {
  if (typeof node.value === 'string') {
    return `"${node.value}"`
  }
  return String(node.value)
}

function renderEnum(node: EnumReferenceType): string {
  return node.ref
}

function renderObject(node: ObjectType, depth: number): string {
  const fields = node.fields || []
  if (fields.length === 0) {
    return '{}'
  }
  if (node.style === 'inline') {
    const inline = fields.map(field => `${field.name}: ${renderTypeNode(field.type, depth + 1)}`).join(', ')
    return `{${inline}}`
  }
  if (fields.length === 1) {
    const field = fields[0]
    return `{${renderField(field, depth + 1, false)}}`
  }
  const indent = indentOf(depth + 1)
  const closingIndent = indentOf(depth)
  const lines = fields.map(field => `${indent}${renderField(field, depth + 1, true)}`)
  return `{
${lines.join('\n')}
${closingIndent}}`
}

function renderField(field: ObjectField, depth: number, appendSemicolon: boolean): string {
  const rendered = `${field.name}: ${renderTypeNode(field.type, depth)}`
  return appendSemicolon ? `${rendered};` : rendered
}

function renderArray(node: ArrayType, depth: number): string {
  if (isEmptyArray(node)) {
    return '[]'
  }
  const arrayNode = node as any
  const element = arrayNode.element ?? ({ kind: 'primitive', name: 'any' } as PrimitiveType)
  const renderedElement = renderTypeNode(element, depth + 1)
  if (arrayNode.origin === 'tnode') {
    if (arrayNode.representation === 'generic') {
      return `Array<${renderedElement}>`
    }
    return `${renderedElement}[]`
  }
  const childCount = arrayNode.childCount ?? (isUnion(element) ? element.variants.length : 1)
  return shouldUseGenericArrayNotation(element, renderedElement, childCount)
    ? `Array<${renderedElement}>`
    : `${renderedElement}[]`
}

function shouldUseGenericArrayNotation(element: TypeNode, rendered: string, childCount: number): boolean {
  if (childCount > 1) return true
  if (rendered.length > 9) return true
  if (isUnion(element) && element.variants.length > 1) return true
  return false
}

function renderTuple(node: TupleType, depth: number): string {
  const elements = node.elements || []
  if (elements.length === 0) {
    return '[]'
  }
  if (elements.length === 1) {
    return `[${renderTypeNode(elements[0], depth + 1)}]`
  }
  const indent = indentOf(depth + 1)
  const closingIndent = indentOf(depth)
  const rendered = elements.map(element => renderTypeNode(element, depth + 1))
  return `[
${indent}${rendered.join(',\n' + indent)}
${closingIndent}]`
}

function renderUnion(node: UnionType, depth: number): string {
  return node.variants.map(variant => renderTypeNode(variant, depth)).join('|')
}

function indentOf(depth: number): string {
  return '  '.repeat(depth)
}

function detectBigIntStrategy(node: TypeNode): boolean {
  switch (node.kind) {
    case 'primitive':
      return (node.hintMeta?.strategyHint ?? (node as any).hint) === 'bigint'
    case 'array':
      return node.element ? detectBigIntStrategy(node.element) : false
    case 'tuple':
      return (node.elements || []).some(element => detectBigIntStrategy(element))
    case 'union':
      return (node.variants || []).some(variant => detectBigIntStrategy(variant))
    case 'object':
      return (node.fields || []).some(field => detectBigIntStrategy(field.type))
    default:
      return false
  }
}

type AliasTypeBlock = {
  declaration: string;
  hasValues: boolean;
  values: string[];
}

function buildAliasTypeBlock(baseName: string, aliasMeta: any): AliasTypeBlock {
  if (!aliasMeta) {
    return { declaration: '', hasValues: false, values: [] }
  }
  const values = Array.isArray(aliasMeta.values)
    ? (aliasMeta.values.filter((v: any) => typeof v === 'string' && v.trim() !== '') as string[])
    : []
  const aliasConstName = `${baseName}Protocol`
  if (values.length === 0) {
    return {
      declaration: `export const ${aliasConstName}: never[] = [];\nexport type ${aliasConstName} = never;\n`,
      hasValues: false,
      values
    }
  }
  const literalList = `[${values.map(value => JSON.stringify(value)).sort().join(', ')}] as const`
  const declaration = `export const ${aliasConstName} = ${literalList};\nexport type ${aliasConstName} = typeof ${aliasConstName}[number];\n`
  return {
    declaration,
    hasValues: true,
    values
  }
}

function buildBigIntHelpersBlock(): string {
  return `export type BigIntStr = string;\n\nconst MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);\nconst MIN_SAFE_BIGINT = BigInt(Number.MIN_SAFE_INTEGER);\n\nfunction ensureBigIntStr(value: BigIntStr): string {\n  if (typeof value !== 'string') {\n    throw new TypeError('[tables] BigIntStr expects a string input');\n  }\n  const trimmed = value.trim();\n  if (trimmed.length === 0) {\n    throw new RangeError('[tables] BigIntStr expects a non-empty numeric string');\n  }\n  return trimmed;\n}\n\nexport const BigIntStrHelper = {\n  toBigInt(value: BigIntStr): bigint {\n    const normalized = ensureBigIntStr(value);\n    return BigInt(normalized);\n  },\n  toSafeNumber(value: BigIntStr): number {\n    const normalized = ensureBigIntStr(value);\n    const asBigInt = BigInt(normalized);\n    if (asBigInt > MAX_SAFE_BIGINT || asBigInt < MIN_SAFE_BIGINT) {\n      throw new RangeError('[tables] BigIntStr exceeds Number safe integer range');\n    }\n    return Number(asBigInt);\n  }\n} as const;\n\n`
}

type RepoBlockInput = {
  baseName: string;
  interfaceName: string;
  tidAware: boolean;
  tidTypeName: string;
  tidHelperName: string;
  indexesMeta: Record<string, { mode: 'unique' | 'multi' } | any>;
  aliasMeta?: { field: string } | null;
}

function buildRepoDeclaration(input: RepoBlockInput): string {
  const { baseName, interfaceName, tidAware, tidTypeName, tidHelperName, indexesMeta, aliasMeta } = input
  if (!tidAware) return ''

  const repoName = `${baseName}Repo`
  const rawName = `${baseName}Raw`
  const entriesObject = { ...(indexesMeta || {}) }
  if (aliasMeta && aliasMeta.field && !entriesObject[aliasMeta.field]) {
    entriesObject[aliasMeta.field] = { mode: 'unique' }
  }
  const indexMethods: string[] = []
  for (const [indexName, meta] of Object.entries(entriesObject)) {
    if (!meta) continue
    const mode = typeof meta.mode === 'string' ? meta.mode : 'unique'
    const methodSuffix = toPascalCase(indexName)
    const isAlias = aliasMeta && aliasMeta.field === indexName
    const keyType = isAlias ? `${baseName}Protocol` : 'string'
    if (mode === 'multi') {
      indexMethods.push(`  getAllBy${methodSuffix}(key: ${keyType}): ${interfaceName}[] {
    const index = this.indexes[${JSON.stringify(indexName)}] || {}
    const bucket = index[key as keyof typeof index]
    if (!bucket) return []
    const tids = Array.isArray(bucket) ? bucket : [bucket as string]
    return tids.map(tid => this.get(${tidHelperName}(tid as string)))
  }`)
    } else {
      indexMethods.push(`  getBy${methodSuffix}(key: ${keyType}): ${interfaceName} {
    const index = this.indexes[${JSON.stringify(indexName)}] || {}
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
  }

  const methodsBlock = indexMethods.length > 0 ? `\n${indexMethods.join('\n\n')}\n` : '\n'

  return `export type ${rawName} = {
  tids: string[]
  result: Record<string, ${interfaceName}>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class ${repoName} {
  static fromRaw(data: ${rawName}): ${repoName} {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [${tidHelperName}(tid), value as ${interfaceName}])) as Record<${tidTypeName}, ${interfaceName}>
    return new ${repoName}(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<${tidTypeName}, ${interfaceName}>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
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

export function dealContext(context: any): string {
  let enumExportsNames: string[] = []
  if (context.meta && context.meta.exports && context.meta.exports.enum) {
    enumExportsNames = context.meta.exports.enum
  }
  let str = ''
  for (const i in enumExportsNames) {
    const contextKeyName = (enumExportsNames as any)[i]
    const contextBlob = context[contextKeyName]
    if (!contextBlob) {
      throw new Error(`export enum failed: check if ${contextKeyName} are existed in your context`)
    }
    for (const enumName in contextBlob) {
      str += `/** These codes are auto generated :context.${contextKeyName}.${enumName} */\nexport enum ${enumName} {\n`
      for (const keyName in contextBlob[enumName]) {
        let v = contextBlob[enumName][keyName]
        if (_.isArray(v)) {
          if (v.length >= 2) {
            str += `    /** ${String(v[1]).replace(/\n/g, '; ')} */\n`
          }
          v = v[0]
        }
        str += '    ' + keyName + ' = ' + (typeof v === 'number' ? v : `"${v}"`) + ',\n'
      }
      str += '}\n\n'
    }
  }
  return str
}

export const tsInterfaceSerializer: Serializer = {
  plugins: [tableSchema, tableConvert],
  file: (data, fileName, imports, context) => {
    const interfaceName = makeInterfaceName(fileName)
    const baseName = interfaceName.startsWith('I') && interfaceName.length > 1 ? interfaceName.slice(1) : interfaceName
    const tidMeta = (data as any).convert?.meta
    const tidAware = Array.isArray(tidMeta?.idSegments) && tidMeta.idSegments.length > 0
    const tidTypeName = `${baseName}TID`
    const tidAlias = tidAware
      ? `export type ${tidTypeName} = TableContext.KHTableID;\nexport const ${`to${baseName}TID`} = (value: string): ${tidTypeName} => value as ${tidTypeName};\n\n`
      : ''
    const aliasMeta = (data as any).convert?.meta?.alias
    const aliasTypeBlock = buildAliasTypeBlock(baseName, aliasMeta)
  const repoBlock = buildRepoDeclaration({
      baseName,
      interfaceName,
      tidAware,
      tidTypeName,
      tidHelperName: `to${baseName}TID`,
      indexesMeta: tidMeta?.indexes || {},
      aliasMeta
    })
    const schemaResult = dealSchemaWithMetadata((data as any).schema, (data as any).descLine, (data as any).markCols, context)
    const bigIntBlock = schemaResult.usesBigIntStr ? buildBigIntHelpersBlock() : ''
    let schema = schemaResult.schema
    if (tidAware) {
      schema = injectTidField(schema, `${tidTypeName}`)
    }
    const spacing = bigIntBlock ? `${bigIntBlock}${tidAlias}` : tidAlias
    return `/** this file is auto generated */\n${imports}\n\n${spacing}export interface ${interfaceName} ${schema}\n\n${aliasTypeBlock.declaration}${repoBlock}`
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
