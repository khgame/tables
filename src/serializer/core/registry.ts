import type { Serializer } from '../../types'

export interface SerializerFormatEntry {
  suffix: string
  serializer: Serializer
}

const registry = new Map<string, SerializerFormatEntry>()

export function registerSerializerFormat(
  name: string,
  entry: SerializerFormatEntry,
  options: { override?: boolean } = {}
): void {
  const key = normalizeName(name)
  if (!key) {
    throw new Error('Serializer format name must be a non-empty string')
  }
  const normalizedEntry: SerializerFormatEntry = {
    suffix: entry.suffix,
    serializer: entry.serializer
  }
  const existing = registry.get(key)
  if (existing) {
    const identical = existing.suffix === normalizedEntry.suffix && existing.serializer === normalizedEntry.serializer
    if (!identical && !options.override) {
      throw new Error(`Serializer format '${key}' already registered`)
    }
  }
  registry.set(key, normalizedEntry)
}

export function getSerializerFormat(name: string): SerializerFormatEntry | undefined {
  const key = normalizeName(name)
  if (!key) return undefined
  const entry = registry.get(key)
  if (!entry) return undefined
  return { ...entry }
}

export function listSerializerFormats(): string[] {
  return Array.from(registry.keys()).sort()
}

export function removeSerializerFormat(name: string): boolean {
  const key = normalizeName(name)
  if (!key) return false
  return registry.delete(key)
}

export function clearSerializerFormats(): void {
  registry.clear()
}

function normalizeName(name: string): string {
  return (name || '').trim()
}
