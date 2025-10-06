type IndexMode = 'unique' | 'multi'

type RawIndexEntry =
  | string
  | string[]
  | {
      name?: string;
      column?: string | string[];
      path?: string | string[];
      field?: string | string[];
      multi?: boolean;
      mode?: IndexMode;
      allowEmpty?: boolean;
      caseInsensitive?: boolean;
      unique?: boolean;
    }

export type IndexConfig = {
  name: string;
  path: string[];
  mode: IndexMode;
  allowEmpty: boolean;
  caseInsensitive: boolean;
}

export type IndexMetaEntry = {
  path: string[];
  mode: IndexMode;
  collisions?: Array<{ key: string; tids: string[] }>;
  skipped?: string;
}

export type IndexBuildResult = {
  maps: Record<string, Record<string, string | string[]>>;
  meta: Record<string, IndexMetaEntry>;
}

export function buildIndexes(exportResult: any[], tids: string[], context: any, descList: string[]): IndexBuildResult | null {
  const configs = resolveIndexConfigs(context, descList)
  const configEntries = Object.entries(configs)
  if (configEntries.length === 0) return null

  const maps: Record<string, Record<string, string | string[]>> = {}
  const meta: Record<string, IndexMetaEntry> = {}

  for (const [indexName, config] of configEntries) {
    const indexMap: Record<string, string | string[]> = {}
    const collisions: Array<{ key: string; tids: string[] }> = []

    exportResult.forEach((record: any, rowIndex: number) => {
      const tid = tids[rowIndex]
      if (!record || !tid) return
      const value = pickPath(record, config.path)
      if (value === undefined || value === null) return

      const key = formatIndexKey(value, config)
      if (key === null) return

      if (config.mode === 'unique') {
        const existing = indexMap[key]
        if (existing !== undefined) {
          const existingTid = Array.isArray(existing) ? existing[0] : existing
          if (existingTid === tid) {
            return
          }

          const collision = collisions.find(c => c.key === key)
          if (collision) {
            if (!collision.tids.includes(tid)) collision.tids.push(tid)
          } else {
            collisions.push({ key, tids: [existingTid, tid] })
          }
          return
        }
        indexMap[key] = tid
        return
      }

      const bucket = indexMap[key]
      if (Array.isArray(bucket)) {
        if (!bucket.includes(tid)) bucket.push(tid)
      } else {
        indexMap[key] = [tid]
      }
    })

    maps[indexName] = indexMap
    meta[indexName] = {
      path: config.path,
      mode: config.mode,
      collisions: collisions.length > 0 ? collisions : undefined
    }
  }

  return { maps, meta }
}

function pickPath(record: any, path: string[]): any {
  let current = record
  for (const segment of path) {
    if (current == null) return undefined
    current = current[segment]
  }
  return current
}

function formatIndexKey(raw: any, config: IndexConfig): string | null {
  if (typeof raw === 'number' || typeof raw === 'boolean') {
    const str = String(raw)
    return config.caseInsensitive ? str.toLowerCase() : str
  }
  if (typeof raw === 'string') {
    if (!config.allowEmpty && raw.trim() === '') return null
    const normalized = raw.trim()
    return config.caseInsensitive ? normalized.toLowerCase() : normalized
  }
  return null
}

function resolveIndexConfigs(context: any, descList: string[]): Record<string, IndexConfig> {
  const storeCandidates = compact([context?.indexes, context?.meta?.indexes])
  if (storeCandidates.length === 0) return {}

  const tableInfo = context?.__table || {}
  const tableKeys = compact([tableInfo.fileName, tableInfo.camelName, tableInfo.interfaceName, '*'])

  const aggregated: Record<string, RawIndexEntry> = {}
  for (const store of storeCandidates) {
    if (!store || typeof store !== 'object') continue
    for (const key of tableKeys) {
      const raw = store[key]
      mergeIndexEntries(aggregated, raw)
    }
  }

  const normalized: Record<string, IndexConfig> = {}
  for (const [name, raw] of Object.entries(aggregated)) {
    const config = normalizeIndexConfig(name, raw, descList)
    if (config) {
      normalized[config.name] = config
    }
  }
  return normalized
}

function mergeIndexEntries(target: Record<string, RawIndexEntry>, raw: any) {
  if (!raw) return
  if (Array.isArray(raw)) {
    raw.forEach(entry => {
      if (entry === null || entry === undefined) return
      if (typeof entry === 'string' || Array.isArray(entry)) {
        target[getIndexName(entry)] = entry as any
        return
      }
      if (typeof entry === 'object') {
        const name = entry.name || getIndexName(entry.column || entry.path || entry.field)
        if (!name) return
        target[name] = Object.assign({ name }, entry)
      }
    })
    return
  }

  if (typeof raw === 'object') {
    for (const key in raw) {
      if (!Object.prototype.hasOwnProperty.call(raw, key)) continue
      const value = raw[key]
      if (value === null || value === undefined) continue
      if (typeof value === 'string' || Array.isArray(value)) {
        target[key] = value as any
      } else if (typeof value === 'object') {
        target[key] = Object.assign({ name: key }, value)
      }
    }
  }
}

function normalizeIndexConfig(name: string, raw: RawIndexEntry, descList: string[]): IndexConfig | null {
  const base: IndexConfig = {
    name,
    path: [],
    mode: 'unique',
    allowEmpty: false,
    caseInsensitive: false
  }

  if (typeof raw === 'string') {
    base.path = splitPath(raw)
  } else if (Array.isArray(raw)) {
    base.path = raw.map(segment => String(segment).trim()).filter(Boolean)
  } else if (typeof raw === 'object' && raw) {
    const column = raw.column ?? raw.path ?? raw.field ?? name
    if (Array.isArray(column)) {
      base.path = column.map(segment => String(segment).trim()).filter(Boolean)
    } else if (typeof column === 'string') {
      base.path = splitPath(column)
    }
    base.allowEmpty = !!raw.allowEmpty
    base.caseInsensitive = !!raw.caseInsensitive
    const explicitMode = raw.mode ?? (raw.multi ? 'multi' : undefined)
    if (explicitMode) {
      base.mode = explicitMode === 'multi' ? 'multi' : 'unique'
    } else if (raw.unique === false) {
      base.mode = 'multi'
    }
  }

  if (base.path.length === 0) return null
  const first = base.path[0]
  if (first && descList.indexOf(first) < 0) {
    // allow downstream meta to note missing column without failing here
  }
  return base
}

function splitPath(value: string): string[] {
  return value.split('.').map(segment => segment.trim()).filter(Boolean)
}

function getIndexName(source: any): string {
  if (typeof source === 'string') return source
  if (Array.isArray(source) && source.length > 0) return String(source[source.length - 1])
  return ''
}

function compact<T>(arr: Array<T | undefined | null>): T[] {
  return arr.filter(Boolean) as T[]
}
