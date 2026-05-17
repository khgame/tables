import type { PrimitiveType, TypeNode } from '../serializer/core/schemaModel'
import { createConvertError, getConvertErrorMetadata } from './validationError'

export type AliasComputationInput = {
  aliasColumns: number[]
  descList: string[]
  markCols: string[]
  convertedRows: any[][]
  tids: string[]
  tableName: string
}

export type AliasComputationResult = {
  aliases: Record<string, { field: string; map: Record<string, string> }>
  indexes: Record<string, Record<string, string>>
  meta: {
    field: string
    column: string
    values: string[]
  }
} | null

export const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER

export function normalizeValue(value: any, node: TypeNode, path: string): any {
  if (value === undefined || value === null) return value
  switch (node.kind) {
    case 'primitive':
      return normalizePrimitive(value, node as PrimitiveType, path)
    case 'literal':
    case 'enum':
      return value
    case 'object': {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) return value
      const result: Record<string, any> = { ...value }
      for (const field of node.fields || []) {
        /* istanbul ignore else */
        if (Object.prototype.hasOwnProperty.call(value, field.name)) {
          const childPath = path ? `${path}.${field.name}` : field.name
          result[field.name] = normalizeValue(value[field.name], field.type, childPath)
        }
      }
      return result
    }
    case 'array': {
      if (!Array.isArray(value)) return value
      const element = node.element
      if (!element) return value.slice()
      return value.map((item, idx) => normalizeValue(item, element, `${path}[${idx}]`))
    }
    case 'tuple': {
      if (!Array.isArray(value)) return value
      return value.map((item, idx) => {
        const elementType = node.elements[idx] ?? node.elements[node.elements.length - 1]
        return normalizeValue(item, elementType, `${path}[${idx}]`)
      })
    }
    case 'union': {
      for (const variant of node.variants) {
        try {
          return normalizeValue(value, variant, path)
        } catch (error) {
          const metadata = getConvertErrorMetadata(error)
          if (
            metadata?.code === 'numeric_overflow' ||
            (error instanceof Error && error.message && error.message.includes('[tables] numeric value'))
          ) {
            throw error
          }
        }
      }
      return value
    }
    default:
      return value
  }
}

export function normalizePrimitive(value: any, node: PrimitiveType, path: string): any {
  const hintMeta = node.hintMeta
  const strategy = hintMeta?.strategyHint ?? (node as any).hint
  const location = path || 'value'
  const aliasSuffix = hintMeta?.sourceAlias ? ` (alias: ${hintMeta.sourceAlias})` : ''

  if (strategy === 'bigint') {
    if (value === undefined || value === null) return value
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'bigint') return String(value)
    const message = `[tables] expected ${location}${aliasSuffix} to be a numeric string for BigInt preservation, received ${typeof value}`
    throw createConvertError(message, {
      code: 'bigint_expected_numeric_string',
      ...buildNumericValidationContext(location, {
        convertPath: location,
        expected: 'numeric_string',
        receivedType: typeof value,
        sourceAlias: hintMeta?.sourceAlias
      })
    })
  }

  if (strategy === 'int') {
    if (typeof value === 'number') {
      if (!Number.isSafeInteger(value)) {
        const message = `[tables] numeric value ${value} at ${location}${aliasSuffix} exceeds Number.MAX_SAFE_INTEGER(${MAX_SAFE_INTEGER}). Consider using BigNum.`
        throw createConvertError(message, {
          code: 'numeric_overflow',
          ...buildNumericValidationContext(location, {
            rawValue: String(value),
            convertPath: location,
            maxSafeInteger: MAX_SAFE_INTEGER,
            suggestedType: 'BigNum',
            sourceAlias: hintMeta?.sourceAlias
          })
        })
      }
      return value
    }

    /* istanbul ignore else */
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed === '') return value
      const parsed = Number(trimmed)
      if (!Number.isFinite(parsed) || !Number.isSafeInteger(parsed)) {
        const message = `[tables] numeric value ${value} at ${location}${aliasSuffix} exceeds Number.MAX_SAFE_INTEGER(${MAX_SAFE_INTEGER}). Consider using BigNum.`
        throw createConvertError(message, {
          code: 'numeric_overflow',
          ...buildNumericValidationContext(location, {
            rawValue: value,
            convertPath: location,
            maxSafeInteger: MAX_SAFE_INTEGER,
            suggestedType: 'BigNum',
            sourceAlias: hintMeta?.sourceAlias
          })
        })
      }
      return parsed
    }
  }

  return value
}

function buildNumericValidationContext(location: string, details: Record<string, unknown>) {
  const pathContext = parseConvertPath(location)
  return cleanContext({
    location: {
      row: pathContext.row,
      fieldPath: pathContext.fieldPath
    },
    details: {
      ...details,
      tableName: pathContext.tableName
    }
  })
}

export function computeAliasInfo(input: AliasComputationInput): AliasComputationResult {
  const { aliasColumns, descList, markCols, convertedRows, tids, tableName } = input
  if (!Array.isArray(aliasColumns) || aliasColumns.length === 0) return null
  if (aliasColumns.length > 1) {
    throw createConvertError(`[tables] 表 ${tableName} 暂不支持多个 alias 列`, {
      code: 'multiple_alias_columns',
      details: {
        tableName
      }
    })
  }

  const aliasIndex = aliasColumns[0]
  const fieldName = descList[aliasIndex]
  const columnName = markCols[aliasIndex]
  if (!fieldName) {
    throw createConvertError(`[tables] alias 列对应的描述行为空，请为列 ${columnName} 设置字段名`, {
      code: 'missing_alias_descriptor',
      location: {
        column: columnName
      }
    })
  }

  const aliasMap: Record<string, string> = {}
  const duplicates: string[] = []
  convertedRows.forEach((row, idx) => {
    const tid = tids[idx]
    if (!row) return
    const rawValue = row[aliasIndex]
    if (rawValue === undefined || rawValue === null) return
    const alias = String(rawValue).trim()
    if (!alias) return
    const existing = aliasMap[alias]
    if (existing && existing !== tid) {
      duplicates.push(alias)
      return
    }
    aliasMap[alias] = tid
  })

  if (duplicates.length > 0) {
    const deduped = Array.from(new Set(duplicates))
    throw createConvertError(`[tables] 表 ${tableName} 的 alias 列 '${fieldName}' 存在重复别名：${deduped.join(', ')}`, {
      code: 'duplicate_alias',
      location: {
        column: columnName,
        fieldPath: fieldName
      },
      details: {
        tableName,
        duplicateAliases: deduped
      }
    })
  }

  return {
    aliases: {
      [fieldName]: {
        field: fieldName,
        map: aliasMap
      }
    },
    indexes: {
      [fieldName]: aliasMap
    },
    meta: {
      field: fieldName,
      column: columnName,
      values: Object.keys(aliasMap).sort()
    }
  }
}

function parseConvertPath(path: string): { tableName?: string; row?: number; fieldPath?: string } {
  const match = new RegExp('^(.+)\\[row ([0-9]+)\\](?:\\.(.+))?$').exec(path)
  if (!match) return {}
  return {
    tableName: match[1],
    row: Number(match[2]),
    fieldPath: match[3]
  }
}

function cleanContext(context: {
  location?: Record<string, unknown>;
  details?: Record<string, unknown>;
}) {
  const location = cleanRecord(context.location)
  const details = cleanRecord(context.details)
  return {
    ...(location ? { location } : {}),
    ...(details ? { details } : {})
  }
}

function cleanRecord(record?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!record) return undefined
  const cleaned: Record<string, unknown> = {}
  Object.keys(record).forEach(key => {
    const value = record[key]
    if (value !== undefined) cleaned[key] = value
  })
  return Object.keys(cleaned).length > 0 ? cleaned : undefined
}
