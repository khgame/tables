import { normalizeSlug } from './utils.js';
export function findBySlug(list, slug, fallbackIndex = 0) {
    if (!list.length)
        return null;
    if (!slug)
        return list[fallbackIndex] ?? null;
    const normalized = normalizeSlug(slug);
    return (list.find(item => normalizeSlug(item.tid).endsWith(normalized) || normalizeSlug(item.name ?? '') === normalized) ||
        list[fallbackIndex] ||
        null);
}
export function findByTid(list, tid) {
    if (!tid)
        return null;
    return list.find(item => item.tid === tid) ?? null;
}
export function buildEnemyIndex(list) {
    const lookup = new Map();
    list.forEach(enemy => lookup.set(enemy.tid, enemy));
    return lookup;
}
export function resolveEnemyTemplate(lookup, enemyId) {
    const normalized = String(enemyId);
    return lookup.get(normalized) ?? null;
}
