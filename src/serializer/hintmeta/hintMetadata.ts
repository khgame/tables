import { AliasTable, SupportedTypes } from '@khgame/schema'

type SupportedType = (typeof SupportedTypes)[keyof typeof SupportedTypes]

export type StrategyHint = 'int' | 'bigint' | 'float'

export type NumericFlavor = 'int' | 'int64' | 'uint' | 'uint64' | 'float' | 'ufloat'

export interface HintMetadata {
  strategyHint?: StrategyHint
  flavor?: NumericFlavor
  sourceAlias?: string
  extensions?: Record<string, any>
}

let lowerAliasCache: Map<SupportedType, Set<string>> | null = null

function getLowerAliasMap(): Map<SupportedType, Set<string>> {
  if (lowerAliasCache) return lowerAliasCache
  /* istanbul ignore next */
  lowerAliasCache = new Map<SupportedType, Set<string>>(
    Object.entries(AliasTable).map(([mainType, aliases]) => [
      mainType as SupportedType,
      new Set((aliases || []).map(alias => String(alias).toLowerCase()))
    ])
  )
  return lowerAliasCache
}

const INT_BIGINT_ALIASES = new Set(['int64', 'long'])
const INT_SAFE_ALIASES = new Set(['int', 'int8', 'int16', 'int32'])
const UINT_BIGINT_ALIASES = new Set(['uint64', 'ulong'])
const UINT_SAFE_ALIASES = new Set(['uint', 'uint8', 'uint16', 'uint32'])
function hasFloatAlias(normalized: string): boolean {
  return getLowerAliasMap().get(SupportedTypes.Float)?.has(normalized) ?? false
}

function hasUFloatAlias(normalized: string): boolean {
  return getLowerAliasMap().get(SupportedTypes.UFloat)?.has(normalized) ?? false
}

export function resolveHintMetadata(rawName?: string, mainType?: SupportedType | string): HintMetadata | undefined {
  if (typeof rawName !== 'string') return undefined
  const trimmed = rawName.trim()
  if (!trimmed) return undefined

  const normalized = trimmed.toLowerCase()
  const result: HintMetadata = { sourceAlias: trimmed }

  switch (mainType) {
    case SupportedTypes.Int:
      if (INT_BIGINT_ALIASES.has(normalized)) {
        result.strategyHint = 'bigint'
        result.flavor = 'int64'
      } else if (INT_SAFE_ALIASES.has(normalized) || getLowerAliasMap().get(SupportedTypes.Int)?.has(normalized)) {
        result.strategyHint = 'int'
        result.flavor = 'int'
      }
      break
    case SupportedTypes.UInt:
      if (UINT_BIGINT_ALIASES.has(normalized)) {
        result.strategyHint = 'bigint'
        result.flavor = 'uint64'
      } else if (UINT_SAFE_ALIASES.has(normalized)) {
        result.strategyHint = 'int'
        result.flavor = 'uint'
      }
      break
    case SupportedTypes.Float:
      if (hasFloatAlias(normalized)) {
        result.strategyHint = 'float'
        result.flavor = 'float'
      }
      break
    case SupportedTypes.UFloat:
      if (hasUFloatAlias(normalized)) {
        result.strategyHint = 'float'
        result.flavor = 'ufloat'
      }
      break
    default:
      break
  }

  if (!result.strategyHint && !result.flavor) {
    // For aliases like '@' or 'tid' we keep only the sourceAlias for diagnostics.
    return Object.keys(result).length > 0 ? result : undefined
  }
  return result
}

export function shouldAnnotateAsBigInt(rawName?: string, mainType?: SupportedType | string): boolean {
  if (typeof rawName !== 'string') return false
  const normalized = rawName.trim().toLowerCase()
  if (!normalized) return false
  if (mainType === SupportedTypes.Int) return INT_BIGINT_ALIASES.has(normalized)
  if (mainType === SupportedTypes.UInt) return UINT_BIGINT_ALIASES.has(normalized)
  return false
}
