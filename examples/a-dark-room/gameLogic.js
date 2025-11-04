/**
 * 游戏核心逻辑模块
 * 职责：资源容量计算、需求检查、生产循环、事件执行、状态推进
 */

window.ADRGameLogic = window.ADRGameLogic || {};

const { toNumber, clamp, normalizeEffects } = window.ADRUtils;

window.ADRGameLogic.computeCapacities = (resources, buildingsState, buildingMap) => {
  const capInfo = {};

  resources.forEach(res => {
    const base = toNumber(res.baseCapacity);
    const max = toNumber(res.maxCapacity);
    capInfo[res.key] = { base, max: max > 0 ? max : Infinity, extra: 0 };
  });

  Object.entries(buildingsState || {}).forEach(([tid, count]) => {
    const total = toNumber(count);
    if (!total) return;

    const building = buildingMap.get(Number(tid));
    if (!building) return;

    const effects = normalizeEffects(building.effects);
    effects.forEach(effect => {
      if (effect.type === 'storage') {
        const info = capInfo[effect.resource];
        if (!info) return;
        info.extra += toNumber(effect.amount) * total;
      }
    });
  });

  const result = {};
  Object.entries(capInfo).forEach(([key, info]) => {
    const total = info.base + info.extra;
    result[key] = Math.min(total, info.max);
  });

  return result;
};

window.ADRGameLogic.checkRequirement = (unlock, state) => {
  if (!unlock || typeof unlock !== 'object' || Object.keys(unlock).length === 0) return true;

  const resources = unlock.resources || {};
  const buildings = unlock.buildings || {};
  const actions = unlock.actions || {};
  const events = unlock.events || {};
  const jobs = unlock.jobs || {};

  for (const [key, rule] of Object.entries(resources)) {
    const value = toNumber(state.resources[key]);
    if (rule.min !== undefined && value < toNumber(rule.min)) return false;
    if (rule.max !== undefined && value > toNumber(rule.max)) return false;
  }

  for (const [tid, min] of Object.entries(buildings)) {
    const owned = toNumber(state.buildings[Number(tid)]);
    if (owned < toNumber(min)) return false;
  }

  for (const [tid] of Object.entries(actions)) {
    if (!state.permanentUnlocks.actions.has(Number(tid))) return false;
  }

  for (const [tid] of Object.entries(events)) {
    if (!state.eventsTriggered.has(Number(tid))) return false;
  }

  for (const [tid, min] of Object.entries(jobs)) {
    if (toNumber(state.jobs[Number(tid)]) < toNumber(min)) return false;
  }

  return true;
};

window.ADRGameLogic.applyProduction = (state, dt, helpers, capacities) => {
  const { resources: resourceList, jobs: jobList } = helpers;
  const delta = {};
  const shadow = { ...state.resources };

  // 基础资源衰减和生产
  resourceList.forEach(res => {
    const baseChange = toNumber(res.baseRate) * dt;
    const decayChange = toNumber(res.decayRate) * dt;
    const change = baseChange + decayChange;
    if (!change) return;

    const before = shadow[res.key] || 0;
    const cap = capacities[res.key] ?? Infinity;
    const after = clamp(before + change, 0, cap);
    const applied = after - before;

    if (applied) {
      shadow[res.key] = after;
      delta[res.key] = (delta[res.key] || 0) + applied;
    }
  });

  // 职业生产逻辑
  jobList.forEach(job => {
    const assigned = toNumber(state.jobs[job.tid] || 0);
    if (!assigned) return;
    if (!window.ADRGameLogic.checkRequirement(job.unlock, state)) return;

    const jobRate = toNumber(job.baseRate) * assigned;
    if (!jobRate) return;

    // 计算资源限制因子
    let factor = 1;
    Object.entries(job.consumes || {}).forEach(([resKey, costPerWorker]) => {
      const cost = toNumber(costPerWorker) * jobRate * dt;
      if (cost <= 0) return;

      const available = shadow[resKey] || 0;
      if (available <= 0) {
        factor = 0;
      } else {
        factor = Math.min(factor, available / cost);
      }
    });

    factor = clamp(factor, 0, 1);
    if (!factor) return;

    // 消耗资源
    Object.entries(job.consumes || {}).forEach(([resKey, costPerWorker]) => {
      const cost = toNumber(costPerWorker) * jobRate * factor * dt;
      if (!cost) return;
      shadow[resKey] = Math.max(0, (shadow[resKey] || 0) - cost);
      delta[resKey] = (delta[resKey] || 0) - cost;
    });

    // 生产资源
    Object.entries(job.produces || {}).forEach(([resKey, gainPerWorker]) => {
      const gain = toNumber(gainPerWorker) * jobRate * factor * dt;
      if (!gain) return;

      const cap = capacities[resKey] ?? Infinity;
      const before = shadow[resKey] || 0;
      const after = clamp(before + gain, 0, cap);
      const applied = after - before;

      if (applied) {
        shadow[resKey] = after;
        delta[resKey] = (delta[resKey] || 0) + applied;
      }
    });
  });

  // 应用变化到状态
  Object.entries(shadow).forEach(([key, value]) => {
    state.resources[key] = value;
  });

  return delta;
};

window.ADRGameLogic.pushLog = (state, message, now, limit = 100) => {
  const timestamp = new Date(now).toLocaleTimeString();
  state.log = [...state.log.slice(-(limit - 1)), { when: timestamp, message }];
};

window.ADRGameLogic.executeEvent = (event, state, helpers, capacities, now) => {
  const { logLimit } = helpers;
  const { checkRequirement, pushLog } = window.ADRGameLogic;

  // 检查事件触发条件
  if (event.once && state.eventsTriggered.has(event.tid)) return false;

  const nextAllowed = toNumber(state.eventCooldowns[event.tid]);
  if (nextAllowed && now < nextAllowed) return false;

  if (!checkRequirement(event.trigger, state)) return false;

  // 标记事件已触发
  state.eventsTriggered.add(event.tid);

  const cooldownSec = toNumber(event.cooldownSeconds);
  if (cooldownSec > 0) {
    state.eventCooldowns[event.tid] = now + cooldownSec * 1000;
  } else if (event.once) {
    state.eventCooldowns[event.tid] = Infinity;
  }

  // 记录日志
  if (event.log) {
    pushLog(state, event.log, now, logLimit);
  }

  // 执行效果
  normalizeEffects(event.effects).forEach(effect => {
    switch (effect.type) {
      case 'resource': {
        const cap = capacities[effect.resource] ?? Infinity;
        const before = state.resources[effect.resource] || 0;
        const after = clamp(before + toNumber(effect.amount), 0, cap);
        state.resources[effect.resource] = after;
        break;
      }
      case 'log':
        pushLog(state, effect.message, now, logLimit);
        break;
      case 'unlockAction':
        state.permanentUnlocks.actions.add(effect.action);
        break;
      case 'unlockJob':
        state.permanentUnlocks.jobs.add(effect.job);
        break;
    }
  });

  return true;
};

window.ADRGameLogic.advanceState = (state, seconds, helpers) => {
  if (seconds <= 0) return {};

  const { resources, events, buildingMap, jobs } = helpers;
  const {
    computeCapacities,
    applyProduction,
    executeEvent,
    computeJobCaps,
    enforceJobCaps,
    processAchievements
  } = window.ADRGameLogic;
  let remaining = seconds;
  let currentTime = state.lastTimestamp;
  const cumulative = {};

  processAchievements(state, helpers, currentTime);

  // 分步模拟，每次最多1秒
  while (remaining > 0) {
    const dt = Math.min(1, remaining);
    currentTime += dt * 1000;

    const jobCaps = computeJobCaps(jobs, state.buildings, buildingMap);
    enforceJobCaps(state, jobCaps);
    const capacities = computeCapacities(resources, state.buildings, buildingMap);
    const delta = applyProduction(state, dt, helpers, capacities);

    Object.entries(delta).forEach(([key, value]) => {
      cumulative[key] = (cumulative[key] || 0) + value;
    });

    // 检查并执行事件
    events.forEach(event => {
      executeEvent(event, state, helpers, capacities, currentTime);
    });

    processAchievements(state, helpers, currentTime);

    remaining -= dt;
  }

  state.lastTimestamp = currentTime;
  return cumulative;
};

window.ADRGameLogic.computeJobCaps = (jobs, buildingsState, buildingMap) => {
  const caps = {};

  jobs.forEach(job => {
    caps[job.tid] = Math.max(0, toNumber(job.baseCap) || 0);
  });

  Object.entries(buildingsState || {}).forEach(([tid, count]) => {
    const total = toNumber(count);
    if (!total) return;

    const building = buildingMap.get(Number(tid));
    if (!building) return;

    const effects = normalizeEffects(building.effects);
    effects.forEach(effect => {
      if (effect.type === 'jobCap' && effect.job) {
        const jobTid = Number(effect.job);
        caps[jobTid] = (caps[jobTid] || 0) + toNumber(effect.amount) * total;
      }
    });
  });

  const normalizedCaps = {};
  Object.entries(caps).forEach(([tid, value]) => {
    const capped = Math.max(0, Math.floor(value + 1e-6));
    normalizedCaps[Number(tid)] = capped;
  });

  return normalizedCaps;
};

window.ADRGameLogic.enforceJobCaps = (state, jobCaps) => {
  let changed = false;
  Object.entries(jobCaps).forEach(([tid, cap]) => {
    const current = toNumber(state.jobs[Number(tid)] || 0);
    if (cap >= 0 && current > cap) {
      state.jobs[Number(tid)] = cap;
      changed = true;
    }
  });
  if (changed) {
    // Remove zero entries for cleanliness
    Object.keys(state.jobs).forEach(tid => {
      if (!state.jobs[tid]) delete state.jobs[tid];
    });
  }
};

window.ADRGameLogic.computeScaledCost = (building, currentCount) => {
  const baseCost = building.cost || {};
  const scaling = toNumber(building.costScaling) || 0;
  const factor = scaling ? Math.pow(1 + scaling, currentCount) : 1;
  const result = {};
  Object.entries(baseCost).forEach(([resKey, cost]) => {
    result[resKey] = Math.ceil(toNumber(cost) * factor);
  });
  return result;
};

window.ADRGameLogic.applyBuildingEffectsOnBuild = (building, state, helpers) => {
  const effects = normalizeEffects(building.effects);
  if (!effects.length) return;

  state.permanentUnlocks = state.permanentUnlocks || { actions: new Set(), jobs: new Set(), buildings: new Set() };
  if (!state.permanentUnlocks.actions) state.permanentUnlocks.actions = new Set();
  if (!state.permanentUnlocks.jobs) state.permanentUnlocks.jobs = new Set();
  if (!state.permanentUnlocks.buildings) state.permanentUnlocks.buildings = new Set();

  const now = Date.now();
  const {
    logLimit,
    eventMap,
    resources,
    buildingMap,
    jobMap,
    actionMap
  } = helpers;

  const capacities = window.ADRGameLogic.computeCapacities(resources, state.buildings, buildingMap);

  effects.forEach(effect => {
    switch (effect.type) {
      case 'unlockJob':
        if (effect.job) {
          state.permanentUnlocks.jobs.add(Number(effect.job));
          const jobName = jobMap?.get?.(Number(effect.job))?.label;
          window.ADRGameLogic.pushLog(state, `新的岗位：${jobName || effect.job}`, now, logLimit);
        }
        break;
      case 'unlockAction':
        if (effect.action) {
          state.permanentUnlocks.actions.add(Number(effect.action));
          const actionName = actionMap?.get?.(Number(effect.action))?.label;
          window.ADRGameLogic.pushLog(state, `新增行动：${actionName || effect.action}`, now, logLimit);
        }
        break;
      case 'resource':
        if (effect.resource) {
          const cap = capacities[effect.resource] ?? Infinity;
          const before = state.resources[effect.resource] || 0;
          const after = clamp(before + toNumber(effect.amount), 0, cap);
          state.resources[effect.resource] = after;
        }
        break;
      case 'log':
        if (effect.message) {
          window.ADRGameLogic.pushLog(state, effect.message, now, logLimit);
        }
        break;
      case 'event': {
        if (!effect.event) break;
        const eventObj = eventMap.get(Number(effect.event));
        if (eventObj) {
          window.ADRGameLogic.executeEvent(eventObj, state, helpers, capacities, now);
        }
        break;
      }
      default:
        break;
    }
  });
};

window.ADRGameLogic.applyAchievementEffects = (achievement, state, helpers, now) => {
  state.permanentUnlocks = state.permanentUnlocks || { actions: new Set(), jobs: new Set(), buildings: new Set() };
  if (!state.permanentUnlocks.actions) state.permanentUnlocks.actions = new Set();
  if (!state.permanentUnlocks.jobs) state.permanentUnlocks.jobs = new Set();
  if (!state.permanentUnlocks.buildings) state.permanentUnlocks.buildings = new Set();

  const {
    logLimit,
    actionMap,
    jobMap,
    buildingMap
  } = helpers;

  normalizeEffects(achievement.effects).forEach(effect => {
    let cachedCapacities;
    const getCapacities = () => {
      if (!cachedCapacities) {
        cachedCapacities = window.ADRGameLogic.computeCapacities(
          helpers.resources || [],
          state.buildings,
          helpers.buildingMap || new Map()
        );
      }
      return cachedCapacities;
    };

    switch (effect.type) {
      case 'unlockBuilding':
        if (effect.building) {
          state.permanentUnlocks.buildings.add(Number(effect.building));
          const buildingName = buildingMap?.get?.(Number(effect.building))?.label;
          window.ADRGameLogic.pushLog(state, `建筑解锁：${buildingName || effect.building}`, now, logLimit);
        }
        break;
      case 'unlockAction':
        if (effect.action) {
          state.permanentUnlocks.actions.add(Number(effect.action));
          const actionName = actionMap?.get?.(Number(effect.action))?.label;
          window.ADRGameLogic.pushLog(state, `新增行动：${actionName || effect.action}`, now, logLimit);
        }
        break;
      case 'unlockJob':
        if (effect.job) {
          state.permanentUnlocks.jobs.add(Number(effect.job));
          const jobName = jobMap?.get?.(Number(effect.job))?.label;
          window.ADRGameLogic.pushLog(state, `新的岗位：${jobName || effect.job}`, now, logLimit);
        }
        break;
      case 'resource':
        if (effect.resource) {
          const cap = getCapacities()[effect.resource] ?? Infinity;
          const before = state.resources[effect.resource] || 0;
          const after = clamp(before + toNumber(effect.amount), 0, cap);
          state.resources[effect.resource] = after;
        }
        break;
      case 'log':
        if (effect.message) {
          window.ADRGameLogic.pushLog(state, effect.message, now, logLimit);
        }
        break;
      default:
        break;
    }
  });
};

window.ADRGameLogic.processAchievements = (state, helpers, now = Date.now()) => {
  const achievements = helpers.achievements || [];
  if (!achievements.length) return;

  state.achievementsUnlocked = state.achievementsUnlocked || new Set();
  state.permanentUnlocks = state.permanentUnlocks || { actions: new Set(), jobs: new Set(), buildings: new Set() };
  if (!state.permanentUnlocks.buildings) state.permanentUnlocks.buildings = new Set();
  if (!state.permanentUnlocks.actions) state.permanentUnlocks.actions = new Set();
  if (!state.permanentUnlocks.jobs) state.permanentUnlocks.jobs = new Set();

  achievements.forEach(ach => {
    if (state.achievementsUnlocked.has(ach.tid)) return;
    if (!window.ADRGameLogic.checkRequirement(ach.trigger, state)) return;
    state.achievementsUnlocked.add(ach.tid);
    window.ADRGameLogic.pushLog(state, `成就达成：《${ach.label}》`, now, helpers.logLimit || 100);
    window.ADRGameLogic.applyAchievementEffects(ach, state, helpers, now);
  });
};
