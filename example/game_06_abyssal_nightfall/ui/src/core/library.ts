import { normalizeSlug } from './utils';
import type { EnemyRow } from './types';

export function findBySlug<T extends { tid: string; name?: string }>(
  list: T[],
  slug: string,
  fallbackIndex = 0
): T | null {
  if (!list.length) return null;
  if (!slug) return list[fallbackIndex] ?? null;
  const normalized = normalizeSlug(slug);
  return (
    list.find(item => normalizeSlug(item.tid).endsWith(normalized) || normalizeSlug(item.name ?? '') === normalized) ||
    list[fallbackIndex] ||
    null
  );
}

export function findByTid<T extends { tid: string }>(list: T[], tid?: string | null): T | null {
  if (!tid) return null;
  return list.find(item => item.tid === tid) ?? null;
}

export function buildEnemyIndex(list: EnemyRow[]): Map<string, EnemyRow> {
  const lookup = new Map<string, EnemyRow>();
  list.forEach(enemy => lookup.set(enemy.tid, enemy));
  return lookup;
}

export function resolveEnemyTemplate(lookup: Map<string, EnemyRow>, enemyId: string | number): EnemyRow | null {
  const normalized = String(enemyId);
  return lookup.get(normalized) ?? null;
}
