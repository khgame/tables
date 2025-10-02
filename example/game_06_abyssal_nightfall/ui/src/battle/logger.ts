import { formatTime } from '../core/utils';
import type { GameDom } from '../core/dom';
import type { GameState } from './state';

export function pushLog(state: GameState, dom: GameDom, message: string): void {
  state.logs.unshift(`[${formatTime(state.time)}] ${message}`);
  state.logs = state.logs.slice(0, 10);
  dom.eventFeedEl.innerHTML = state.logs.map(entry => `<div>${entry}</div>`).join('');
}
