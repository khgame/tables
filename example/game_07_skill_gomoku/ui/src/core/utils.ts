let nextId = 1;

export const deepClone = <T>(value: T): T => {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map(item => deepClone(item)) as unknown as T;
  }
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    result[key] = deepClone(val);
  }
  return result as T;
};

export const generateId = (prefix = 'id'): string => `${prefix}-${nextId++}`;

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const parseEffectParams = (raw?: string): Record<string, string | number> => {
  if (!raw) return {};
  return raw.split(',').reduce<Record<string, string | number>>((acc, pair) => {
    const [key, val = ''] = pair.split('=');
    if (!key) return acc;
    const trimmedKey = key.trim();
    const trimmedVal = val.trim();
    const numeric = Number(trimmedVal);
    acc[trimmedKey] = Number.isNaN(numeric) ? trimmedVal : numeric;
    return acc;
  }, {});
};

export const parseTags = (raw?: string): Set<string> => {
  const tags = new Set<string>();
  if (!raw) return tags;
  raw
    .split('|')
    .map(item => item.trim())
    .filter(Boolean)
    .forEach(tag => tags.add(tag));
  return tags;
};
