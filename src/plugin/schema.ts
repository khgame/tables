import { parseSchema } from '@khgame/schema'
import { tableDesc } from './desc'
import { tableEnsureRows } from './erows'
import type { Table } from '../types'

export function tableSchema(table: Table, context?: any): Table {
  if (!table.marks || !table.markLine || !table.descLine) {
    table = tableEnsureRows(table)
    table = tableDesc(table)
  }

  const { markCols = [], markLine } = table
  const markList = markCols.map(colName => (markLine as any)[colName])

  const { normalizedMarks, aliasColumns } = normalizeAliasTokens(markList)

  ;(table as any).schema = parseSchema(normalizedMarks, context)
  ;(table as any).markList = normalizedMarks
  if (aliasColumns.length > 0) {
    ;(table as any).aliasColumns = aliasColumns
  }
  return table
}

function normalizeAliasTokens(markList: string[]): { normalizedMarks: string[]; aliasColumns: number[] } {
  const normalizedMarks: string[] = []
  const aliasColumns: number[] = []

  markList.forEach((token, index) => {
    const normalized = normalizeAliasToken(token)
    normalizedMarks.push(normalized.value)
    if (normalized.isAlias) {
      aliasColumns.push(index)
    }
  })

  return { normalizedMarks, aliasColumns }
}

function normalizeAliasToken(token: string): { value: string; isAlias: boolean } {
  if (typeof token !== 'string') {
    return { value: token as any, isAlias: false }
  }
  const trimmed = token.trim()
  if (/^alias\??$/i.test(trimmed)) {
    const optional = trimmed.endsWith('?')
    return { value: optional ? 'string?' : 'string', isAlias: true }
  }
  return { value: token, isAlias: false }
}
