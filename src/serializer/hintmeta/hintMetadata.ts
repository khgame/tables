import { AliasTable, SupportedTypes } from '@khgame/schema'

export type StrategyHint = 'int' | 'bigint' | 'float'

export type NumericFlavor = 'int' | 'int64' | 'uint' | 'uint64' | 'float' | 'ufloat'

export interface HintMetadata {
  strategyHint?: StrategyHint
  flavor?: NumericFlavor
  sourceAlias?: string
  extensions?: Record<string, any>
}

const LOWER_ALIASES = new Map<SupportedTypes, Set<string>>(
  Object.entries(AliasTable).map(([mainType, aliases]) => [
    mainType as SupportedTypes,
    new Set((aliases || []).map(alias => String(alias).toLowerCase()))
  ])
)

const INT_BIGINT_ALIASES = new Set(['int64', 'long'])
const INT_SAFE_ALIASES = new Set(['int', 'int8', 'int16', 'int32'])
const UINT_BIGINT_ALIASES = new Set(['uint64', 'ulong'])
const UINT_SAFE_ALIASES = new Set(['uint', 'uint8', 'uint16', 'uint32'])
const FLOAT_ALIASES = LOWER_ALIASES.get(SupportedTypes.Float) ?? new Set<string>()
const UFLOAT_ALIASES = LOWER_ALIASES.get(SupportedTypes.UFloat) ?? new Set<string>()

export function resolveHintMetadata(rawName?: string, mainType?: SupportedTypes | string): HintMetadata | undefined {
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
      } else if (INT_SAFE_ALIASES.has(normalized) || LOWER_ALIASES.get(SupportedTypes.Int)?.has(normalized)) {
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
      if (FLOAT_ALIASES.has(normalized)) {
        result.strategyHint = 'float'
        result.flavor = 'float'
      }
      break
    case SupportedTypes.UFloat:
      if (UFLOAT_ALIASES.has(normalized)) {
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

export function shouldAnnotateAsBigInt(rawName?: string, mainType?: SupportedTypes | string): boolean {
  if (typeof rawName !== 'string') return false
  const normalized = rawName.trim().toLowerCase()
  if (!normalized) return false
  if (mainType === SupportedTypes.Int) return INT_BIGINT_ALIASES.has(normalized)
  if (mainType === SupportedTypes.UInt) return UINT_BIGINT_ALIASES.has(normalized)
  return false
}
