import { GameDom } from './core/dom';
import { AssetManager } from './core/assets';
import { GameState } from './battle/state';
import { StageController } from './stage/StageController';
import { ProgressionManager } from './progression/ProgressionManager';
import { CombatRuntime } from './battle/CombatRuntime';
import { tableToArray as tableToArrayCore } from './core/resources';
import { formatTime } from './core/utils';
import type { GamePreset, GameSummary, LifecycleHooks, GameResources, GameLibrary } from './core/types';

const dom = new GameDom();
const state = new GameState();
const assets = new AssetManager();
const stage = new StageController(state, dom, assets);
const emptyLibrary: GameLibrary = {
  operators: [],
  weapons: [],
  relics: [],
  enemies: [],
  bosses: [],
  waves: [],
  skillTree: [],
  synergyCards: []
};
let runtime: CombatRuntime;
const progression = new ProgressionManager(state, dom, () => runtime.getLibrary() ?? emptyLibrary, assets);
runtime = new CombatRuntime(state, dom, assets, stage, progression);

export async function ensureResources(): Promise<GameResources> {
  return runtime.ensureResources();
}

export async function startGame(preset: GamePreset = {}, options: { lifecycle?: LifecycleHooks } = {}): Promise<void> {
  await runtime.startGame(preset, options);
}

export function configureLifecycle(partial: LifecycleHooks): void {
  runtime.configureLifecycle(partial);
}

export function getCurrentPreset(): GamePreset | null {
  return runtime.getPreset();
}

export function getLastSummary(): GameSummary | null {
  return runtime.getLastSummary();
}

export function tableToArray<T>(resource: any): T[] {
  return tableToArrayCore(resource as any) as T[];
}

export { formatTime };

export function stopBgm(): void {
  runtime.stopBgm();
}

export type { GamePreset, GameSummary, LifecycleHooks };
