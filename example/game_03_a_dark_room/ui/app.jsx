/**
 * A Dark Room - 主应用入口
 * 基于 @khgame/tables 的增量游戏演示
 */

const { toNumber, normalizeEffects, buildLookup, clamp, formatNumber } = window.ADRUtils;
const {
  datasetToArray,
  transformResourceData,
  transformJobData,
  transformBuildingData,
  transformActionData,
  transformEventData
} = window.ADRDataTransform;
const { deriveScene, SCENE_LABELS } = window.ADRSceneConfig;
const {
  computeCapacities,
  checkRequirement,
  applyProduction,
  pushLog
} = window.ADRGameLogic;
const { StatChip, ResourceCard, ListItem } = window.ADRComponents;
const { useGameState, useAutoSave, useGameTick, useResetGame } = window.ADRHooks;

const React = window.React;
const ReactDOM = window.ReactDOM;
const { useMemo, useState, useCallback } = React;

const data = window.TABLES_DATA || {};

function App() {
  // ==================== 配置解析 ====================
  const globalDataset = data.globalConfig || { result: {} };
  const config = useMemo(() => {
    const res = {};
    Object.values(globalDataset.result || {}).forEach(entry => {
      res[entry.key] = entry.value;
    });
    return res;
  }, [globalDataset]);

  // ==================== 数据转换 ====================
  const resourceList = useMemo(() =>
    datasetToArray(data.resources, transformResourceData)
      .sort((a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label)),
    []
  );

  const jobList = useMemo(() =>
    datasetToArray(data.jobs, transformJobData),
    []
  );

  const buildingList = useMemo(() =>
    datasetToArray(data.buildings, (row, tid) => transformBuildingData(row, tid, normalizeEffects)),
    []
  );

  const actionList = useMemo(() =>
    datasetToArray(data.actions, transformActionData),
    []
  );

  const eventList = useMemo(() =>
    datasetToArray(data.events, (row, tid) => transformEventData(row, tid, normalizeEffects)),
    []
  );

  // ==================== 索引构建 ====================
  const resourceMap = useMemo(() => buildLookup(resourceList), [resourceList]);
  const jobMap = useMemo(() => buildLookup(jobList, 'tid'), [jobList]);
  const buildingMap = useMemo(() => buildLookup(buildingList, 'tid'), [buildingList]);
  const actionMap = useMemo(() => buildLookup(actionList, 'tid'), [actionList]);
  const eventMap = useMemo(() => buildLookup(eventList, 'tid'), [eventList]);

  const buildingKeyToTid = useMemo(() =>
    Object.fromEntries(buildingList.map(b => [b.key, b.tid])),
    [buildingList]
  );

  const actionKeyToTid = useMemo(() =>
    Object.fromEntries(actionList.map(a => [a.key, a.tid])),
    [actionList]
  );

  const eventKeyToTid = useMemo(() =>
    Object.fromEntries(eventList.map(e => [e.key, e.tid])),
    [eventList]
  );

  // ==================== 状态管理 ====================
  const createInitialState = useCallback(() => {
    const resourceState = {};
    resourceList.forEach(res => { resourceState[res.key] = 0; });
    resourceState.warmth = toNumber(config.initialWarmth) || 0;
    resourceState.wood = toNumber(config.initialWood) || 0;
    resourceState.villagers = toNumber(config.initialVillagers) || 1;

    return {
      resources: resourceState,
      buildings: {},
      jobs: {},
      actionCooldowns: {},
      eventCooldowns: {},
      eventsTriggered: new Set(),
      log: [],
      permanentUnlocks: { actions: new Set(), jobs: new Set() },
      lastTimestamp: Date.now()
    };
  }, [resourceList, config]);

  const { state, setState, stateRef } = useGameState(
    createInitialState,
    buildingKeyToTid,
    actionKeyToTid,
    eventKeyToTid
  );

  const [, forceUpdate] = useState(0);

  // ==================== 辅助对象 ====================
  const helpers = useMemo(() => ({
    resources: resourceList,
    jobs: jobList,
    buildings: buildingList,
    actions: actionList,
    events: eventList,
    resourceMap,
    jobMap,
    buildingMap,
    actionMap,
    eventMap,
    buildingKeyToTid,
    checkRequirement,
    pushLog,
    logLimit: 100,
    stateRef
  }), [
    resourceList, jobList, buildingList, actionList, eventList,
    resourceMap, jobMap, buildingMap, actionMap, eventMap,
    buildingKeyToTid, stateRef
  ]);

  // ==================== 生命周期 ====================
  useAutoSave(stateRef, config.autosaveInterval);
  useGameTick(helpers, config.baseTickSeconds, forceUpdate);

  // ==================== 派生数据 ====================
  const capacities = useMemo(() =>
    computeCapacities(resourceList, state.buildings, buildingMap),
    [resourceList, state.buildings, buildingMap]
  );

  const rates = useMemo(() => {
    const result = {};
    const tempState = JSON.parse(JSON.stringify(state));
    const delta = applyProduction(tempState, 1, helpers, capacities);
    Object.entries(delta).forEach(([key, value]) => {
      result[key] = value;
    });
    return result;
  }, [state, helpers, capacities]);

  const scene = useMemo(() =>
    deriveScene(state, buildingKeyToTid),
    [state, buildingKeyToTid]
  );

  const visibleActions = useMemo(() =>
    actionList.filter(action =>
      state.permanentUnlocks.actions.has(action.tid) || checkRequirement(action.unlock, state)
    ),
    [actionList, state]
  );

  const visibleJobs = useMemo(() =>
    jobList.filter(job =>
      state.permanentUnlocks.jobs.has(job.tid) || checkRequirement(job.unlock, state)
    ),
    [jobList, state]
  );

  const visibleBuildings = useMemo(() =>
    buildingList.filter(building => checkRequirement(building.unlock, state)),
    [buildingList, state]
  );

  const totalVillagers = toNumber(state.resources.villagers);
  const assignedVillagers = Object.values(state.jobs).reduce((sum, count) => sum + toNumber(count), 0);
  const idleVillagers = totalVillagers - assignedVillagers;

  // ==================== 事件处理器 ====================
  const handleAction = useCallback((actionTid) => {
    const action = actionMap.get(actionTid);
    if (!action) return;

    const now = Date.now();
    const nextAllowed = state.actionCooldowns[actionTid];
    if (nextAllowed && now < nextAllowed) return;

    for (const [resKey, cost] of Object.entries(action.cost)) {
      if (toNumber(state.resources[resKey]) < toNumber(cost)) return;
    }

    const newState = { ...state };

    for (const [resKey, cost] of Object.entries(action.cost)) {
      newState.resources = { ...newState.resources, [resKey]: newState.resources[resKey] - toNumber(cost) };
    }

    // 处理 reward（直接使用配置表字段）
    if (action.reward && typeof action.reward === 'object') {
      Object.entries(action.reward).forEach(([resKey, amount]) => {
        const cap = capacities[resKey] ?? Infinity;
        const before = newState.resources[resKey] || 0;
        const after = clamp(before + toNumber(amount), 0, cap);
        newState.resources = { ...newState.resources, [resKey]: after };
      });
    }

    // 使用 cooldown 字段（配置表中的字段名）
    if (action.cooldown > 0) {
      newState.actionCooldowns = { ...newState.actionCooldowns, [actionTid]: now + action.cooldown * 1000 };
    }

    setState(newState);
  }, [state, actionMap, capacities, helpers.logLimit]);

  const handleBuildBuilding = useCallback((buildingTid) => {
    const building = buildingMap.get(buildingTid);
    if (!building) return;

    const current = state.buildings[buildingTid] || 0;
    if (!building.repeatable && current > 0) return;
    if (building.maxCount > 0 && current >= building.maxCount) return;

    for (const [resKey, cost] of Object.entries(building.cost)) {
      if (toNumber(state.resources[resKey]) < toNumber(cost)) return;
    }

    const newState = { ...state };

    for (const [resKey, cost] of Object.entries(building.cost)) {
      newState.resources = { ...newState.resources, [resKey]: newState.resources[resKey] - toNumber(cost) };
    }

    newState.buildings = { ...newState.buildings, [buildingTid]: current + 1 };
    pushLog(newState, `建造了 ${building.label}`, Date.now(), helpers.logLimit);

    setState(newState);
  }, [state, buildingMap, helpers.logLimit]);

  const handleAssignJob = useCallback((jobTid, delta) => {
    const job = jobMap.get(jobTid);
    if (!job) return;

    const current = state.jobs[jobTid] || 0;
    const newCount = Math.max(0, current + delta);
    const villagers = toNumber(state.resources.villagers);

    const totalAssigned = Object.values(state.jobs).reduce((sum, count) => sum + toNumber(count), 0);
    const availableVillagers = villagers - totalAssigned + current;

    if (newCount > current && newCount > current + availableVillagers) return;

    setState({
      ...state,
      jobs: { ...state.jobs, [jobTid]: newCount }
    });
  }, [state, jobMap]);

  const handleReset = useResetGame();

  // ==================== 渲染 ====================
  return React.createElement('div', {
    className: 'h-screen overflow-hidden bg-cover bg-center bg-fixed text-slate-100 transition-all duration-1000',
    style: { backgroundImage: `url(${scene.backgroundUrl})` }
  },
    React.createElement('div', {
      className: 'h-screen backdrop-blur-sm transition-all duration-1000 flex flex-col',
      style: { background: scene.overlay }
    },
      // Compact Header
      React.createElement('header', { className: 'flex-shrink-0 bg-black/30 backdrop-blur-md border-b border-white/10 px-4 py-2' },
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement('div', { className: 'flex items-center gap-6' },
            React.createElement('div', {},
              React.createElement('h1', { className: 'text-lg font-bold text-slate-100' }, 'A Dark Room'),
              React.createElement('p', { className: 'text-[10px] text-slate-400' }, '@khgame/tables · ' + SCENE_LABELS[scene.stage])
            ),
            React.createElement(StatChip, { label: '村民', value: `${idleVillagers}/${totalVillagers}`, accent: scene.accent })
          ),
          React.createElement('button', {
            onClick: handleReset,
            className: 'px-2 py-1 text-[10px] bg-red-500/20 hover:bg-red-500/30 text-red-300 transition'
          }, '重置')
        )
      ),

      // Main Content Grid - Fixed Height
      React.createElement('div', { className: 'flex-1 overflow-hidden grid grid-cols-[200px_1fr_320px] gap-0' },
        // Left: Resources (compact, no scroll)
        React.createElement('section', { className: 'bg-black/20 border-r border-white/10 p-3 overflow-y-auto' },
          React.createElement('h2', { className: 'text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider' }, '资源'),
          React.createElement('div', { className: 'space-y-1' },
            resourceList.map(resource =>
              React.createElement(ResourceCard, {
                key: resource.key,
                resource,
                amount: state.resources[resource.key] || 0,
                cap: capacities[resource.key],
                rate: rates[resource.key] || 0,
                accent: scene.accent
              })
            )
          )
        ),

        // Center: Log and Actions
        React.createElement('div', { className: 'flex flex-col overflow-hidden' },
          // Log Area (larger, central focus)
          React.createElement('section', { className: 'flex-1 bg-black/10 p-4 overflow-y-auto' },
            React.createElement('div', { className: 'max-w-2xl mx-auto' },
              React.createElement('h2', { className: 'text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider' }, '故事'),
              React.createElement('div', { className: 'space-y-1.5 text-sm' },
                state.log.length === 0 && React.createElement('p', { className: 'text-slate-500 text-xs italic' }, '静谧无声...'),
                state.log.slice().reverse().map((entry, idx) =>
                  React.createElement('p', { key: idx, className: 'text-slate-300' },
                    React.createElement('span', { className: 'text-slate-500 text-[10px]' }, `[${entry.when}]`),
                    React.createElement('span', { className: 'ml-2' }, entry.message)
                  )
                )
              )
            )
          ),

          // Actions Bar (bottom, horizontal)
          React.createElement('section', { className: 'flex-shrink-0 bg-black/30 border-t border-white/10 px-4 py-2' },
            React.createElement('div', { className: 'flex items-center gap-3 flex-wrap' },
              React.createElement('span', { className: 'text-[10px] font-semibold text-slate-400 uppercase tracking-wider' }, '行动'),
              visibleActions.map(action => {
                const now = Date.now();
                const nextAllowed = state.actionCooldowns[action.tid];
                const onCooldown = nextAllowed && now < nextAllowed;
                const canAfford = Object.entries(action.cost).every(([resKey, cost]) =>
                  toNumber(state.resources[resKey]) >= toNumber(cost)
                );

                const costText = Object.entries(action.cost)
                  .map(([resKey, cost]) => `${formatNumber(cost)} ${resourceMap.get(resKey)?.label || resKey}`)
                  .join(' / ');

                const buttonClass = canAfford && !onCooldown
                  ? 'px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border-l-2 border-amber-500 text-amber-100 transition-all'
                  : 'px-3 py-1.5 bg-black/30 text-slate-400 cursor-not-allowed';

                // Calculate cooldown progress
                let cooldownProgress = 0;
                let remainingSeconds = 0;
                if (onCooldown && action.cooldown > 0) {
                  const elapsed = now - (nextAllowed - action.cooldown * 1000);
                  cooldownProgress = Math.max(0, Math.min(100, (elapsed / (action.cooldown * 1000)) * 100));
                  remainingSeconds = Math.ceil((nextAllowed - now) / 1000);
                }

                return React.createElement('button', {
                  key: action.tid,
                  className: buttonClass + ' relative overflow-hidden',
                  onClick: () => handleAction(action.tid),
                  disabled: !canAfford || onCooldown,
                  title: action.description
                },
                  // Cooldown progress bar background
                  onCooldown && React.createElement('div', {
                    className: 'absolute inset-0 bg-amber-500/10',
                    style: { width: `${cooldownProgress}%` }
                  }),
                  React.createElement('div', { className: 'flex items-center gap-2 relative z-10' },
                    React.createElement('span', { className: 'text-xs font-medium' }, action.label),
                    React.createElement('span', { className: 'text-[10px] opacity-70' },
                      onCooldown ? `${remainingSeconds}s` : costText
                    )
                  )
                );
              })
            )
          )
        ),

        // Right: Buildings and Jobs (split vertically)
        React.createElement('div', { className: 'flex flex-col overflow-hidden border-l border-white/10' },
          // Buildings (top half)
          React.createElement('section', { className: 'flex-1 bg-black/20 p-3 overflow-y-auto border-b border-white/10' },
            React.createElement('h2', { className: 'text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider' },
              '建筑 ',
              React.createElement('span', { className: 'text-slate-500' }, `(${visibleBuildings.length})`)
            ),
            React.createElement('div', { className: 'space-y-1' },
              visibleBuildings.map(building => {
                const current = state.buildings[building.tid] || 0;
                const canAfford = Object.entries(building.cost).every(([resKey, cost]) =>
                  toNumber(state.resources[resKey]) >= toNumber(cost)
                );
                const atMax = building.maxCount > 0 && current >= building.maxCount;
                const canBuild = canAfford && (!atMax || building.repeatable);

                const costText = Object.entries(building.cost)
                  .map(([resKey, cost]) => `${resourceMap.get(resKey)?.label || resKey}: ${formatNumber(cost)}`)
                  .join(', ');

                return React.createElement(ListItem, {
                  key: building.tid,
                  title: `${building.label} × ${current}`,
                  subtitle: costText,
                  tone: canBuild ? 'action' : 'default',
                  onClick: () => handleBuildBuilding(building.tid),
                  disabled: !canBuild
                });
              })
            )
          ),

          // Jobs (bottom half)
          React.createElement('section', { className: 'flex-1 bg-black/20 p-3 overflow-y-auto' },
            React.createElement('h2', { className: 'text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider' },
              '职业 ',
              React.createElement('span', { className: 'text-slate-500' }, `(闲置: ${idleVillagers})`)
            ),
            React.createElement('div', { className: 'space-y-1' },
              visibleJobs.map(job => {
                const current = state.jobs[job.tid] || 0;
                const canIncrease = idleVillagers > 0;
                const canDecrease = current > 0;

                return React.createElement('div', { key: job.tid, className: 'bg-black/30 p-2' },
                  React.createElement('div', { className: 'flex items-center justify-between' },
                    React.createElement('div', { className: 'flex-1 min-w-0' },
                      React.createElement('p', { className: 'text-xs font-medium text-slate-200' }, job.label)
                    ),
                    React.createElement('div', { className: 'flex items-center gap-1.5 ml-2' },
                      React.createElement('button', {
                        onClick: () => handleAssignJob(job.tid, -1),
                        disabled: !canDecrease,
                        className: 'w-5 h-5 flex items-center justify-center bg-black/60 text-slate-300 hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed text-xs'
                      }, '-'),
                      React.createElement('span', { className: 'text-xs font-semibold text-slate-100 w-6 text-center' }, current),
                      React.createElement('button', {
                        onClick: () => handleAssignJob(job.tid, 1),
                        disabled: !canIncrease,
                        className: 'w-5 h-5 flex items-center justify-center bg-black/60 text-slate-300 hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed text-xs'
                      }, '+')
                    )
                  )
                );
              })
            )
          )
        )
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(React.createElement(App));