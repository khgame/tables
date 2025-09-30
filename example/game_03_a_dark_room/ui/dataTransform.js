/**
 * 数据转换和迁移模块
 * 职责:表格数据转换、存档迁移、键值映射
 */

window.ADRDataTransform = window.ADRDataTransform || {};

const { toNumber } = window.ADRUtils;

window.ADRDataTransform.datasetToArray = (dataset, mapper) => {
  if (!dataset || !Array.isArray(dataset.tids)) return [];
  return dataset.tids.map(tid => mapper(dataset.result[tid] || {}, Number(tid)));
};

window.ADRDataTransform.migrateRecordKeys = (record, lookup) => {
  if (!record) return {};
  const migrated = {};
  let changed = false;

  Object.entries(record).forEach(([key, value]) => {
    const numeric = Number(key);
    if (!Number.isNaN(numeric) && `${numeric}` === String(key)) {
      migrated[numeric] = value;
      if (numeric !== key) changed = true;
    } else if (lookup && lookup[key] !== undefined) {
      migrated[lookup[key]] = value;
      changed = true;
    } else {
      migrated[key] = value;
    }
  });

  return changed ? migrated : record;
};

window.ADRDataTransform.migrateSetValues = (values, lookup) => {
  const array = Array.isArray(values) ? values : values ? Array.from(values) : [];
  const result = new Set();

  array.forEach(value => {
    const numeric = Number(value);
    if (!Number.isNaN(numeric) && `${numeric}` === String(value)) {
      result.add(numeric);
    } else if (lookup && lookup[value] !== undefined) {
      result.add(lookup[value]);
    }
  });

  return result;
};

window.ADRDataTransform.transformResourceData = (row, tid) => ({
  tid,
  key: row.key,
  label: row.label,
  description: row.description,
  baseRate: toNumber(row.baseRate),
  decayRate: toNumber(row.decayRate),
  baseCapacity: toNumber(row.baseCapacity),
  maxCapacity: toNumber(row.maxCapacity),
  sequence: toNumber(row.sequence),
  displayOrder: toNumber(row.displayOrder)
});

window.ADRDataTransform.transformJobData = (row, tid) => ({
  tid,
  key: row.key,
  label: row.label,
  description: row.description,
  produces: row.produces || {},
  consumes: row.consumes || {},
  baseRate: toNumber(row.baseRate) || 1,
  unlock: row.unlock || {}
});

window.ADRDataTransform.transformBuildingData = (row, tid, normalizeEffects) => ({
  tid,
  key: row.key,
  label: row.label,
  description: row.description,
  cost: row.cost || {},
  effects: normalizeEffects(row.effects),
  unlock: row.unlock || {},
  repeatable: row.repeatable !== false,
  maxCount: toNumber(row.maxCount) || 0
});

// 直接使用配置表字段，不做转换
window.ADRDataTransform.transformActionData = (row, tid) => ({
  tid,
  key: row.key,
  label: row.label,
  description: row.description,
  cost: row.cost || {},
  reward: row.reward || {},
  cooldown: toNumber(row.cooldown || 0),
  unlock: row.unlock || {}
});

window.ADRDataTransform.transformEventData = (row, tid, normalizeEffects) => ({
  tid,
  key: row.key,
  label: row.label,
  description: row.description,
  log: row.log || '',
  trigger: row.trigger || {},
  effects: normalizeEffects(row.effects),
  cooldownSeconds: toNumber(row.cooldownSeconds),
  once: row.once === true
});