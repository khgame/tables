/**
 * 数据转换和迁移模块
 * 职责:表格数据转换、存档迁移、键值映射
 */

window.ADRDataTransform = window.ADRDataTransform || {};

const { toNumber } = window.ADRUtils;

function normalizeUnlock(raw) {
  if (!raw || typeof raw !== 'object') return {};

  const normalized = {
    resources: {},
    buildings: {},
    actions: {},
    events: {},
    jobs: {}
  };

  const ensureResource = key => {
    if (!normalized.resources[key]) normalized.resources[key] = {};
    return normalized.resources[key];
  };

  if (raw.resource) {
    const info = ensureResource(raw.resource);
    if (raw.min !== undefined) info.min = toNumber(raw.min);
    if (raw.max !== undefined) info.max = toNumber(raw.max);
  }

  if (raw.resources && typeof raw.resources === 'object') {
    Object.entries(raw.resources).forEach(([resKey, value]) => {
      const info = ensureResource(resKey);
      if (typeof value === 'object') {
        if (value.min !== undefined) info.min = toNumber(value.min);
        if (value.max !== undefined) info.max = toNumber(value.max);
      } else if (!Number.isNaN(Number(value))) {
        info.min = toNumber(value);
      }
    });
  }

  if (raw.villagers !== undefined) {
    ensureResource('villagers').min = toNumber(raw.villagers);
  }

  if (raw.building) {
    normalized.buildings[raw.building] = Math.max(1, toNumber(raw.buildingCount || 1));
  }

  if (raw.buildings && typeof raw.buildings === 'object') {
    Object.entries(raw.buildings).forEach(([tid, count]) => {
      normalized.buildings[tid] = Math.max(1, toNumber(count || 1));
    });
  }

  if (raw.action) {
    normalized.actions[raw.action] = true;
  }

  if (raw.actions && typeof raw.actions === 'object') {
    Object.keys(raw.actions).forEach(tid => {
      normalized.actions[tid] = true;
    });
  }

  if (raw.event) {
    normalized.events[raw.event] = true;
  }

  if (raw.events && typeof raw.events === 'object') {
    Object.keys(raw.events).forEach(tid => {
      normalized.events[tid] = true;
    });
  }

  if (raw.jobs && typeof raw.jobs === 'object') {
    Object.entries(raw.jobs).forEach(([tid, count]) => {
      normalized.jobs[tid] = Math.max(1, toNumber(count || 1));
    });
  }

  // Remove empty categories for cleanliness
  Object.keys(normalized).forEach(key => {
    if (Object.keys(normalized[key]).length === 0) delete normalized[key];
  });

  return normalized;
}

window.ADRDataTransform.normalizeUnlock = normalizeUnlock;

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
  baseCap: toNumber(row.baseCap) || 0,
  unlock: normalizeUnlock(row.unlock)
});

window.ADRDataTransform.transformBuildingData = (row, tid, normalizeEffects) => ({
  tid,
  key: row.key,
  label: row.label,
  description: row.description,
  cost: row.cost || {},
  costScaling: toNumber(row.costScaling) || 0,
  effects: normalizeEffects(row.effects),
  unlock: normalizeUnlock(row.unlock),
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
  unlock: normalizeUnlock(row.unlock),
  logStart: row.logStart,
  logResult: row.logResult,
  offline: row.offline === true
});

window.ADRDataTransform.transformEventData = (row, tid, normalizeEffects) => ({
  tid,
  key: row.key,
  label: row.label,
  description: row.description,
  log: row.log || '',
  trigger: normalizeUnlock(row.trigger),
  effects: normalizeEffects(row.effects),
  cooldownSeconds: toNumber(row.cooldownSeconds),
  once: row.once === true
});

window.ADRDataTransform.transformAchievementData = (row, tid, normalizeEffects) => ({
  tid,
  key: row.key,
  label: row.label,
  description: row.description,
  trigger: normalizeUnlock(row.trigger),
  effects: normalizeEffects(row.effects)
});
