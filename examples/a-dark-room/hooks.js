/**
 * 自定义React Hooks模块
 * 职责：封装状态管理、持久化、游戏循环等逻辑
 */

window.ADRHooks = window.ADRHooks || {};

const { migrateRecordKeys, migrateSetValues } = window.ADRDataTransform;
const { toNumber } = window.ADRUtils;
const { advanceState } = window.ADRGameLogic;

const React = window.React;
const { useState, useEffect, useRef, useCallback } = React;

const STORAGE_KEY = 'adr-tables-demo-v1';

window.ADRHooks.useGameState = (initialStateFactory, buildingKeyToTid, actionKeyToTid, eventKeyToTid) => {
  const loadState = useCallback(() => {
    const base = initialStateFactory();

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return base;

      const parsed = JSON.parse(raw);

      Object.assign(base.resources, parsed.resources || {});
      base.buildings = migrateRecordKeys(parsed.buildings || {}, buildingKeyToTid);
      base.jobs = migrateRecordKeys(parsed.jobs || {}, {});
      base.actionCooldowns = migrateRecordKeys(parsed.actionCooldowns || {}, actionKeyToTid);
      base.eventCooldowns = migrateRecordKeys(parsed.eventCooldowns || {}, eventKeyToTid);
      base.eventsTriggered = migrateSetValues(parsed.eventsTriggered || [], eventKeyToTid);
      base.permanentUnlocks = {
        actions: migrateSetValues(parsed.permanentUnlocks?.actions || [], actionKeyToTid),
        jobs: migrateSetValues(parsed.permanentUnlocks?.jobs || [], {}),
        buildings: migrateSetValues(parsed.permanentUnlocks?.buildings || [], buildingKeyToTid)
      };
      base.log = (parsed.log || []).slice(-100);
      base.lastTimestamp = parsed.timestamp || Date.now();
      base.achievementsUnlocked = migrateSetValues(parsed.achievementsUnlocked || [], {});

      return base;
    } catch (err) {
      console.warn('[adr] failed to load save', err);
      return base;
    }
  }, [initialStateFactory, buildingKeyToTid, actionKeyToTid, eventKeyToTid]);

  const [state, setState] = useState(loadState);
  const stateRef = useRef(state);
  stateRef.current = state;

  return { state, setState, stateRef };
};

window.ADRHooks.useAutoSave = (stateRef, autosaveIntervalSeconds) => {
  useEffect(() => {
    const saveState = () => {
      const current = stateRef.current;
      const payload = {
        resources: current.resources,
        buildings: current.buildings,
        jobs: current.jobs,
        actionCooldowns: current.actionCooldowns,
        eventCooldowns: current.eventCooldowns,
        eventsTriggered: Array.from(current.eventsTriggered),
        permanentUnlocks: {
          actions: Array.from(current.permanentUnlocks.actions),
          jobs: Array.from(current.permanentUnlocks.jobs),
          buildings: Array.from(current.permanentUnlocks.buildings)
        },
        log: current.log,
        timestamp: current.lastTimestamp,
        achievementsUnlocked: Array.from(current.achievementsUnlocked)
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (err) {
        console.warn('[adr] save failed', err);
      }
    };

    const intervalMs = Math.max(5, toNumber(autosaveIntervalSeconds) || 30) * 1000;
    const timer = setInterval(saveState, intervalMs);
    window.addEventListener('beforeunload', saveState);

    return () => {
      clearInterval(timer);
      window.removeEventListener('beforeunload', saveState);
    };
  }, [stateRef, autosaveIntervalSeconds]);
};

window.ADRHooks.useGameTick = (helpers, baseTickSeconds, offlineCapSeconds, forceUpdate) => {
  useEffect(() => {
    const intervalMs = Math.max(250, (toNumber(baseTickSeconds) || 1) * 500);
    const offlineLimit = Math.max(0, toNumber(offlineCapSeconds) || 0);

    const current = helpers.stateRef.current;
    const now = Date.now();
    const elapsed = Math.max(0, (now - (current.lastTimestamp || now)) / 1000);
    if (elapsed > 0.1) {
      const capped = offlineLimit > 0 ? Math.min(elapsed, offlineLimit) : elapsed;
      if (capped > 0) {
        const delta = advanceState(current, capped, helpers);
        current.lastTimestamp = Date.now();
        const gains = Object.entries(delta)
          .filter(([, value]) => toNumber(value) > 0)
          .slice(0, 3)
          .map(([key, value]) => {
            const label = helpers.resourceMap?.get?.(key)?.label || key;
            return `${label}+${toNumber(value).toFixed(1)}`;
          })
          .join(', ');
        if (helpers.pushLog) {
          helpers.pushLog(
            current,
            gains ? `离线收益 ${Math.round(capped)}s：${gains}` : `离线收益 ${Math.round(capped)}s 已结算`,
            Date.now(),
            helpers.logLimit || 100
          );
        }
        forceUpdate(x => x + 1);
      }
    }

    let last = Date.now();

    const tickInterval = setInterval(() => {
      const nowTick = Date.now();
      const dt = Math.max(0, (nowTick - last) / 1000);
      last = nowTick;

      if (dt <= 0) return;

      const currentState = helpers.stateRef.current;
      advanceState(currentState, dt, helpers);
      currentState.lastTimestamp = nowTick;
      forceUpdate(x => x + 1);
    }, intervalMs);

    return () => clearInterval(tickInterval);
  }, [helpers, baseTickSeconds, offlineCapSeconds, forceUpdate]);
};

window.ADRHooks.useResetGame = () => {
  return useCallback(() => {
    if (!confirm('确定要重置游戏吗?所有进度将丢失。')) return;
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }, []);
};
