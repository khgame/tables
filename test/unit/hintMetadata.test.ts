import { SupportedTypes } from '@khgame/schema'
import { resolveHintMetadata, shouldAnnotateAsBigInt } from '../../src/serializer/hintmeta/hintMetadata'

describe('hint metadata resolver', () => {
  it('annotates signed 64-bit integers as bigint strategy', () => {
    const meta = resolveHintMetadata('int64', SupportedTypes.Int)
    expect(meta).toBeDefined()
    expect(meta!.strategyHint).toBe('bigint')
    expect(meta!.flavor).toBe('int64')
    expect(meta!.sourceAlias).toBe('int64')
  })

  it('default signed integers receive safe-int strategy', () => {
    const meta = resolveHintMetadata('int32', SupportedTypes.Int)
    expect(meta).toBeDefined()
    expect(meta!.strategyHint).toBe('int')
    expect(meta!.flavor).toBe('int')
  })

  it('unsigned 64-bit integers map to bigint strategy', () => {
    const meta = resolveHintMetadata('uint64', SupportedTypes.UInt)
    expect(meta).toBeDefined()
    expect(meta!.strategyHint).toBe('bigint')
    expect(meta!.flavor).toBe('uint64')
  })

  it('ignores non-numeric aliases while keeping diagnostics', () => {
    const meta = resolveHintMetadata('@', SupportedTypes.UInt)
    expect(meta).toBeDefined()
    expect(meta!.strategyHint).toBeUndefined()
    expect(meta!.sourceAlias).toBe('@')
  })

  it('recognizes float aliases and helper predicate for bigint', () => {
    const floatMeta = resolveHintMetadata('float', SupportedTypes.Float)
    expect(floatMeta?.strategyHint).toBe('float')
    expect(shouldAnnotateAsBigInt('int64', SupportedTypes.Int)).toBe(true)
    expect(shouldAnnotateAsBigInt('uint32', SupportedTypes.UInt)).toBe(false)
    expect(resolveHintMetadata('custom', SupportedTypes.String)?.sourceAlias).toBe('custom')
    expect(shouldAnnotateAsBigInt('name', SupportedTypes.String)).toBe(false)
  })

  it('handles edge aliases and unsigned float flavors', () => {
    expect(resolveHintMetadata(undefined, SupportedTypes.Int)).toBeUndefined()
    expect(resolveHintMetadata('   ', SupportedTypes.Int)).toBeUndefined()
    const uintMeta = resolveHintMetadata('uint16', SupportedTypes.UInt)
    expect(uintMeta?.flavor).toBe('uint')
    const ufloatMeta = resolveHintMetadata('ufloat', SupportedTypes.UFloat)
    expect(ufloatMeta?.flavor).toBe('ufloat')
    expect(shouldAnnotateAsBigInt('uint64', SupportedTypes.UInt)).toBe(true)
  })
})
