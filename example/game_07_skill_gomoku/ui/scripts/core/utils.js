let nextId = 1;

export function deepClone(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map(item => deepClone(item));
  }
  const result = {};
  for (const [key, val] of Object.entries(value)) {
    result[key] = deepClone(val);
  }
  return result;
}

export function generateId(prefix = 'id') {
  return `${prefix}-${nextId++}`;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function parseEffectParams(raw) {
  if (!raw) return {};
  return raw.split(',').reduce((acc, pair) => {
    const [key, val = ''] = pair.split('=');
    if (!key) return acc;
    const trimmedKey = key.trim();
    const trimmedVal = val.trim();
    const numeric = Number(trimmedVal);
    acc[trimmedKey] = Number.isNaN(numeric) ? trimmedVal : numeric;
    return acc;
  }, {});
}
