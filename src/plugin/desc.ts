import { tableMark } from './mark'
import assert from 'assert'
import * as _ from 'lodash'
import type { Table } from '../types'

export function tableDesc(table: Table): Table {
  if (!table.marks) {
    table = tableMark(table)
  }
  const { data, marks, getValue, cols } = table
  const markRow = (marks as any).row
  const markCol = (marks as any).col
  const markLineData = (data as any)[markRow]
  assert(markLineData, 'markLine not exist')
  assert(getValue(table, markRow, markCol) === '@', `mark info error ${(markLineData as any)[markCol]}`)

  const markLine: Record<string, string> = {}
  const markCols: string[] = []
  const descLine: Record<string, string> = {}
  for (const col of cols) {
    const markSlot = getValue(table, (marks as any).row, col)
    const descSlot = getValue(table, (marks as any).row + 1, col)
    if (markSlot) {
      markCols.push(col)
      markLine[col] = String(markSlot).trim()
    }
    if (undefined !== descSlot) descLine[col] = _.toString(descSlot).trim()
  }

  Object.assign(table, {
    markCols,
    markLine,
    descLine
  })
  return table
}

