/**
 * Data protocol for cross-platform consumption
 * Non-breaking: existing serializers remain unchanged; new serializers may wrap outputs with this header.
 */
import type { ConvertResult } from '../types'

export const TABLES_PROTOCOL_NAME = 'khgame.tables'
export const TABLES_PROTOCOL_VERSION = 1

export type TablesProtocolHeader = {
  name: typeof TABLES_PROTOCOL_NAME;
  version: number;
}

export type TablesSource = {
  fileName: string;
  sheetName: string;
}

export type TablesArtifact = {
  protocol: TablesProtocolHeader;
  source: TablesSource;
  convert: ConvertResult;
}

