import { tableSchema } from './schema'
import { exportJson } from '@khgame/schema'
import * as _ from 'lodash'
import type { Table } from '../types'
import { buildIndexes } from './indexes'
import { buildSchemaModel, type PrimitiveType, type TypeNode } from '../serializer/core/schemaModel'

export function tableConvert(table: Table, context?: any): Table {
  if (!table.schema) {
    table = tableSchema(table, context)
  }

  const {
    schema,
    markCols = [],
    marks,
    markLine,
    descLine,
    getValue,
    erows = [],
    markList = [],
    aliasColumns = []
  } = table as any

  const startRow: number = (marks as any).row + 2
  const descList = markCols.map((colName: string) => (descLine as any)[colName])

  const stringLikeColumns = markCols.map((_: string, columnIndex: number) => {
    const markToken = String((markList as any)[columnIndex] || '').toLowerCase()
    return markToken.includes('string')
  })

  const dataRows = erows.filter((row: number) => row >= startRow)
  const convertedRows = dataRows
    .map((row: number) => markCols.map((colName: string, colIndex: number) => {
      const cellValue = getValue(table, row, colName)
      if (!stringLikeColumns[colIndex]) return cellValue
      if (cellValue === undefined || cellValue === null) return ''
      return typeof cellValue === 'string' ? cellValue : String(cellValue)
    }))

  const markDescriptor = {
    row: erows,
    col: markCols
  }
  const exportResult = exportJson(schema, descList, convertedRows, markDescriptor)
  const tableName: string = (context && context.__table && context.__table.fileName) || (table as any).fileName || 'unknown'
  const schemaModel = buildSchemaModel(schema, descList, markCols, context)
  const normalizedRows = (exportResult as any[]).map((row: any, idx: number) => {
    const sheetRow = dataRows[idx]
    const basePath = `${tableName}[row ${sheetRow}]`
    return normalizeValue(row, schemaModel, basePath)
  })

  const idSeg: number[] = []
  markCols.forEach((col: string, markInd: number) => {
    if ((markLine as any)[col].trim() === '@') {
      idSeg.push(markInd)
    }
  })
  if (idSeg.length === 0) {
    throw new Error(`[tables] 表 ${tableName} 缺少 '@' 标记列，无法生成 TID`)
  }

  const tableData = (table as any).data || {}
  const tids = convertedRows.map((values: any[], idx: number) => {
    const tid = idSeg.reduce((prev: string, cur: number) => {
      const colName = markCols[cur]
      const sheetRow = dataRows[idx]
      const cell = (tableData[sheetRow] || {})[colName]
      const rawSegment = (cell && typeof cell.w === 'string' && cell.w.trim() !== '') ? cell.w : (cell ? cell.v : undefined)
      const segment = rawSegment !== undefined ? rawSegment : (values as any)[cur]
      const segmentStr = segment === undefined || segment === null ? '' : String(segment).trim()
      if (!segmentStr) {
        throw new Error(`[tables] 表 ${tableName} 在第 ${sheetRow + 1} 行的 '${colName}' 段缺少 TID 数据`)
      }
      return prev + segmentStr
    }, '')
    if (!tid) {
      const sheetRow = dataRows[idx]
      throw new Error(`[tables] 表 ${tableName} 在第 ${sheetRow + 1} 行缺少 TID`)
    }
    return tid
  })

  const aliasInfo = computeAliasInfo({
    aliasColumns: Array.isArray(aliasColumns) ? aliasColumns : [],
    descList,
    markCols,
    convertedRows,
    tids,
    tableName
  })

  const result: Record<string, any> = {}
  const policy = (((context || {}).policy || {}).tidConflict) || 'error' // error|overwrite|ignore|merge
  const collisions: Array<{ id: string; first: any; incoming: any }> = []
  tids.forEach((id: string, i: number) => {
    const incoming = normalizedRows[i]
    const withTid = attachTid(incoming, id)
    if (result[id] === undefined) {
      result[id] = withTid
      return
    }
    collisions.push({ id, first: result[id], incoming: withTid })
    switch (policy) {
      case 'overwrite':
        if (process.env.TABLES_VERBOSE === '1') {
          console.warn(`[tables] TID collision (overwrite): ${id}`)
        }
        result[id] = withTid
        break
      case 'ignore':
        if (process.env.TABLES_VERBOSE === '1') {
          console.warn(`[tables] TID collision (ignore): ${id}`)
        }
        break
      case 'merge':
        if (process.env.TABLES_VERBOSE === '1') {
          console.warn(`[tables] TID collision (merge): ${id}`)
        }
        result[id] = _.merge({}, result[id], withTid)
        break
      case 'error':
      default:
        throw new Error(`[tables] TID collision detected for id ${id}. Configure context.policy.tidConflict to 'overwrite'|'ignore'|'merge'.`)
    }
  })

  const indexBuild = buildIndexes(normalizedRows as any[], tids, context, descList)
  const meta: Record<string, any> = {
    idSegments: idSeg,
    markCols
  }
  if (indexBuild && indexBuild.meta && Object.keys(indexBuild.meta).length > 0) {
    meta.indexes = indexBuild.meta
  }
  if (aliasInfo && aliasInfo.meta) {
    meta.alias = aliasInfo.meta
  }

  const convertPayload: Record<string, any> = {
    tids,
    result,
    collisions,
    meta
  }

  if (indexBuild && indexBuild.maps && Object.keys(indexBuild.maps).length > 0) {
    convertPayload.indexes = indexBuild.maps
  }
  if (aliasInfo) {
    if (aliasInfo.aliases && Object.keys(aliasInfo.aliases).length > 0) {
      convertPayload.aliases = aliasInfo.aliases
    }
    if (aliasInfo.indexes && Object.keys(aliasInfo.indexes).length > 0) {
      convertPayload.indexes = Object.assign(convertPayload.indexes || {}, aliasInfo.indexes)
    }
  }

  ;(table as any).convert = convertPayload
  return table
}

function attachTid(payload: any, tid: string): Record<string, any> {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    if (payload._tid === tid) return payload
    return { _tid: tid, ...payload }
  }
  return { _tid: tid, value: payload }
}

type AliasComputationInput = {
  aliasColumns: number[]
  descList: string[]
  markCols: string[]
  convertedRows: any[][]
  tids: string[]
  tableName: string
}

type AliasComputationResult = {
  aliases: Record<string, { field: string; map: Record<string, string> }>
  indexes: Record<string, Record<string, string>>
  meta: {
    field: string
    column: string
    values: string[]
  }
} | null

const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER

function normalizeValue(value: any, node: TypeNode, path: string): any {
  if (value === undefined || value === null) return value
  switch (node.kind) {
    case 'primitive':
      return normalizePrimitive(value, node, path)
    case 'literal':
    case 'enum':
      return value
    case 'object': {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) return value
      const result: Record<string, any> = { ...value }
      for (const field of node.fields || []) {
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
          if (error instanceof Error && error.message && error.message.includes('[tables] numeric value')) {
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

function normalizePrimitive(value: any, node: PrimitiveType, path: string): any {
  const hintMeta = node.hintMeta
  const strategy = hintMeta?.strategyHint ?? (node as any).hint
  const location = path || 'value'
  const aliasSuffix = hintMeta?.sourceAlias ? ` (alias: ${hintMeta.sourceAlias})` : ''

  if (strategy === 'bigint') {
    if (value === undefined || value === null) return value
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'bigint') return String(value)
    return String(value)
  }

  if (strategy === 'int') {
    if (typeof value === 'number') {
      if (!Number.isSafeInteger(value)) {
        throw new Error(
          `[tables] numeric value ${value} at ${location}${aliasSuffix} exceeds Number.MAX_SAFE_INTEGER(${MAX_SAFE_INTEGER}). Consider using BigNum.`
        )
      }
      return value
    }

    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed === '') return value
      const parsed = Number(trimmed)
      if (!Number.isFinite(parsed) || !Number.isSafeInteger(parsed)) {
        throw new Error(
          `[tables] numeric value ${value} at ${location}${aliasSuffix} exceeds Number.MAX_SAFE_INTEGER(${MAX_SAFE_INTEGER}). Consider using BigNum.`
        )
      }
      return parsed
    }
  }

  return value
}

function computeAliasInfo(input: AliasComputationInput): AliasComputationResult {
  const { aliasColumns, descList, markCols, convertedRows, tids, tableName } = input
  if (!Array.isArray(aliasColumns) || aliasColumns.length === 0) return null
  if (aliasColumns.length > 1) {
    throw new Error(`[tables] 表 ${tableName} 暂不支持多个 alias 列`)
  }

  const aliasIndex = aliasColumns[0]
  const fieldName = descList[aliasIndex]
  const columnName = markCols[aliasIndex]
  if (!fieldName) {
    throw new Error(`[tables] alias 列对应的描述行为空，请为列 ${columnName} 设置字段名`)
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
    throw new Error(`[tables] 表 ${tableName} 的 alias 列 '${fieldName}' 存在重复别名：${deduped.join(', ')}`)
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
