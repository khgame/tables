import { tableRows } from '../plugin/rows'
import { tableEnsureRows } from '../plugin/erows'
import { tableMark } from '../plugin/mark'
import { tableDesc } from '../plugin/desc'
import { tableSchema } from '../plugin/schema'
import { tableConvert } from '../plugin/convert'
import type { Plugin } from '../types'

/**
 * Parse layer: from raw table to semantic schema-ready state.
 * Rows/erows/mark/desc/schema. Keep data layout unchanged.
 */
export const parsePlugins: Plugin[] = [
  tableRows,
  tableEnsureRows,
  tableMark,
  tableDesc,
  tableSchema
]

/**
 * Convert layer: produce cross-platform readable data (tids/result/collisions).
 */
export const convertPlugins: Plugin[] = [
  tableConvert
]

