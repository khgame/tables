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
  if (!unlock || typeof unlock !== 'object') return true;

  const { resources = {}, buildings = {}, actions = {} } = unlock;

  for (const [key, min] of Object.entries(resources)) {
    if (toNumber(state.resources[key]) < toNumber(min)) return false;
  }

  for (const [tid, min] of Object.entries(buildings)) {
    if (toNumber(state.buildings[Number(tid)]) < toNumber(min)) return false;
  }

  for (const [tid] of Object.entries(actions)) {
    if (!state.permanentUnlocks.actions.has(Number(tid))) return false;
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

  const { resources, events, buildingMap } = helpers;
  const { computeCapacities, applyProduction, executeEvent } = window.ADRGameLogic;
  let remaining = seconds;
  let currentTime = state.lastTimestamp;
  const cumulative = {};

  // 分步模拟，每次最多1秒
  while (remaining > 0) {
    const dt = Math.min(1, remaining);
    currentTime += dt * 1000;

    const capacities = computeCapacities(resources, state.buildings, buildingMap);
    const delta = applyProduction(state, dt, helpers, capacities);

    Object.entries(delta).forEach(([key, value]) => {
      cumulative[key] = (cumulative[key] || 0) + value;
    });

    // 检查并执行事件
    events.forEach(event => {
      executeEvent(event, state, helpers, capacities, currentTime);
    });

    remaining -= dt;
  }

  state.lastTimestamp = currentTime;
  return cumulative;
};