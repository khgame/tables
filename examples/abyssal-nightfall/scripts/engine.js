import { GameDom } from './core/dom.js';
import { AssetManager } from './core/assets.js';
import { GameState } from './battle/state.js';
import { StageController } from './stage/StageController.js';
import { ProgressionManager } from './progression/ProgressionManager.js';
import { CombatRuntime } from './battle/CombatRuntime.js';
import { tableToArray as tableToArrayCore } from './core/resources.js';
import { formatTime } from './core/utils.js';
const dom = new GameDom();
const state = new GameState();
const assets = new AssetManager();
const stage = new StageController(state, dom, assets);
const emptyLibrary = {
    operators: [],
    weapons: [],
    relics: [],
    enemies: [],
    bosses: [],
    waves: [],
    skillTree: [],
    synergyCards: []
};
let runtime;
const progression = new ProgressionManager(state, dom, () => runtime.getLibrary() ?? emptyLibrary, assets);
runtime = new CombatRuntime(state, dom, assets, stage, progression);
export async function ensureResources() {
    return runtime.ensureResources();
}
export async function startGame(preset = {}, options = {}) {
    await runtime.startGame(preset, options);
}
export function configureLifecycle(partial) {
    runtime.configureLifecycle(partial);
}
export function getCurrentPreset() {
    return runtime.getPreset();
}
export function getLastSummary() {
    return runtime.getLastSummary();
}
export function tableToArray(resource) {
    return tableToArrayCore(resource);
}
export { formatTime };
export function stopBgm() {
    runtime.stopBgm();
}
