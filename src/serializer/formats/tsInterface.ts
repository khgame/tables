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

export function dealSchema(schema: any, descLine: any, markCols: any[], context: any): string {
  const model: SchemaModel = buildSchemaModel(schema, descLine, markCols, context)
  const rendered = renderTypeNode(model, 0)
  if (process.env.TABLES_VERBOSE === '1') {
    console.log(chalk.cyan('tsInterface serializer dealSchema success'), JSON.stringify(rendered, null, 2))
  }
  return rendered
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
    const tidAlias = tidAware ? `export type ${tidTypeName} = TableContext.KHTableID;\n\n` : ''
    let schema = dealSchema((data as any).schema, (data as any).descLine, (data as any).markCols, context)
    if (tidAware) {
      schema = injectTidField(schema, `${tidTypeName}`)
    }
    return `/** this file is auto generated */\n${imports}\n        \n${tidAlias}export interface ${interfaceName} ${schema}\n`
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
